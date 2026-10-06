const router = require('express').Router();
const auth = require('../middleware/auth');
const { User } = require('../model/user');
const { Shift } = require('../model/shift');
const { LeaveRequest } = require('../model/leaveRequest');
const { Profile } = require('../model/profile');
const { Notification } = require('../model/notification');

// ── Gemini AI Service (with graceful fallback) ──────────────────────────────
const callGeminiAI = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return null; // Signal to use fallback
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 }
        })
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text;
  } catch (err) {
    console.warn('[AI] Gemini API call failed:', err.message);
    return null;
  }
};

// ── Helper: Parse Gemini JSON response ──────────────────────────────────────
const parseGeminiJSON = (text) => {
  try {
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    if (jsonMatch) return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    return JSON.parse(text);
  } catch {
    return null;
  }
};

// ── @route  POST /api/ai/schedule ────────────────────────────────────────────
// ── @desc   Generate AI-powered shift schedule recommendations ───────────────
router.post('/schedule', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'head_nurse') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const {
      startDate,
      endDate,
      department,
      requiredPerShift = 1
    } = req.body;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Fetch nurses and their data
    const nurseQuery = { role: { $in: ['nurse', 'head_nurse'] } };
    if (department && department !== 'All') nurseQuery.department = department;

    const nurses = await User.find(nurseQuery).select('-passwordHash');
    const profiles = await Profile.find({ user: { $in: nurses.map(n => n._id) } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });

    // Get approved leaves in date range
    const approvedLeaves = await LeaveRequest.find({
      status: 'Approved',
      startDate: { $lte: end },
      endDate: { $gte: start }
    }).populate('nurse', 'username department');

    // Get existing shifts in range
    const existingShifts = await Shift.find({
      date: { $gte: start, $lte: end }
    }).populate('nurse', 'username');

    // Calculate workload (hours already assigned)
    const workloadMap = {};
    existingShifts.forEach(s => {
      const nId = s.nurse?._id?.toString() || s.nurse?.toString();
      if (!workloadMap[nId]) workloadMap[nId] = 0;
      workloadMap[nId] += 8;
    });

    const onLeaveSet = new Set(approvedLeaves.map(l => l.nurse?._id?.toString() || l.nurse?.toString()));

    const nurseContext = nurses.map(n => ({
      id: n._id,
      name: n.username,
      department: n.department,
      employeeId: n.employeeId,
      shiftPreference: profileMap[n._id.toString()]?.shiftPreference || 'Flexible',
      currentHours: workloadMap[n._id.toString()] || 0,
      onLeave: onLeaveSet.has(n._id.toString()),
      qualifications: profileMap[n._id.toString()]?.qualifications || []
    }));

    const shiftTypes = ['Morning', 'Evening', 'Night'];
    const shiftTimes = {
      Morning: { start: '06:00', end: '14:00' },
      Evening: { start: '14:00', end: '22:00' },
      Night:   { start: '22:00', end: '06:00' }
    };

    let recommendations = [];
    let aiMode = 'ai';

    // Try Gemini AI first
    const prompt = `You are an expert hospital nurse scheduling AI. 
Generate an optimal shift schedule for the following nurses and date range.

Date Range: ${start.toDateString()} to ${end.toDateString()}
Department: ${department || 'All'}

Nurses Available:
${JSON.stringify(nurseContext, null, 2)}

Rules:
1. Nurses on approved leave must NOT be assigned
2. Prefer nurses whose shift preference matches
3. Balance workload — nurses with lower hours should get more shifts
4. Avoid assigning more than 3 consecutive night shifts
5. Maximum 48 working hours per week
6. Require ${requiredPerShift} nurse(s) per shift per day

Return a JSON array of recommendations:
[{
  "nurseId": "<id>",
  "nurseName": "<name>",
  "date": "<YYYY-MM-DD>",
  "shiftType": "Morning|Evening|Night",
  "department": "<department>",
  "reason": "<brief explanation>",
  "workloadScore": <0-100, higher = heavier load>,
  "conflictStatus": "OK|Warning|Conflict",
  "conflictDetail": "<detail if any>"
}]

Only return the JSON array, no other text.`;

    const geminiResponse = await callGeminiAI(prompt);

    if (geminiResponse) {
      const parsed = parseGeminiJSON(geminiResponse);
      if (parsed && Array.isArray(parsed)) {
        recommendations = parsed;
        aiMode = 'gemini';
      }
    }

    // Fallback: rule-based schedule generation
    if (recommendations.length === 0) {
      aiMode = 'rule-based';
      const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
      const availableNurses = nurseContext.filter(n => !n.onLeave);

      for (let d = 0; d < days; d++) {
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + d);
        const dateStr = currentDate.toISOString().split('T')[0];

        for (const shiftType of shiftTypes) {
          // Sort nurses by: not on leave, department match (if specified), then lowest hours
          const eligible = availableNurses
            .filter(n => !onLeaveSet.has(n.id.toString()))
            .sort((a, b) => {
              const aMatch = department ? (a.department === department ? -1 : 1) : 0;
              const bMatch = department ? (b.department === department ? -1 : 1) : 0;
              if (aMatch !== bMatch) return aMatch - bMatch;
              const aPref = a.shiftPreference === shiftType ? -1 : a.shiftPreference === 'Flexible' ? 0 : 1;
              const bPref = b.shiftPreference === shiftType ? -1 : b.shiftPreference === 'Flexible' ? 0 : 1;
              if (aPref !== bPref) return aPref - bPref;
              return a.currentHours - b.currentHours;
            });

          const assigned = eligible.slice(0, requiredPerShift);
          for (const nurse of assigned) {
            const workloadScore = Math.min(100, Math.round((nurse.currentHours / 48) * 100));
            recommendations.push({
              nurseId: nurse.id,
              nurseName: nurse.name,
              date: dateStr,
              shiftType,
              department: nurse.department,
              reason: nurse.shiftPreference === shiftType
                ? `Matches nurse's preferred shift type (${shiftType})`
                : `Assigned based on lowest workload (${nurse.currentHours}h this week)`,
              workloadScore,
              conflictStatus: onLeaveSet.has(nurse.id.toString()) ? 'Conflict' : workloadScore > 80 ? 'Warning' : 'OK',
              conflictDetail: onLeaveSet.has(nurse.id.toString()) ? 'Nurse is on approved leave' : workloadScore > 80 ? 'High workload this week' : ''
            });
            nurse.currentHours += 8; // Update local workload for next iteration
          }
        }
      }
    }

    res.json({
      mode: aiMode,
      generatedAt: new Date(),
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      department: department || 'All',
      totalRecommendations: recommendations.length,
      recommendations,
      onLeave: approvedLeaves.map(l => ({
        nurseName: l.nurse?.username,
        from: l.startDate,
        to: l.endDate
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'AI scheduling error: ' + err.message });
  }
});

