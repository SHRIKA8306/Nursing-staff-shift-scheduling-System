const router = require('express').Router();
const { ShiftSwap, swapValidationSchema } = require('../model/shiftSwap');
const { Shift } = require('../model/shift');
const { Notification } = require('../model/notification');
const { User } = require('../model/user');
const auth = require('../middleware/auth');
const { sendApprovalEmail } = require('../utils/emailService');


// @route   GET /api/swaps
// @desc    Get shift swap requests involving the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const swaps = await ShiftSwap.find({
      $or: [{ requester: req.user.id }, { targetNurse: req.user.id }]
    })
      .populate('requester', 'username email department')
      .populate('targetNurse', 'username email department')
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

    await newSwap.populate('requester', 'username email');
    await newSwap.populate('targetNurse', 'username email');

    // Send notification to target nurse
    await Notification.create({
      user: value.targetNurseId,
      title: 'Shift Swap Request',
      message: `${req.user.username} has requested a shift swap with you.`,
      type: 'swap_request'
    });

    res.status(201).json(newSwap);
  } catch (err) {
    res.status(500).json({ message: 'Error creating swap request: ' + err.message });
  }
});

// @route   PUT /api/swaps/:id/status
// @desc    Approve or Reject shift swap
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const swap = await ShiftSwap.findById(req.params.id);
    if (!swap) return res.status(404).json({ message: 'Swap request not found' });

    swap.status = status;
    await swap.save();

    // If approved, swap the nurse assignments on original shift
    if (status === 'Approved') {
      const originalShift = await Shift.findById(swap.originalShift);
      const requestedShift = swap.requestedShift ? await Shift.findById(swap.requestedShift) : null;
      
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

    // Notify requester (in-app)
    await Notification.create({
      user: swap.requester,
      title: `Swap Request ${status}`,
      message: `Your shift swap request has been ${status.toLowerCase()}.`,
      type: 'swap_request'
    });

    // Send email to requester
    const requesterUser = await User.findById(swap.requester).select('username email');
    if (requesterUser && requesterUser.email) {
      await sendApprovalEmail(
        requesterUser.email,
        requesterUser.username,
        'swap',
        status,
        {
          reason: swap.reason || '',
          adminNote: req.body.adminNote || ''
        }
      );
    }

    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: 'Error updating swap status: ' + err.message });
  }
});

module.exports = router;
