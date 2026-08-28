const router = require('express').Router();
const { LeaveRequest, leaveValidationSchema } = require('../model/leaveRequest');
const { Notification } = require('../model/notification');
const auth = require('../middleware/auth');

// @route   GET /api/leaves
// @desc    Get leave requests for the logged-in nurse (or all if admin)
router.get('/', auth, async (req, res) => {
  try {
    const filter = (req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'head_nurse')
      ? {} 
      : { nurse: req.user.id };

    const leaves = await LeaveRequest.find(filter)
      .populate('nurse', 'username email department employeeId')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching leave requests: ' + err.message });
  }
});

// @route   POST /api/leaves/apply
// @desc    Submit a leave request
router.post('/apply', auth, async (req, res) => {
  try {
    const { error, value } = leaveValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const newLeave = await LeaveRequest.create({
      nurse: req.user.id,
      startDate: value.startDate,
      endDate: value.endDate,
      leaveType: value.leaveType || 'Casual',
      reason: value.reason
    });

    await newLeave.populate('nurse', 'username email department');

    res.status(201).json(newLeave);
  } catch (err) {
    res.status(500).json({ message: 'Error submitting leave request: ' + err.message });
  }
});

// @route   PUT /api/leaves/:id/status
// @desc    Approve or Reject leave request (Admin/Head Nurse)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await LeaveRequest.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: 'Leave request not found' });

    leave.status = status;
    await leave.save();

    // Send notification to nurse
    await Notification.create({
      user: leave.nurse,
      title: `Leave Request ${status}`,
      message: `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()} has been ${status.toLowerCase()}.`,
      type: 'leave_status'
    });

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: 'Error updating leave status: ' + err.message });
  }
});

module.exports = router;
