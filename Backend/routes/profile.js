const router = require('express').Router();
const { Profile, profileValidationSchema } = require('../model/profile');
const { User } = require('../model/user');
const auth = require('../middleware/auth');

// @route   GET /api/profile
// @desc    Get current nurse's profile
router.get('/', auth, async (req, res) => {
  try {
    let profile = await Profile.findOne({ user: req.user.id })
      .populate('user', 'username email role department profilePic employeeId');

    if (!profile) {
      // Return default profile structure if not yet initialized
      const user = await User.findById(req.user.id).select('-passwordHash');
      return res.json({
        user,
        fullName: user ? user.username : '',
        department: user ? user.department : 'General',
        qualifications: [],
        experienceYears: 0,
        shiftPreference: 'Flexible',
        phone: '',
        emergencyContact: { name: '', phone: '', relation: '' },
        maxShiftsPerWeek: 5,
        status: 'Active',
        isNew: true
      });
    }

    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching nurse profile: ' + err.message });
  }
});

// @route   POST /api/profile
// @desc    Create or update current nurse's profile
router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = profileValidationSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.details[0].message });

    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      profile.fullName = value.fullName;
      profile.department = value.department || profile.department;
      profile.qualifications = value.qualifications || profile.qualifications;
      profile.experienceYears = value.experienceYears !== undefined ? value.experienceYears : profile.experienceYears;
      profile.shiftPreference = value.shiftPreference || profile.shiftPreference;
      profile.phone = value.phone !== undefined ? value.phone : profile.phone;
      if (value.emergencyContact) profile.emergencyContact = value.emergencyContact;
      if (value.maxShiftsPerWeek) profile.maxShiftsPerWeek = value.maxShiftsPerWeek;
      if (value.status) profile.status = value.status;
      if (value.profilePic !== undefined) profile.profilePic = value.profilePic;

      await profile.save();
    } else {
      profile = await Profile.create({
        user: req.user.id,
        fullName: value.fullName,
        department: value.department || 'General',
        qualifications: value.qualifications || [],
        experienceYears: value.experienceYears || 0,
        shiftPreference: value.shiftPreference || 'Flexible',
        phone: value.phone || '',
        emergencyContact: value.emergencyContact || {},
        maxShiftsPerWeek: value.maxShiftsPerWeek || 5,
        status: value.status || 'Active',
        profilePic: value.profilePic || ''
      });
    }

    await profile.populate('user', 'username email role department profilePic employeeId');
    res.status(200).json(profile);
  } catch (err) {
    res.status(500).json({ message: 'Error updating profile: ' + err.message });
  }
});

// @route   GET /api/profile/all
// @desc    Get all nurse profiles (Admin/Manager)
router.get('/all', auth, async (req, res) => {
  try {
    const profiles = await Profile.find()
      .populate('user', 'username email role department profilePic employeeId');
    res.json(profiles);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching profiles: ' + err.message });
  }
});

module.exports = router;