// ── @route  GET /api/ai/workload ─────────────────────────────────────────────
// ── @desc   Calculate and analyze nurse workload distribution ────────────────
router.get('/workload', auth, async (req, res) => {
  try {
    const { department, period = '7' } = req.query;
    const days = parseInt(period) || 7;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const nurseQuery = { role: { $in: ['nurse', 'head_nurse'] } };
    if (department && department !== 'All') nurseQuery.department = department;
    const nurses = await User.find(nurseQuery).select('-passwordHash');

    const workloadData = await Promise.all(nurses.map(async (nurse) => {
      const shifts = await Shift.find({
        nurse: nurse._id,
        date: { $gte: startDate },
        status: { $ne: 'Cancelled' }
      });

      const nightShifts = shifts.filter(s => s.shiftType === 'Night').length;
      const weekendShifts = shifts.filter(s => {
        const day = new Date(s.date).getDay();
        return day === 0 || day === 6;
      }).length;

      const totalHours = shifts.length * 8;

      // Consecutive shift analysis
      let maxConsecutive = 0;
      let current = 0;
      let lastDate = null;
      shifts.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(s => {
        const d = new Date(s.date).setHours(0, 0, 0, 0);
        if (lastDate && (d - lastDate) === 86400000) {
          current++;
          maxConsecutive = Math.max(maxConsecutive, current);
        } else {
          current = 1;
        }
        lastDate = d;
      });

      return {
        nurseId: nurse._id,
        nurseName: nurse.username,
        department: nurse.department,
        employeeId: nurse.employeeId,
        totalShifts: shifts.length,
        totalHours,
        nightShifts,
        weekendShifts,
        maxConsecutiveShifts: maxConsecutive,
        workloadScore: Math.min(100, Math.round((totalHours / (days * 24 / 3)) * 100)),
        status: totalHours > 48 ? 'Overloaded' : totalHours > 32 ? 'High' : totalHours > 16 ? 'Moderate' : 'Low'
      };
    }));

    // Sort by hours descending
    workloadData.sort((a, b) => b.totalHours - a.totalHours);

    const avgHours = workloadData.length > 0
      ? workloadData.reduce((sum, n) => sum + n.totalHours, 0) / workloadData.length
      : 0;

    // AI recommendation
    const underloaded = workloadData.filter(n => n.totalHours < avgHours * 0.7);
    const overloaded = workloadData.filter(n => n.totalHours > avgHours * 1.3);

    let aiRecommendation = '';
    if (overloaded.length > 0 && underloaded.length > 0) {
      aiRecommendation = `${overloaded[0].nurseName} has a high workload (${overloaded[0].totalHours}h). Consider redistributing shifts to ${underloaded[0].nurseName} (${underloaded[0].totalHours}h) for better workload balance.`;
    } else if (overloaded.length > 0) {
      aiRecommendation = `${overloaded[0].nurseName} has ${overloaded[0].totalHours} working hours this period — approaching overload threshold. Consider reducing their shifts.`;
    } else {
      aiRecommendation = `Workload distribution looks balanced across all ${workloadData.length} nurses this ${days}-day period.`;
    }

    res.json({
      period: `${days} days`,
      averageHours: Math.round(avgHours),
      nurses: workloadData,
      aiRecommendation,
      alerts: {
        overloaded: overloaded.map(n => n.nurseName),
        underloaded: underloaded.map(n => n.nurseName)
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Workload analysis error: ' + err.message });
  }
});

// ── @route  GET /api/ai/insights ─────────────────────────────────────────────
// ── @desc   Get AI workforce insights for admin dashboard ────────────────────
router.get('/insights', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);

    const nurses = await User.find({ role: { $in: ['nurse', 'head_nurse'] } });
    const totalNurses = nurses.length;

    // Today's shifts
    const todayShifts = await Shift.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $ne: 'Cancelled' }
    }).populate('nurse', 'department');

    // Upcoming leaves
    const upcomingLeaves = await LeaveRequest.find({
      status: 'Approved',
      startDate: { $gte: today, $lte: nextWeek }
    }).populate('nurse', 'username department');

    // Departments with low coverage today
    const depts = ['ICU', 'Emergency', 'General Ward', 'Pediatrics', 'Cardiology'];
    const deptShiftMap = {};
    todayShifts.forEach(s => {
      const dept = s.nurse?.department || 'Unknown';
      deptShiftMap[dept] = (deptShiftMap[dept] || 0) + 1;
    });

    const lowStaffingDepts = depts.filter(d => (deptShiftMap[d] || 0) < 2);

    // Night shift load analysis
    const nightShifts = await Shift.find({
      date: { $gte: today, $lte: nextWeek },
      shiftType: 'Night',
      status: { $ne: 'Cancelled' }
    });

    const insights = [];

    if (lowStaffingDepts.length > 0) {
      insights.push({
        type: 'staffing_alert',
        severity: 'High',
        icon: '🚨',
        message: `Potential staffing shortage detected in ${lowStaffingDepts.join(', ')} for today's shifts.`,
        action: 'Review and assign additional nurses to cover these departments.'
      });
    }

    if (upcomingLeaves.length >= 3) {
      insights.push({
        type: 'leave_alert',
        severity: 'Medium',
        icon: '📅',
        message: `${upcomingLeaves.length} nurses have approved leave during the next 7 days. Peak coverage may be affected.`,
        action: 'Consider AI scheduling to redistribute shifts for the leave period.'
      });
    }

    if (nightShifts.length > 0) {
      const nightNurseMap = {};
      nightShifts.forEach(s => {
        const nId = s.nurse?.toString();
        nightNurseMap[nId] = (nightNurseMap[nId] || 0) + 1;
      });
      const heavyNight = Object.values(nightNurseMap).filter(c => c >= 3).length;
      if (heavyNight > 0) {
        insights.push({
          type: 'workload_alert',
          severity: 'Medium',
          icon: '🌙',
          message: `${heavyNight} nurse(s) have 3+ night shifts scheduled this week. High fatigue risk detected.`,
          action: 'Redistribute night shifts to improve workload balance and prevent burnout.'
        });
      }
    }

    const openShifts = await Shift.countDocuments({
      date: { $gte: today },
      status: 'Scheduled',
      nurse: { $exists: false }
    });

    if (openShifts > 0) {
      insights.push({
        type: 'open_shift',
        severity: 'High',
        icon: '⚠️',
        message: `${openShifts} open shifts still need nurse assignments in the upcoming schedule.`,
        action: 'Use AI Scheduling to auto-assign nurses to open shifts.'
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'all_clear',
        severity: 'Low',
        icon: '✅',
        message: `All departments are adequately staffed. Current workforce distribution looks optimal.`,
        action: null
      });
    }

    // Staffing risk score
    const riskScore = lowStaffingDepts.length > 0
      ? lowStaffingDepts.length >= 3 ? 'Critical' : 'High'
      : upcomingLeaves.length >= 3 ? 'Medium' : 'Low';

    res.json({
      generatedAt: new Date(),
      staffingRisk: riskScore,
      todayNursesOnDuty: todayShifts.length,
      upcomingLeavesCount: upcomingLeaves.length,
      openShiftsCount: openShifts,
      insights,
      upcomingLeaves: upcomingLeaves.map(l => ({
        nurseName: l.nurse?.username,
        department: l.nurse?.department,
        from: l.startDate,
        to: l.endDate
      }))
    });
  } catch (err) {
    res.status(500).json({ message: 'AI insights error: ' + err.message });
  }
});

