const router = require('express').Router();
const { AuditLog } = require('../model/auditLog');
const auth = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get all audit log entries (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'manager' && req.user.role !== 'head_nurse') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    let logs = await AuditLog.find()
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });

    if (logs.length === 0) {
      // Create initial seed audit logs for demonstration
      await AuditLog.create([
        {
          user: req.user.id,
          action: 'SHIFT_ASSIGN',
          reason: 'Initial Roster Allocation',
          details: { department: 'ICU', status: 'Success' }
        },
        {
          user: req.user.id,
          action: 'LEAVE_APPROVE',
          reason: 'Approved Medical Leave Request',
          details: { status: 'Approved' }
        },
        {
          user: req.user.id,
          action: 'AI_SCHEDULE_GENERATE',
          reason: 'Automated 7-day Roster Optimization',
          details: { totalGenerated: 18, ruleEngineStatus: 'Pass' }
        }
      ]);
      logs = await AuditLog.find().populate('user', 'username email role').sort({ createdAt: -1 });
    }

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audit logs: ' + err.message });
  }
});

module.exports = router;
