const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['shift_assigned', 'swap_request', 'leave_status', 'general', 'broadcast', 'attendance_alert', 'staffing_alert', 'ai_recommendation'], 
      default: 'general' 
    },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Notification };
