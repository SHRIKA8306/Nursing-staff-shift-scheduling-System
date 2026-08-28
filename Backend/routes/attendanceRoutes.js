const router = require('express').Router();
const { Attendance, attendanceValidationSchema } = require('../model/attendance');
const auth = require('../middleware/auth');

// @route   GET /api/attendance
// @desc    Get attendance records for the nurse (or all if admin/head nurse)
router.get('/', auth, async (req, res) => {
  try {
    const filter = (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'head_nurse')
      ? {}
      : { nurse: req.user.id };

    const records = await Attendance.find(filter)
      .populate('nurse', 'username email department employeeId')
      .populate('shift')
      .sort({ checkIn: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching attendance records: ' + err.message });
  }
});

// @route   POST /api/attendance/check-in
// @desc    Clock-in for current shift
router.post('/check-in', auth, async (req, res) => {
  try {
    const { shiftId, notes } = req.body;

    // Check if already checked in today without checking out
    const existing = await Attendance.findOne({
      nurse: req.user.id,
      checkOut: { $exists: false }
    });

    if (existing) {
      return res.status(400).json({ message: 'You have an active shift check-in. Please check-out first.' });
    }

    const attendance = await Attendance.create({
      nurse: req.user.id,
      shift: shiftId || null,
      checkIn: new Date(),
      status: 'Present',
      notes: notes || ''
    });

    res.status(201).json({ message: 'Clock-in successful', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Error checking in: ' + err.message });
  }
});

// @route   POST /api/attendance/check-out
// @desc    Clock-out from shift
router.post('/check-out', auth, async (req, res) => {
  try {
    const attendance = await Attendance.findOne({
      nurse: req.user.id,
      checkOut: { $exists: false }
    }).sort({ checkIn: -1 });

    if (!attendance) {
      return res.status(400).json({ message: 'No active check-in session found to check-out from.' });
    }

    attendance.checkOut = new Date();
    await attendance.save();

    res.json({ message: 'Clock-out successful', attendance });
  } catch (err) {
    res.status(500).json({ message: 'Error checking out: ' + err.message });
  }
});

module.exports = router;
