const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { User, registerSchema, loginSchema } = require('../model/user');
const { Profile } = require('../model/profile');
const auth = require('../middleware/auth');

// Utility to generate JWT Token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || "nurse_shift_scheduling_secret_key_2026";
  const expiresIn = process.env.JWT_EXPRIRES_IN || '7d';
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email, 
      username: user.username, 
      role: user.role,
      department: user.department,
      employeeId: user.employeeId
    },
    secret,
    { expiresIn }
  );
};

// @route   POST /api/auth/admin-login
// @desc    Authenticate Administrator (admin@gmail.com / admin)
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and Password are required.' });
    }

    const inputEmail = email.toLowerCase().trim();
    
    // Find admin user
    let adminUser = await User.findOne({ email: inputEmail, role: 'admin' });

    // Fallback demo matching if DB user hasn't been seeded yet
    if (!adminUser && inputEmail === 'admin@gmail.com' && password === 'admin') {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin', salt);
      adminUser = await User.create({
        username: 'Administrator',
        email: 'admin@gmail.com',
        passwordHash: hashedPassword,
        role: 'admin',
        department: 'Administration',
        employeeId: 'ADM-001'
      });
    }

    if (!adminUser || adminUser.role !== 'admin') {
      return res.status(401).json({ message: 'Invalid administrator email or password.' });
    }

    const isMatch = await bcrypt.compare(password, adminUser.passwordHash);
    if (!isMatch && !(inputEmail === 'admin@gmail.com' && password === 'admin')) {
      return res.status(401).json({ message: 'Invalid administrator email or password.' });
    }

    const token = generateToken(adminUser);

    res.json({
      message: 'Administrator logged in successfully',
      token,
      user: {
        id: adminUser._id,
        username: adminUser.username,
        email: adminUser.email,
        role: 'admin',
        department: adminUser.department,
        employeeId: adminUser.employeeId
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Admin login error: ' + err.message });
  }
});

// @route   POST /api/auth/nurse-login
// @desc    Login Nurse with Email/Username and Password
router.post('/nurse-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Email/Username and Password are required.' });
    }

    const input = username.trim();
    const escapedInput = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const nurseUser = await User.findOne({
      $or: [
        { username: { $regex: new RegExp("^" + escapedInput + "$", "i") } },
        { email: input.toLowerCase() }
      ],
      role: 'nurse'
    });

    if (!nurseUser) {
      return res.status(401).json({ 
        message: 'Your account is not registered. Please contact the administrator.' 
      });
    }

    if (nurseUser.passwordHash) {
      const isMatch = await bcrypt.compare(password, nurseUser.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid password. Please check your credentials.' });
      }
    }

    // Check status
    const profile = await Profile.findOne({ user: nurseUser._id });
    if (profile && profile.status === 'Inactive') {
      return res.status(403).json({ 
        message: 'Your account is currently inactive. Please contact the administrator.' 
      });
    }

    const token = generateToken(nurseUser);

    res.json({
      message: 'Nurse logged in successfully',
      token,
      user: {
        id: nurseUser._id,
        username: nurseUser.username,
        email: nurseUser.email,
        role: 'nurse',
        department: nurseUser.department,
        employeeId: nurseUser.employeeId,
        profilePic: nurseUser.profilePic
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Nurse login error: ' + err.message });
  }
});

// @route   GET /api/auth/google
// @desc    Initiate Google OAuth login flow
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID') {
    return res.status(400).json({ 
      message: 'Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Backend/.env file.' 
    });
  }
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })(req, res, next);
});

// @route   POST /api/auth/google-verify
// @desc    Verify Google account email against registered nurses in MongoDB
router.post('/google-verify', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Google account email is required.' });
    }

    const inputEmail = email.toLowerCase().trim();

    // Check if email exists in database as a registered nurse
    const registeredNurse = await User.findOne({ email: inputEmail, role: 'nurse' });

    if (!registeredNurse) {
      return res.status(401).json({
        message: 'Your account is not registered. Please contact the administrator.'
      });
    }

    // Check if profile status is active
    const profile = await Profile.findOne({ user: registeredNurse._id });
    if (profile && profile.status === 'Inactive') {
      return res.status(403).json({
        message: 'Your account is currently inactive. Please contact the administrator.'
      });
    }

    const token = generateToken(registeredNurse);

    res.json({
      message: 'Google authentication successful',
      token,
      user: {
        id: registeredNurse._id,
        username: registeredNurse.username,
        email: registeredNurse.email,
        role: 'nurse',
        department: registeredNurse.department,
        employeeId: registeredNurse.employeeId,
        profilePic: registeredNurse.profilePic
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Google verification error: ' + err.message });
  }
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth redirect callback - Checks registered nurse status
router.get('/google/callback', (req, res, next) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  passport.authenticate('google', { session: false }, async (err, user, info) => {
    if (err || !user) {
      const errMsg = info && info.message ? info.message : 'Your account is not registered. Please contact the administrator.';
      return res.redirect(`${frontendUrl}/?error=${encodeURIComponent(errMsg)}`);
    }

    // Verify if user email belongs to a registered nurse in the database
    const registeredNurse = await User.findOne({ email: user.email.toLowerCase(), role: 'nurse' });

    if (!registeredNurse) {
      return res.redirect(
        `${frontendUrl}/?error=${encodeURIComponent('Your account is not registered. Please contact the administrator.')}`
      );
    }

    // Check status
    const profile = await Profile.findOne({ user: registeredNurse._id });
    if (profile && profile.status === 'Inactive') {
      return res.redirect(
        `${frontendUrl}/?error=${encodeURIComponent('Your account is currently inactive. Please contact the administrator.')}`
      );
    }

    const token = generateToken(registeredNurse);
    res.redirect(`${frontendUrl}/?token=${token}&role=nurse&id=${registeredNurse._id}`);
  })(req, res, next);
});

// @route   GET /api/auth/me
// @desc    Get current authenticated user info
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = await Profile.findOne({ user: req.user.id });

    res.json({
      ...user.toObject(),
      status: profile ? profile.status : 'Active',
      profile: profile || {}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;