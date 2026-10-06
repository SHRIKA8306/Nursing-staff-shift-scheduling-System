const router = require('express').Router();
const auth = require('../middleware/auth');
const { User } = require('../model/user');
const { Shift } = require('../model/shift');
const { LeaveRequest } = require('../model/leaveRequest');
const { ShiftSwap } = require('../model/shiftSwap');
const { Attendance } = require('../model/attendance');

// @route   GET /api/reports/summary
// @desc    Get comprehensive workforce reports & analytics data
router.get('/summary', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'head_nurse') {
      return res.status(403).json({ message: 'Forbidden: Admin access required' });
    }

    const { period = 'monthly', startDate, endDate } = req.query;

    let start, end;
    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'weekly') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = now;
    } else {
      // Monthly (default)
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // ── Workforce Overview ───────────────────────────────────────────────────
    const totalNurses = await User.countDocuments({ role: { $in: ['nurse', 'head_nurse'] } });
    const totalAdmins = await User.countDocuments({ role: 'admin' });

    // ── Shift Statistics ─────────────────────────────────────────────────────
    const totalShifts = await Shift.countDocuments({ date: { $gte: start, $lte: end } });
    const completedShifts = await Shift.countDocuments({ date: { $gte: start, $lte: end }, status: 'Completed' });
    const scheduledShifts = await Shift.countDocuments({ date: { $gte: start, $lte: end }, status: 'Scheduled' });
    const cancelledShifts = await Shift.countDocuments({ date: { $gte: start, $lte: end }, status: 'Cancelled' });
    const swappedShifts = await Shift.countDocuments({ date: { $gte: start, $lte: end }, status: 'Swapped' });

    // Shift type distribution
    const morningShifts = await Shift.countDocuments({ date: { $gte: start, $lte: end }, shiftType: 'Morning' });
    const eveningShifts = await Shift.countDocuments({ date: { $gte: start, $lte: end }, shiftType: 'Evening' });
    const nightShifts   = await Shift.countDocuments({ date: { $gte: start, $lte: end }, shiftType: 'Night' });

    // Department distribution
    const depts = ['ICU', 'Emergency', 'General Ward', 'Pediatrics', 'Cardiology'];
    const deptShiftCounts = await Promise.all(
      depts.map(async dept => ({
        department: dept,
        shifts: await Shift.countDocuments({ date: { $gte: start, $lte: end }, department: dept })
      }))
    );

    // ── Leave Statistics ─────────────────────────────────────────────────────
    const totalLeaves = await LeaveRequest.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const approvedLeaves = await LeaveRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Approved' });
    const rejectedLeaves = await LeaveRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Rejected' });
    const pendingLeaves  = await LeaveRequest.countDocuments({ status: 'Pending' });

    // Leave type breakdown
    const leaveTypes = ['Sick', 'Casual', 'Annual', 'Emergency'];
    const leaveTypeBreakdown = await Promise.all(
      leaveTypes.map(async type => ({
        type,
        count: await LeaveRequest.countDocuments({ createdAt: { $gte: start, $lte: end }, leaveType: type })
      }))
    );

    // ── Swap Statistics ──────────────────────────────────────────────────────
    const totalSwaps = await ShiftSwap.countDocuments({ createdAt: { $gte: start, $lte: end } });
    const approvedSwaps = await ShiftSwap.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Approved' });
    const rejectedSwaps = await ShiftSwap.countDocuments({ createdAt: { $gte: start, $lte: end }, status: 'Rejected' });
    const pendingSwaps  = await ShiftSwap.countDocuments({ status: 'Pending' });

    // ── Attendance Statistics ─────────────────────────────────────────────────
    const totalAttendance = await Attendance.countDocuments({ checkIn: { $gte: start, $lte: end } });
    const presentCount = await Attendance.countDocuments({ checkIn: { $gte: start, $lte: end }, status: 'Present' });
    const lateCount = await Attendance.countDocuments({ checkIn: { $gte: start, $lte: end }, status: 'Late' });
    const absentCount = await Attendance.countDocuments({ checkIn: { $gte: start, $lte: end }, status: 'Absent' });

    // ── Per-Nurse Workload ───────────────────────────────────────────────────
    const nurses = await User.find({ role: { $in: ['nurse', 'head_nurse'] } }).select('-passwordHash');
    const nurseWorkload = await Promise.all(
      nurses.map(async (nurse) => {
        const shifts = await Shift.countDocuments({
          nurse: nurse._id,
          date: { $gte: start, $lte: end },
          status: { $ne: 'Cancelled' }
        });
        return {
          nurseId: nurse._id,
          nurseName: nurse.username,
          department: nurse.department,
          employeeId: nurse.employeeId,
          shifts,
          hours: shifts * 8
        };
      })
    );
    nurseWorkload.sort((a, b) => b.hours - a.hours);

    // ── Trend Data (daily breakdown) ─────────────────────────────────────────
    const trendDays = Math.min(30, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
    const dailyTrend = [];

    for (let d = 0; d < trendDays; d++) {
      const dayStart = new Date(start);
      dayStart.setDate(start.getDate() + d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayShifts = await Shift.countDocuments({ date: { $gte: dayStart, $lte: dayEnd } });
      const dayLeaves = await LeaveRequest.countDocuments({
        $or: [
          { startDate: { $gte: dayStart, $lte: dayEnd } },
          { endDate: { $gte: dayStart, $lte: dayEnd } }
        ],
        status: 'Approved'
      });

      dailyTrend.push({
        date: dayStart.toISOString().split('T')[0],
        shifts: dayShifts,
        leavesOnDuty: dayLeaves
      });
    }

    res.json({
      period: { start: start.toISOString(), end: end.toISOString(), label: period },
      generatedAt: new Date(),

      workforce: {
        totalNurses,
        totalAdmins,
        totalStaff: totalNurses + totalAdmins
      },

      shifts: {
        total: totalShifts,
        completed: completedShifts,
        scheduled: scheduledShifts,
        cancelled: cancelledShifts,
        swapped: swappedShifts,
        utilizationRate: totalShifts > 0 ? Math.round((completedShifts / totalShifts) * 100) : 0,
        byType: { morning: morningShifts, evening: eveningShifts, night: nightShifts },
        byDepartment: deptShiftCounts
      },

      leaves: {
        total: totalLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves,
        pending: pendingLeaves,
        approvalRate: totalLeaves > 0 ? Math.round((approvedLeaves / totalLeaves) * 100) : 0,
        byType: leaveTypeBreakdown
      },

      swaps: {
        total: totalSwaps,
        approved: approvedSwaps,
        rejected: rejectedSwaps,
        pending: pendingSwaps,
        approvalRate: totalSwaps > 0 ? Math.round((approvedSwaps / totalSwaps) * 100) : 0
      },

      attendance: {
        total: totalAttendance,
        present: presentCount,
        late: lateCount,
        absent: absentCount,
        attendanceRate: totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0
      },

      nurseWorkload,
      dailyTrend
    });
  } catch (err) {
    res.status(500).json({ message: 'Reports error: ' + err.message });
  }
});

module.exports = router;
