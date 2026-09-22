const { Shift } = require('../model/shift');
const { LeaveRequest } = require('../model/leaveRequest');
const { Profile } = require('../model/profile');

class ScheduleRuleEngine {
  /**
   * Validate a shift assignment for a nurse.
   * @param {Object} shift - The shift being assigned.
   * @param {String} nurseId - The ID of the nurse.
   * @returns {Array} - Array of violation strings. Empty if valid.
   */
  static async validateAssignment(shift, nurseId) {
    const violations = [];

    // Fetch necessary data
    const profile = await Profile.findOne({ user: nurseId });
    if (!profile) {
      violations.push("Nurse profile not found.");
      return violations;
    }

    const targetDate = new Date(shift.date);
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay()); // Sunday as start
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    // 1. Fetch all shifts for the nurse around the target date
    const weekShifts = await Shift.find({
      nurse: nurseId,
      date: { $gte: startOfWeek, $lt: endOfWeek },
      status: { $ne: 'Cancelled' }
    }).sort({ date: 1, startTime: 1 });

    const allRecentShifts = await Shift.find({
      nurse: nurseId,
      date: { 
        $gte: new Date(new Date(targetDate).setDate(targetDate.getDate() - 10)),
        $lte: new Date(new Date(targetDate).setDate(targetDate.getDate() + 10))
      },
      status: { $ne: 'Cancelled' }
    }).sort({ date: 1, startTime: 1 });

    // Include the new shift in our checks
    const simulatedShifts = [...allRecentShifts, shift].sort((a, b) => {
      const dateA = new Date(a.date).setHours(...a.startTime.split(':'));
      const dateB = new Date(b.date).setHours(...b.startTime.split(':'));
      return dateA - dateB;
    });

    // Rule 1: Min 11 hours rest between two shifts
    // Rule 6: Nurse cannot hold two shifts on the same date
    let totalWeeklyHours = 0;
    
    // Calculate weekly hours just for the week of the shift
    const simulatedWeekShifts = [...weekShifts, shift];
    simulatedWeekShifts.forEach(s => {
      const start = new Date(s.date).setHours(...s.startTime.split(':'));
      let end = new Date(s.date).setHours(...s.endTime.split(':'));
      if (end <= start) end += 24 * 60 * 60 * 1000; // overnight shift
      totalWeeklyHours += (end - start) / 3600000;
    });

    for (let i = 0; i < simulatedShifts.length - 1; i++) {
      const current = simulatedShifts[i];
      const next = simulatedShifts[i + 1];

      // Same date check
      if (new Date(current.date).toDateString() === new Date(next.date).toDateString()) {
        if (!violations.includes("A nurse cannot hold two shifts on the same date.")) {
          violations.push("A nurse cannot hold two shifts on the same date.");
        }
      }

      // Rest check
      let currentEnd = new Date(current.date).setHours(...current.endTime.split(':'));
      if (current.endTime <= current.startTime) currentEnd += 24 * 60 * 60 * 1000;
      
      let nextStart = new Date(next.date).setHours(...next.startTime.split(':'));
      
      const restHours = (nextStart - currentEnd) / 3600000;
      if (restHours >= 0 && restHours < 11) {
        if (!violations.includes("Minimum 11 hours rest between two shifts is required.")) {
          violations.push(`Minimum 11 hours rest between two shifts is required. (Found ${restHours.toFixed(1)} hours)`);
        }
      }
    }

    // Rule 4: Maximum 48 working hours per week
    if (totalWeeklyHours > 48) {
      violations.push(`Maximum 48 working hours per week exceeded (Total: ${totalWeeklyHours}h).`);
    }

    // Rule 2 & 3: Consecutive nights & consecutive working days
    let maxConsecutiveNights = 0;
    let currentConsecutiveNights = 0;
    let maxConsecutiveDays = 0;
    let currentConsecutiveDays = 0;
    let lastDate = null;

    simulatedShifts.forEach(s => {
      const sDate = new Date(s.date).setHours(0, 0, 0, 0);
      
      if (lastDate) {
        const diffDays = (sDate - lastDate) / (1000 * 60 * 60 * 24);
        if (diffDays === 1) {
          currentConsecutiveDays++;
        } else if (diffDays > 1) {
          currentConsecutiveDays = 1;
        }
      } else {
        currentConsecutiveDays = 1;
      }

      if (currentConsecutiveDays > maxConsecutiveDays) maxConsecutiveDays = currentConsecutiveDays;

      if (s.shiftType === 'Night') {
        currentConsecutiveNights++;
        if (currentConsecutiveNights > maxConsecutiveNights) maxConsecutiveNights = currentConsecutiveNights;
      } else {
        currentConsecutiveNights = 0;
      }
      
      lastDate = sDate;
    });

    if (maxConsecutiveNights > 3) {
      violations.push("No more than 3 consecutive night shifts allowed.");
    }
    if (maxConsecutiveDays > 6) {
      violations.push("No more than 6 consecutive working days allowed.");
    }

    // Rule 5: Approved leave check
    const leaves = await LeaveRequest.find({
      nurse: nurseId,
      status: 'Approved',
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    });
    if (leaves.length > 0) {
      violations.push("A nurse on approved leave cannot be assigned a shift.");
    }

    // Rule 8: Certification expiration check for ICU / ER
    if (['ICU', 'ER', 'Emergency'].includes(shift.department)) {
      if (profile.certifications && profile.certifications.some(c => c.status === 'Expired')) {
        violations.push("A nurse with an expired certification cannot be assigned to ICU or Emergency.");
      }
    }

    // Rule 7: Skill mix (approximate check: we assume ICU needs 2 ACLS nurses)
    // To do this perfectly we'd need to check all other nurses on this shift.
    // We will skip full simulation of this for now unless it's a swap, but if this assignment breaks it, 
    // it's actually adding a nurse so it shouldn't break minimums unless it's a removal.
    // We will validate skill mix in the swap/remove operations.

    return violations;
  }
}

module.exports = ScheduleRuleEngine;
