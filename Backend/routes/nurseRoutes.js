const router = require('express').Router();
const bcrypt = require('bcryptjs');
const { User } = require('../model/user');
const { Profile } = require('../model/profile');
const auth = require('../middleware/auth');

// @route   GET /api/nurses
// @desc    Get all registered nurses (With Search & Department Filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { search, department, status } = req.query;
    const query = { role: 'nurse' };

    if (department && department !== 'All') {
      query.department = department;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { username: searchRegex },
        { email: searchRegex },
        { employeeId: searchRegex }
      ];
    }

    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });

    // Fetch corresponding profiles for each nurse
    const nursesWithProfiles = await Promise.all(
      users.map(async (user) => {
        let profile = await Profile.findOne({ user: user._id });
        if (!profile) {
          profile = await Profile.create({
            user: user._id,
            fullName: user.username,
            department: user.department || 'General',
            qualifications: [],
            experienceYears: 0,
            shiftPreference: 'Flexible',
            phone: '',
            status: 'Active'
          });
        }
        return {
          id: user._id,
          _id: user._id,
          employeeId: user.employeeId || `EMP-${user._id.toString().slice(-3)}`,
          fullName: user.username,
          username: user.username,
          email: user.email,
          department: user.department || 'General',
          role: user.role,
          phone: profile.phone || '',
          qualifications: profile.qualifications || [],
          experienceYears: profile.experienceYears || 0,
          shiftPreference: profile.shiftPreference || 'Flexible',
          status: profile.status || 'Active',
          createdAt: user.createdAt
        };
      })
    );

    // Apply status filter if passed
    const filteredNurses = status && status !== 'All' 
      ? nursesWithProfiles.filter(n => n.status.toLowerCase() === status.toLowerCase())
      : nursesWithProfiles;

    res.json(filteredNurses);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching nurses: ' + err.message });
  }
});

// @route   POST /api/nurses
// @desc    Admin: Add a new nurse to the system
router.post('/', auth, async (req, res) => {
  try {
    const { fullName, email, employeeId, department, role, phone, password, skills, availability, status } = req.body;

    if (!fullName || !email || !employeeId) {
      return res.status(400).json({ message: 'Full Name, Email, and Employee ID are required.' });
    }

    // Check if email or employeeId already exists
    const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail) {
      return res.status(409).json({ message: 'A nurse with this email address is already registered.' });
    }

    const existingEmpId = await User.findOne({ employeeId: employeeId.trim() });
    if (existingEmpId) {
      return res.status(409).json({ message: 'A nurse with this Employee ID already exists.' });
    }

    // Hash password (default password if not provided)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password || 'nursepassword', salt);

    // Create User record
    const newUser = await User.create({
      username: fullName.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role || 'nurse',
      department: department || 'General Ward',
      employeeId: employeeId.trim()
    });

    // Create Profile record
    const newProfile = await Profile.create({
      user: newUser._id,
      fullName: fullName.trim(),
      department: department || 'General Ward',
      qualifications: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : []),
      experienceYears: 1,
      shiftPreference: 'Flexible',
      phone: phone || '',
      status: status || 'Active'
    });

    res.status(201).json({
      message: 'Nurse registered successfully!',
      nurse: {
        id: newUser._id,
        employeeId: newUser.employeeId,
        fullName: newUser.username,
        email: newUser.email,
        department: newUser.department,
        status: newProfile.status
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Error adding nurse: ' + err.message });
  }
});

// @route   PUT /api/nurses/:id
// @desc    Admin: Update nurse details
router.put('/:id', auth, async (req, res) => {
  try {
    const { fullName, department, phone, status, qualifications, experienceYears, shiftPreference } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Nurse not found' });

    if (fullName) user.username = fullName.trim();
    if (department) user.department = department;
    await user.save();

    let profile = await Profile.findOne({ user: req.params.id });
    if (profile) {
      if (fullName) profile.fullName = fullName.trim();
      if (department) profile.department = department;
      if (phone !== undefined) profile.phone = phone;
      if (status) profile.status = status;
      if (qualifications) profile.qualifications = qualifications;
      if (experienceYears !== undefined) profile.experienceYears = experienceYears;
      if (shiftPreference) profile.shiftPreference = shiftPreference;
      await profile.save();
    }

    res.json({ message: 'Nurse updated successfully', user, profile });
  } catch (err) {
    res.status(500).json({ message: 'Error updating nurse: ' + err.message });
  }
});

// @route   PATCH /api/nurses/:id/status
// @desc    Admin: Activate / Deactivate nurse status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Inactive', 'On Leave'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    let profile = await Profile.findOne({ user: req.params.id });
    if (!profile) return res.status(404).json({ message: 'Nurse profile not found' });

    profile.status = status;
    await profile.save();

    res.json({ message: `Nurse status updated to ${status}`, status });
  } catch (err) {
    res.status(500).json({ message: 'Error updating nurse status: ' + err.message });
  }
});

module.exports = router;
