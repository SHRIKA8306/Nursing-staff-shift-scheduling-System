const router = require('express').Router();
const { LeaveRequest, leaveValidationSchema } = require('../model/leaveRequest');
const { Notification } = require('../model/notification');
const { User } = require('../model/user');
const { Profile } = require('../model/profile');
const auth = require('../middleware/auth');
const { sendApprovalEmail, sendAdminNotificationEmail } = require('../utils/emailService');
const { createInAppNotification, sendSMSNotification } = require('../services/notificationService');

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

    await newLeave.populate('nurse', 'username email department employeeId');

    const nurseName = newLeave.nurse ? newLeave.nurse.username : (req.user.username || 'Nurse');

    // 1. In-app notification for all admins
    const admins = await User.find({ role: 'admin' });
    for (const adm of admins) {
      await createInAppNotification(
        adm._id,
        'New Leave Request',
        `New leave request from Nurse ${nurseName}. Please review the request.`,
        'leave_status'
      );
    }

    // 2. Email notification to admin
    await sendAdminNotificationEmail(
      nurseName,
      'Leave Request',
      {
        startDate: value.startDate,
        endDate: value.endDate,
        leaveType: value.leaveType || 'Casual',
        reason: value.reason
      }
    );

    // 3. SMS notification to admin if configured
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
      await sendSMSNotification(
        adminPhone,
        `NurseSync Alert: New leave request from Nurse ${nurseName}. Please review in the admin dashboard.`
      );
    }

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

    if (status === 'Approved') {
      const { Shift } = require('../model/shift');
      const { AuditLog } = require('../model/auditLog');
      const lStart = new Date(leave.startDate).setHours(0,0,0,0);
      const lEnd = new Date(leave.endDate).setHours(0,0,0,0);
      
      const overlappingShifts = await Shift.find({
        nurse: leave.nurse,
        date: { $gte: new Date(lStart), $lte: new Date(lEnd) },
        status: { $ne: 'Cancelled' }
      });
      
      if (overlappingShifts.length > 0 && !req.body.override) {
        return res.status(400).json({ 
          message: 'Rule engine validation failed', 
          violations: [`Nurse has ${overlappingShifts.length} shift(s) scheduled during this leave period.`] 
        });
      }
      
      if (overlappingShifts.length > 0 && req.body.override) {
        if (!req.body.overrideReason) return res.status(400).json({ message: 'overrideReason is required' });
        await AuditLog.create({
          user: req.user.id,
          action: 'LEAVE_APPROVE_OVERRIDE',
          reason: req.body.overrideReason,
          details: { leaveId: leave._id, overlappingShifts: overlappingShifts.length }
        });
        
        // Auto cancel those shifts when overridden
        await Shift.updateMany({
          nurse: leave.nurse,
          date: { $gte: new Date(lStart), $lte: new Date(lEnd) }
        }, { status: 'Cancelled' });
      } else {
        await AuditLog.create({
          user: req.user.id,
          action: 'LEAVE_APPROVE',
          details: { leaveId: leave._id }
        });
      }
    }

    leave.status = status;
    await leave.save();

    // Fetch nurse user and profile
    const nurseUser = await User.findById(leave.nurse).select('username email');
    const nurseProfile = await Profile.findOne({ user: leave.nurse }).select('phone');

    const startDateFormatted = new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const endDateFormatted = new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    // Exact message as required by Spec 6
    const nurseMessage = status === 'Approved'
      ? `Your leave request from ${startDateFormatted} to ${endDateFormatted} has been approved by the administrator.`
      : `Your leave request from ${startDateFormatted} to ${endDateFormatted} has been rejected by the administrator.`;

    // 1. In-app notification to nurse
    await createInAppNotification(
      leave.nurse,
      `Leave Request ${status}`,
      nurseMessage,
      'leave_status'
    );

    // 2. Email notification to nurse
    if (nurseUser && nurseUser.email) {
      await sendApprovalEmail(
        nurseUser.email,
        nurseUser.username,
        'leave',
        status,
        {
          startDate: leave.startDate,
          endDate: leave.endDate,
          leaveType: leave.leaveType,
          reason: leave.reason,
          adminNote: req.body.adminNote || ''
        }
      );
    }

    // 3. SMS notification to nurse if phone available
    const nursePhone = nurseProfile?.phone || nurseUser?.phone;
    if (nursePhone) {
      await sendSMSNotification(nursePhone, nurseMessage);
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: 'Error updating leave status: ' + err.message });
  }
});

module.exports = router;
