const router = require('express').Router();
const { ShiftSwap, swapValidationSchema } = require('../model/shiftSwap');
const { Shift } = require('../model/shift');
const { Notification } = require('../model/notification');
const { User } = require('../model/user');
const { Profile } = require('../model/profile');
const auth = require('../middleware/auth');
const { sendApprovalEmail, sendAdminNotificationEmail } = require('../utils/emailService');
const { createInAppNotification, sendSMSNotification } = require('../services/notificationService');

// @route   GET /api/swaps
// @desc    Get shift swap requests (admin: all; nurse: their own)
router.get('/', auth, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager' || req.user.role === 'head_nurse';

    const filter = isAdmin
      ? {}
      : { $or: [{ requester: req.user.id }, { targetNurse: req.user.id }] };

    const swaps = await ShiftSwap.find(filter)
      .populate('requester', 'username email department employeeId')
      .populate('targetNurse', 'username email department employeeId')
      .populate('originalShift')
      .populate('requestedShift')
      .sort({ createdAt: -1 });

    res.json(swaps);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching swap requests: ' + err.message });
  }
});

// @route   POST /api/swaps/request
// @desc    Request a shift swap with another nurse
router.post('/request', auth, async (req, res) => {
  try {
    const { error, value } = swapValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    const newSwap = await ShiftSwap.create({
      requester: req.user.id,
      targetNurse: value.targetNurseId,
      originalShift: value.originalShiftId,
      requestedShift: value.requestedShiftId || null,
      reason: value.reason
    });

    await newSwap.populate('requester', 'username email department employeeId');
    await newSwap.populate('targetNurse', 'username email department employeeId');

    const requesterName = newSwap.requester ? newSwap.requester.username : (req.user.username || 'Nurse');

    // 1. Notify target nurse (In-app)
    await createInAppNotification(
      value.targetNurseId,
      'Shift Swap Request',
      `Nurse ${requesterName} has requested a shift swap with you. Reason: ${value.reason}`,
      'swap_request'
    );

    // 2. Notify admin (In-app)
    const admins = await User.find({ role: 'admin' });
    for (const adm of admins) {
      await createInAppNotification(
        adm._id,
        'New Shift Swap Request',
        `New shift swap request submitted by Nurse ${requesterName}. Please review the request.`,
        'swap_request'
      );
    }

    // 3. Email notification to admin
    await sendAdminNotificationEmail(
      requesterName,
      'Shift Swap Request',
      { reason: value.reason }
    );

    // 4. SMS notification to admin if configured
    const adminPhone = process.env.ADMIN_PHONE;
    if (adminPhone) {
      await sendSMSNotification(
        adminPhone,
        `NurseSync Alert: New shift swap request from Nurse ${requesterName}. Review in the admin portal.`
      );
    }

    res.status(201).json(newSwap);
  } catch (err) {
    res.status(500).json({ message: 'Error creating swap request: ' + err.message });
  }
});

// @route   PUT /api/swaps/:id/status
// @desc    Approve or Reject shift swap (Admin/Head Nurse)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const swap = await ShiftSwap.findById(req.params.id)
      .populate('originalShift')
      .populate('requestedShift');
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    swap.status = status;
    await swap.save();

    const originalShift = swap.originalShift ? await Shift.findById(swap.originalShift._id || swap.originalShift) : null;
    const requestedShift = swap.requestedShift ? await Shift.findById(swap.requestedShift._id || swap.requestedShift) : null;

    const shiftDateStr = originalShift?.date
      ? new Date(originalShift.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : 'the requested shift';

    // If approved, swap the nurse assignments on shifts
    if (status === 'Approved') {
      const ScheduleRuleEngine = require('../utils/ScheduleRuleEngine');
      const { AuditLog } = require('../model/auditLog');
      
      let allViolations = [];
      
      // Validate original shift taking targetNurse
      if (originalShift) {
        const violations1 = await ScheduleRuleEngine.validateAssignment({ ...originalShift.toObject(), nurse: swap.targetNurse }, swap.targetNurse);
        if (violations1.length > 0) allViolations.push(...violations1.map(v => `Target Nurse Issue: ${v}`));
      }
      
      // Validate requested shift taking requester
      if (requestedShift) {
        const violations2 = await ScheduleRuleEngine.validateAssignment({ ...requestedShift.toObject(), nurse: swap.requester }, swap.requester);
        if (violations2.length > 0) allViolations.push(...violations2.map(v => `Requester Nurse Issue: ${v}`));
      }
      
      if (allViolations.length > 0 && !req.body.override) {
        return res.status(400).json({ message: 'Rule engine validation failed for swap', violations: allViolations });
      }

      if (allViolations.length > 0 && req.body.override) {
        if (!req.body.overrideReason) return res.status(400).json({ message: 'overrideReason is required' });
        await AuditLog.create({
          user: req.user.id,
          action: 'SWAP_APPROVE_OVERRIDE',
          reason: req.body.overrideReason,
          details: { violations: allViolations, swapId: swap._id }
        });
      } else {
        await AuditLog.create({
          user: req.user.id,
          action: 'SWAP_APPROVE',
          details: { swapId: swap._id }
        });
      }

      // Reassign nurses
      if (originalShift) {
        originalShift.nurse = swap.targetNurse;
        originalShift.status = 'Swapped';
        await originalShift.save();
      }

      if (requestedShift) {
        requestedShift.nurse = swap.requester;
        requestedShift.status = 'Swapped';
        await requestedShift.save();
      }
    }

    // Spec 7: Exact message: "Your shift swap request for [Date] has been approved."
    const requesterMsg = status === 'Approved'
      ? `Your shift swap request for ${shiftDateStr} has been approved.`
      : `Your shift swap request for ${shiftDateStr} has been rejected.`;

    const targetMsg = status === 'Approved'
      ? `The shift swap for ${shiftDateStr} has been approved by the administrator. Please check your updated schedule.`
      : `The shift swap request for ${shiftDateStr} was rejected by the administrator.`;

    // 1. In-app notifications to both nurses
    await createInAppNotification(swap.requester, `Shift Swap ${status}`, requesterMsg, 'swap_request');
    await createInAppNotification(swap.targetNurse, `Shift Swap ${status}`, targetMsg, 'swap_request');

    // 2. Email & SMS to Requester
    const requesterUser = await User.findById(swap.requester).select('username email');
    const requesterProfile = await Profile.findOne({ user: swap.requester }).select('phone');
    if (requesterUser && requesterUser.email) {
      await sendApprovalEmail(
        requesterUser.email,
        requesterUser.username,
        'swap',
        status,
        { reason: swap.reason || '', adminNote: req.body.adminNote || '' }
      );
    }
    if (requesterProfile?.phone) {
      await sendSMSNotification(requesterProfile.phone, requesterMsg);
    }

    // 3. Email & SMS to Target Nurse
    const targetUser = await User.findById(swap.targetNurse).select('username email');
    const targetProfile = await Profile.findOne({ user: swap.targetNurse }).select('phone');
    if (targetUser && targetUser.email) {
      await sendApprovalEmail(
        targetUser.email,
        targetUser.username,
        'swap',
        status,
        { reason: swap.reason || '', adminNote: req.body.adminNote || '' }
      );
    }
    if (targetProfile?.phone) {
      await sendSMSNotification(targetProfile.phone, targetMsg);
    }

    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: 'Error updating swap status: ' + err.message });
  }
});

module.exports = router;
