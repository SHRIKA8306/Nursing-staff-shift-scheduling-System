const router = require('express').Router();
const { Notification } = require('../model/notification');
const auth = require('../middleware/auth');

// @route   POST /api/notifications/broadcast
// @desc    Admin broadcast urgent notification to a department (or all)
router.post('/broadcast', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    const { department, message } = req.body;
    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }
    // Find target users
    const filter = department ? { department } : {};
    const users = await require('../model/user').User.find(filter).select('_id');
    const notifications = users.map(u => ({
      user: u._id,
      title: 'Emergency Broadcast',
      message,
      type: 'broadcast',
      urgent: true,
      createdAt: new Date()
    }));
    await Notification.insertMany(notifications);
    res.json({ sent: notifications.length, department: department || 'All' });
  } catch (err) {
    res.status(500).json({ message: 'Error broadcasting notification: ' + err.message });
  }
});

module.exports = router;
