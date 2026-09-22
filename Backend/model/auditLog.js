const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, required: true }, // e.g., 'SHIFT_ASSIGN', 'SWAP_APPROVE', 'LEAVE_APPROVE', 'RULE_OVERRIDE'
  reason: { type: String, default: '' },
  details: { type: Object, default: {} } // stores what rules were overridden, or what was changed
}, { timestamps: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = { AuditLog };
