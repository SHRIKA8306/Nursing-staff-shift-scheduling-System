const nodemailer = require('nodemailer');

// Create a reusable transporter — uses Gmail SMTP (App Password required)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password (not your real password)
    },
  });
};

/**
 * Send an approval/rejection email to a nurse.
 * @param {string} toEmail   - Nurse's email address
 * @param {string} toName    - Nurse's name (for greeting)
 * @param {string} type      - 'leave' or 'swap'
 * @param {string} status    - 'Approved' or 'Rejected'
 * @param {object} details   - Extra info (dates, reason, etc.)
 */
const sendApprovalEmail = async (toEmail, toName, type, status, details = {}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email] EMAIL_USER or EMAIL_PASS not set in .env — skipping email.');
    return;
  }

  const isApproved = status === 'Approved';
  const statusColor = isApproved ? '#22c55e' : '#ef4444';
  const statusIcon  = isApproved ? '✅' : '❌';

  let subjectLine = '';
  let bodyContent = '';

  if (type === 'leave') {
    const from = details.startDate
      ? new Date(details.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';
    const to = details.endDate
      ? new Date(details.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—';

    subjectLine = `${statusIcon} Your Leave Request has been ${status}`;
    bodyContent = `
      <p>Your leave request for the period <strong>${from}</strong> to <strong>${to}</strong> has been reviewed.</p>
      ${details.leaveType ? `<p><strong>Leave Type:</strong> ${details.leaveType}</p>` : ''}
      ${details.reason    ? `<p><strong>Your Reason:</strong> ${details.reason}</p>` : ''}
      ${details.adminNote ? `<p><strong>Admin Note:</strong> ${details.adminNote}</p>` : ''}
    `;
  } else if (type === 'swap') {
    subjectLine = `${statusIcon} Your Shift Swap Request has been ${status}`;
    bodyContent = `
      <p>Your shift swap request has been reviewed by the administrator.</p>
      ${details.reason    ? `<p><strong>Your Reason:</strong> ${details.reason}</p>` : ''}
      ${details.adminNote ? `<p><strong>Admin Note:</strong> ${details.adminNote}</p>` : ''}
    `;
  }

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#0f172a;border-radius:16px;overflow:hidden;max-width:600px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0ea5e9,#14b8a6);padding:32px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:1px;">NurseSync</h1>
              <p style="margin:8px 0 0;color:#e0f7fa;font-size:13px;">Nurse Shift Scheduling System</p>
            </td>
          </tr>

          <!-- Status Banner -->
          <tr>
            <td style="padding:28px 36px 0;">
              <div style="background:${statusColor}22;border:2px solid ${statusColor};border-radius:10px;padding:16px 20px;text-align:center;">
                <span style="color:${statusColor};font-size:20px;font-weight:700;">${statusIcon} Request ${status}</span>
              </div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 36px;color:#cbd5e1;font-size:15px;line-height:1.7;">
              <p style="margin:0 0 16px;">Dear <strong style="color:#f8fafc;">${toName}</strong>,</p>
              ${bodyContent}
              <p style="margin-top:24px;color:#94a3b8;font-size:13px;">
                You do not need to log in to check the status — this email is your official notification.
                If you have questions, please contact your department administrator.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#1e293b;padding:20px 36px;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                &copy; ${new Date().getFullYear()} NurseSync &middot; Automated Notification &middot; Do not reply to this email
              </p>
            </td>
          </tr>

        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"NurseSync System" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: subjectLine,
      html,
    });
    console.log(`[Email] Sent ${type} ${status} email to ${toEmail}`);
  } catch (err) {
    // Log but don't crash the route — email failure should not break approval
    console.error(`[Email] Failed to send to ${toEmail}:`, err.message);
  }
};

module.exports = { sendApprovalEmail };
