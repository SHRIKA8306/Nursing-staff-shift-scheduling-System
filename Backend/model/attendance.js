const mongoose = require('mongoose');
const Joi = require('joi');

const attendanceSchema = new mongoose.Schema(
  {
    nurse: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: 'Shift' },
    checkIn: { type: Date, default: Date.now },
    checkOut: { type: Date },
    status: { 
      type: String, 
      enum: ['Present', 'Late', 'Absent'], 
      default: 'Present' 
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

const Attendance = mongoose.model('Attendance', attendanceSchema);

const attendanceValidationSchema = Joi.object({
  shiftId: Joi.string().optional(),
  notes: Joi.string().allow('', null)
});

module.exports = { Attendance, attendanceValidationSchema };
