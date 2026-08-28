const mongoose = require('mongoose');
const Joi = require('joi');

const shiftSchema = new mongoose.Schema(
  {
    nurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    shiftType: { 
      type: String, 
      enum: ['Morning', 'Evening', 'Night'], 
      required: true 
    },
    startTime: { type: String, default: '08:00' },
    endTime: { type: String, default: '16:00' },
    department: { type: String, default: 'General' },
    status: { 
      type: String, 
      enum: ['Scheduled', 'Completed', 'Swapped', 'Cancelled'], 
      default: 'Scheduled' 
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

const Shift = mongoose.model('Shift', shiftSchema);

const shiftValidationSchema = Joi.object({
  nurseId: Joi.string().required(),
  date: Joi.date().required(),
  shiftType: Joi.string().valid('Morning', 'Evening', 'Night').required(),
  startTime: Joi.string().optional(),
  endTime: Joi.string().optional(),
  department: Joi.string().optional(),
  notes: Joi.string().allow('', null)
});

module.exports = { Shift, shiftValidationSchema };
