const mongoose = require('mongoose');
const Joi = require('joi');

const shiftSwapSchema = new mongoose.Schema(
  {
    requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetNurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    originalShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift', required: true },
    requestedShift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'], 
      default: 'Pending' 
    }
  },
  { timestamps: true }
);

const ShiftSwap = mongoose.model('ShiftSwap', shiftSwapSchema);

const swapValidationSchema = Joi.object({
  targetNurseId: Joi.string().required(),
  originalShiftId: Joi.string().required(),
  requestedShiftId: Joi.string().optional(),
  reason: Joi.string().min(3).required()
});

module.exports = { ShiftSwap, swapValidationSchema };