// ── @route  POST /api/ai/swap-recommendation ─────────────────────────────────
// ── @desc   Get AI-recommended nurses for a shift swap ───────────────────────
router.post('/swap-recommendation', auth, async (req, res) => {
  try {
    const { shiftId } = req.body;
    if (!shiftId) return res.status(400).json({ message: 'shiftId is required' });

    const shift = await Shift.findById(shiftId).populate('nurse', 'username department');
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    // Find approved leaves on that date
    const leavesOnDate = await LeaveRequest.find({
      status: 'Approved',
      startDate: { $lte: shift.date },
      endDate: { $gte: shift.date }
    });
    const onLeaveIds = new Set(leavesOnDate.map(l => l.nurse.toString()));

    // Find nurses already working that day
    const alreadyWorkingIds = new Set();
    const sameDay = await Shift.find({
      date: shift.date,
      status: { $ne: 'Cancelled' }
    });
    sameDay.forEach(s => alreadyWorkingIds.add(s.nurse.toString()));

    // Get candidates (same department preferred, not on leave, not already working)
    const candidates = await User.find({
      _id: { $ne: shift.nurse._id },
      role: { $in: ['nurse', 'head_nurse'] }
    }).select('-passwordHash');

    const profiles = await Profile.find({ user: { $in: candidates.map(c => c._id) } });
    const profileMap = {};
    profiles.forEach(p => { profileMap[p.user.toString()] = p; });

    // Calculate workload for candidates
    const weekStart = new Date(shift.date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const recommendations = [];

    for (const nurse of candidates) {
      const nId = nurse._id.toString();
      if (onLeaveIds.has(nId) || alreadyWorkingIds.has(nId)) continue;

      const weekShifts = await Shift.countDocuments({
        nurse: nurse._id,
        date: { $gte: weekStart, $lt: weekEnd },
        status: { $ne: 'Cancelled' }
      });
      const profile = profileMap[nId];
      const weeklyHours = weekShifts * 8;

      const sameDept = nurse.department === shift.department;
      const prefMatch = profile?.shiftPreference === shift.shiftType || profile?.shiftPreference === 'Flexible';
      const skillsMatch = profile?.qualifications?.length > 0;

      // Score: lower is better
      let score = weeklyHours;
      if (!sameDept) score += 20;
      if (!prefMatch) score += 10;

      recommendations.push({
        nurseId: nurse._id,
        nurseName: nurse.username,
        department: nurse.department,
        employeeId: nurse.employeeId,
        shiftPreference: profile?.shiftPreference || 'Flexible',
        weeklyHours,
        sameDepartment: sameDept,
        preferenceMatch: prefMatch,
        score,
        reason: sameDept && prefMatch
          ? `Works in the same department and prefers ${shift.shiftType} shifts. Low workload (${weeklyHours}h this week).`
          : sameDept
          ? `Same department. Available with ${weeklyHours}h workload this week.`
          : `Available with ${weeklyHours}h workload. Can cover cross-department.`,
        recommended: sameDept && weeklyHours < 40
      });
    }

    // Sort by score (best first)
    recommendations.sort((a, b) => a.score - b.score);

    res.json({
      shift: {
        id: shift._id,
        date: shift.date,
        shiftType: shift.shiftType,
        department: shift.department,
        currentNurse: shift.nurse?.username
      },
      recommendations: recommendations.slice(0, 5),
      onLeaveCount: onLeaveIds.size,
      alreadyWorkingCount: alreadyWorkingIds.size
    });
  } catch (err) {
    res.status(500).json({ message: 'Swap recommendation error: ' + err.message });
  }
});

// ── @route  POST /api/ai/conflict-check ──────────────────────────────────────
// ── @desc   Check schedule for conflicts before publishing ───────────────────
router.post('/conflict-check', auth, async (req, res) => {
  try {
    const { startDate, endDate, department } = req.body;
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const shiftQuery = { date: { $gte: start, $lte: end }, status: { $ne: 'Cancelled' } };
    if (department && department !== 'All') shiftQuery.department = department;

    const shifts = await Shift.find(shiftQuery).populate('nurse', 'username department');
    const approvedLeaves = await LeaveRequest.find({
      status: 'Approved',
      startDate: { $lte: end },
      endDate: { $gte: start }
    }).populate('nurse', 'username');

    const conflicts = [];
    const leaveMap = {};
    approvedLeaves.forEach(l => {
      const nId = l.nurse?._id?.toString();
      if (!leaveMap[nId]) leaveMap[nId] = [];
      leaveMap[nId].push({ from: new Date(l.startDate), to: new Date(l.endDate) });
    });

    // Check: nurse assigned during leave
    shifts.forEach(shift => {
      const nId = shift.nurse?._id?.toString();
      const nurseName = shift.nurse?.username || 'Unknown Nurse';
      const shiftDate = new Date(shift.date);

      if (leaveMap[nId]) {
        leaveMap[nId].forEach(leave => {
          if (shiftDate >= leave.from && shiftDate <= leave.to) {
            conflicts.push({
              severity: 'Critical',
              type: 'leave_conflict',
              message: `${nurseName} is assigned during approved leave on ${shiftDate.toDateString()}.`,
              shiftId: shift._id,
              nurseId: nId
            });
          }
        });
      }
    });

    // Check: double booking (same nurse, same date)
    const nurseShiftMap = {};
    shifts.forEach(shift => {
      const nId = shift.nurse?._id?.toString();
      const dateStr = new Date(shift.date).toDateString();
      const key = `${nId}_${dateStr}`;
      if (!nurseShiftMap[key]) nurseShiftMap[key] = [];
      nurseShiftMap[key].push(shift);
    });

    Object.values(nurseShiftMap).forEach(dayShifts => {
      if (dayShifts.length > 1) {
        const nurse = dayShifts[0].nurse?.username || 'Unknown';
        conflicts.push({
          severity: 'High',
          type: 'double_booking',
          message: `${nurse} is double-booked on ${new Date(dayShifts[0].date).toDateString()} — ${dayShifts.length} shifts assigned.`,
          nurseId: dayShifts[0].nurse?._id?.toString()
        });
      }
    });

    // Check dept staffing levels per day
    const depts = ['ICU', 'Emergency', 'General Ward', 'Pediatrics', 'Cardiology'];
    const days = Math.ceil((end - start) / (24 * 60 * 60 * 1000));

    for (let d = 0; d < days; d++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + d);
      const dateStr = currentDate.toDateString();

      for (const dept of depts) {
        const deptShifts = shifts.filter(s =>
          s.nurse?.department === dept &&
          new Date(s.date).toDateString() === dateStr
        );

        if (deptShifts.length === 0) {
          conflicts.push({
            severity: 'High',
            type: 'staffing_gap',
            message: `No nurses scheduled for ${dept} on ${dateStr}.`,
            department: dept,
            date: currentDate.toISOString()
          });
        } else if (deptShifts.length === 1) {
          conflicts.push({
            severity: 'Medium',
            type: 'low_staffing',
            message: `Low staffing in ${dept} on ${dateStr} — only 1 nurse scheduled.`,
            department: dept,
            date: currentDate.toISOString()
          });
        }
      }
    }

    const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
    conflicts.sort((a, b) => (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3));

    res.json({
      totalConflicts: conflicts.length,
      critical: conflicts.filter(c => c.severity === 'Critical').length,
      high: conflicts.filter(c => c.severity === 'High').length,
      medium: conflicts.filter(c => c.severity === 'Medium').length,
      conflicts,
      dateRange: { start: start.toISOString(), end: end.toISOString() },
      checkedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: 'Conflict check error: ' + err.message });
  }
});

module.exports = router;
