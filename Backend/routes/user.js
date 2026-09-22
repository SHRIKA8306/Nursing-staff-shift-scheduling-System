const router = require('express').Router();
const { User } = require('../model/user');
const auth = require('../middleware/auth');

// @route   GET /api/users/nurses
// @desc    Get list of nurses (for shift swapping selection)
router.get('/nurses', auth, async (req, res) => {
  try {
    // Return all nurses/head_nurses except the current user
    const nurses = await User.find({ 
      _id: { $ne: req.user.id },
      role: { $in: ['nurse', 'head_nurse'] }
    })
      .select('_id username email department profilePic role employeeId')
      .sort({ username: 1 });
      
    res.json(nurses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching nurses: ' + err.message });
  }
});


// @route   GET /api/users/all
// @desc    Get all users (Admin view)
router.get('/all', auth, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users: ' + err.message });
  }
});

module.exports = router;