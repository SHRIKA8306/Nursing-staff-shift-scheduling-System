const router = require('express').Router();
const { Notification } = require('../model/notification');
const auth = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get logged in user's notifications
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching notifications: ' + err.message });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, user: req.user.id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Error updating notification: ' + err.message });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, read: false }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Error updating notifications: ' + err.message });
  }
});

// @route   POST /api/notifications/test-email
// @desc    Test sending an email to verify SMTP configuration
router.post('/test-email', auth, async (req, res) => {
  const nodemailer = require('nodemailer');
  const targetEmail = req.body.to || process.env.ADMIN_EMAIL || req.user.email;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    return res.status(400).json({
      success: false,
      message: 'EMAIL_USER or EMAIL_PASS is missing in Backend/.env file.'
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const info = await transporter.sendMail({
      from: `"NurseSync AI" <${emailUser}>`,
      to: targetEmail,
      subject: '✅ NurseSync AI Email Test Notification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 24px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; max-width: 500px;">
          <h2 style="color: #0284c7; margin-top: 0;">🎉 NurseSync AI Email Service is Working!</h2>
          <p style="color: #334155; font-size: 15px;">
            This test email confirms that your Gmail SMTP configuration is properly connected.
          </p>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 12px; border-radius: 6px; margin: 16px 0;">
            <strong style="color: #065f46;">Recipient:</strong> <span style="color: #047857;">${targetEmail}</span><br/>
            <strong style="color: #065f46;">Sender:</strong> <span style="color: #047857;">${emailUser}</span>
          </div>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 0;">
            All nurse leave requests, shift swap alerts, and approval notifications will now be delivered automatically.
          </p>
        </div>
      `
    });

    return res.json({
      success: true,
      message: `Test email successfully sent to ${targetEmail}! Message ID: ${info.messageId}`,
      info
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: `Failed to send email: ${err.message}`,
      hint: err.message.includes('535') || err.message.includes('BadCredentials')
        ? 'Google rejected your password. You MUST use a 16-character Google App Password from https://myaccount.google.com/apppasswords instead of your normal account password.'
        : err.message
    });
  }
});

module.exports = router;
