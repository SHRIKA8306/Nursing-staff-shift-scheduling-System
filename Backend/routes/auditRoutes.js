const router = require('express').Router();
const { AuditLog } = require('../model/auditLog');
const auth = require('../middleware/auth');

// @route   GET /api/audit-logs
// @desc    Get all audit log entries (admin only)
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    const logs = await AuditLog.find()
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching audit logs: ' + err.message });
  }
});

module.exports = router;
