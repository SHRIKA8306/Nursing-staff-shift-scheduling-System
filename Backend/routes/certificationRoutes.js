const router = require('express').Router();
const { Profile } = require('../model/profile');
const auth = require('../middleware/auth');

// @route   GET /api/certifications
// @desc    Get certifications for current nurse
router.get('/', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile.certifications || []);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching certifications: ' + err.message });
  }
});

// @route   POST /api/certifications
// @desc    Add a certification for current nurse
router.post('/', auth, async (req, res) => {
  try {
    const { name, issueDate, expiryDate, fileUrl } = req.body;
    if (!name || !expiryDate) return res.status(400).json({ message: 'Name and expiryDate are required' });
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const newCert = { name, issueDate, expiryDate, status: new Date(expiryDate) < new Date() ? 'Expired' : 'Active', fileUrl };
    profile.certifications = profile.certifications || [];
    profile.certifications.push(newCert);
    await profile.save();
    res.status(201).json(newCert);
  } catch (err) {
    res.status(500).json({ message: 'Error adding certification: ' + err.message });
  }
});

// @route   PUT /api/certifications/:certId
// @desc    Update a certification
router.put('/:certId', auth, async (req, res) => {
  try {
    const { certId } = req.params;
    const { name, issueDate, expiryDate, fileUrl } = req.body;
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    const cert = profile.certifications.id(certId);
    if (!cert) return res.status(404).json({ message: 'Certification not found' });
    if (name !== undefined) cert.name = name;
    if (issueDate !== undefined) cert.issueDate = issueDate;
    if (expiryDate !== undefined) cert.expiryDate = expiryDate;
    if (fileUrl !== undefined) cert.fileUrl = fileUrl;
    cert.status = new Date(cert.expiryDate) < new Date() ? 'Expired' : 'Active';
    await profile.save();
    res.json(cert);
  } catch (err) {
    res.status(500).json({ message: 'Error updating certification: ' + err.message });
  }
});

module.exports = router;
