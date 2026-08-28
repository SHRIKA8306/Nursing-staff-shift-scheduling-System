const router = require('express').Router();
const { ShiftSwap, swapValidationSchema } = require('../model/shiftSwap');
const { Shift } = require('../model/shift');
const { Notification } = require('../model/notification');
const auth = require('../middleware/auth');

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
      if (originalShift) {
        originalShift.nurse = swap.targetNurse;
        originalShift.status = 'Swapped';
        await originalShift.save();
      }

      if (swap.requestedShift) {
        const requestedShift = await Shift.findById(swap.requestedShift);
        if (requestedShift) {
          requestedShift.nurse = swap.requester;
          requestedShift.status = 'Swapped';
          await requestedShift.save();
        }
      }
    }

    // Notify requester
    await Notification.create({
      user: swap.requester,
      title: `Swap Request ${status}`,
      message: `Your shift swap request has been ${status.toLowerCase()}.`,
      type: 'swap_request'
    });

    res.json(swap);
  } catch (err) {
    res.status(500).json({ message: 'Error updating swap status: ' + err.message });
  }
});

module.exports = router;
