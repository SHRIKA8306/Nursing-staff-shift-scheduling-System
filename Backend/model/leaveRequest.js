const mongoose = require('mongoose');
const Joi = require('joi');

const leaveRequestSchema = new mongoose.Schema(
  {
    nurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    leaveType: { 
      type: String, 
      enum: ['Sick', 'Casual', 'Annual', 'Emergency'], 
      default: 'Casual' 
    },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['Pending', 'Approved', 'Rejected'], 
      default: 'Pending' 
    }
  },
  { timestamps: true }
);

const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

const leaveValidationSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().min(Joi.ref('startDate')).required(),
  leaveType: Joi.string().valid('Sick', 'Casual', 'Annual', 'Emergency').optional(),
  reason: Joi.string().min(3).required()
});

module.exports = { LeaveRequest, leaveValidationSchema };
