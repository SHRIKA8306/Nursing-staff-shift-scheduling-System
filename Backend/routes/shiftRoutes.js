const router = require('express').Router();
const { Shift, shiftValidationSchema } = require('../model/shift');
const { Notification } = require('../model/notification');
const auth = require('../middleware/auth');

// @route   GET /api/shifts/my-schedule
// @desc    Get shifts for the logged-in nurse
router.get('/my-schedule', auth, async (req, res) => {
  try {
    const shifts = await Shift.find({ nurse: req.user.id })
      .populate('nurse', 'username email department')
      .sort({ date: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching schedule: ' + err.message });
  }
});

// @route   GET /api/shifts/all
// @desc    Get all hospital shifts (For admin/head nurse)
router.get('/all', auth, async (req, res) => {
  try {
    const shifts = await Shift.find()
      .populate('nurse', 'username email department employeeId')
      .sort({ date: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching all shifts: ' + err.message });
  }
});

// @route   POST /api/shifts/assign
// @desc    Assign a new shift to a nurse (Admin / Head Nurse)
router.post('/assign', auth, async (req, res) => {
  try {
    const { error, value } = shiftValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const newShift = await Shift.create({
      nurse: value.nurseId,
      date: value.date,
      shiftType: value.shiftType,
      startTime: value.startTime || (value.shiftType === 'Morning' ? '07:00' : value.shiftType === 'Evening' ? '15:00' : '23:00'),
      endTime: value.endTime || (value.shiftType === 'Morning' ? '15:00' : value.shiftType === 'Evening' ? '23:00' : '07:00'),
      department: value.department || 'General',
      notes: value.notes || ''
    });

    await newShift.populate('nurse', 'username email department');

    // Notify assigned nurse
    await Notification.create({
      user: value.nurseId,
      title: 'New Shift Assigned',
      message: `You have been assigned a ${value.shiftType} shift on ${new Date(value.date).toLocaleDateString()}.`,
      type: 'shift_assigned'
    });

    res.status(201).json(newShift);
  } catch (err) {
    res.status(500).json({ message: 'Error assigning shift: ' + err.message });
  }
});

// @route   PUT /api/shifts/:id
// @desc    Update shift details or status
router.put('/:id', auth, async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    if (req.body.status) shift.status = req.body.status;
    if (req.body.shiftType) shift.shiftType = req.body.shiftType;
    if (req.body.date) shift.date = req.body.date;
    if (req.body.notes !== undefined) shift.notes = req.body.notes;

    await shift.save();
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: 'Error updating shift: ' + err.message });
  }
});

// @route   DELETE /api/shifts/:id
// @desc    Cancel/Delete shift
router.delete('/:id', auth, async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    res.json({ message: 'Shift deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting shift: ' + err.message });
  }
});

module.exports = router;
