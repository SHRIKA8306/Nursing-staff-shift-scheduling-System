const router = require('express').Router();
const { Shift } = require('../model/shift');
const auth = require('../middleware/auth');

// @route   POST /api/leaves/impact
// @desc    Compute impact of a leave request (number of overlapping shifts, department staffing)
router.post('/impact', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'startDate and endDate required' });
    }
    const lStart = new Date(startDate).setHours(0, 0, 0, 0);
    const lEnd = new Date(endDate).setHours(23, 59, 59, 999);

    // Count overlapping shifts for this nurse
    const overlappingShifts = await Shift.find({
      nurse: req.user.id,
      date: { $gte: new Date(lStart), $lte: new Date(lEnd) },
      status: { $ne: 'Cancelled' }
    });

    // Simple headcount check: assume a department needs at least 2 nurses per day (example)
    const dept = req.user.department;
    const dates = [];
    for (let d = new Date(lStart); d <= new Date(lEnd); d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    const staffingIssues = [];
    for (const day of dates) {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const count = await Shift.countDocuments({
        department: dept,
        date: { $gte: dayStart, $lte: dayEnd },
        status: { $ne: 'Cancelled' }
      });
      if (count < 2) { // arbitrary threshold
        staffingIssues.push({ date: dayStart.toISOString().split('T')[0], needed: 2, scheduled: count });
      }
    }

    res.json({ overlappingShifts: overlappingShifts.length, staffingIssues });
  } catch (err) {
    res.status(500).json({ message: 'Error calculating leave impact: ' + err.message });
  }
});

module.exports = router;
