const nodemailer = require('nodemailer');
const { Notification } = require('../model/notification');
const { User } = require('../model/user');

// ── 1. In-App Notification ──────────────────────────────────────────────────
/**
 * Create an in-app notification in MongoDB.
 * @param {string|ObjectId} userId
 * @param {string} title
 * @param {string} message
 * @param {string} type - 'leave_status' | 'swap_request' | 'shift_assigned' | 'broadcast' | 'staffing_alert' | 'general'
 */
const createInAppNotification = async (userId, title, message, type = 'general') => {
  try {
    const notif = await Notification.create({
      user: userId,
      title,
      message,
      type,
      read: false
    });
    return notif;
  } catch (err) {
    console.error('[NotificationService] In-App creation error:', err.message);
    return null;
  }
};

// ── 2. Email Notification ───────────────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/**
 * Send an email notification.
 * @param {string} toEmail
 * @param {string} subject
 * @param {string} htmlContent
 */
const sendEmailNotification = async (toEmail, subject, htmlContent) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[Email Mock] ${subject} -> To: ${toEmail}`);
    return { success: true, mocked: true };
  }

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"NurseSync AI" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject,
      html: htmlContent
    });
    console.log(`[Email] Sent: ${info.messageId} to ${toEmail}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.warn(`[Email Service Warning] Failed to send email to ${toEmail}:`, err.message);
    return { success: false, error: err.message };
  }
};

// ── 3. SMS Notification ─────────────────────────────────────────────────────
/**
 * Send an SMS notification (Modular abstraction with graceful mock fallback).
 * Can be hooked to Twilio / AWS SNS / Fast2SMS via environment variables.
 * @param {string} toPhone
 * @param {string} message
 */
const sendSMSNotification = async (toPhone, message) => {
  const smsProvider = process.env.SMS_PROVIDER || 'mock';
  const smsApiKey = process.env.SMS_API_KEY;

  if (!toPhone) {
    return { success: false, message: 'No phone number provided' };
  }

  if (smsProvider === 'twilio' && smsApiKey) {
    try {
      // Twilio integration can be wired here with TWILIO_ACCOUNT_SID & TWILIO_AUTH_TOKEN
      console.log(`[SMS - Twilio] To: ${toPhone} | Message: ${message}`);
      return { success: true, provider: 'twilio' };
    } catch (err) {
      console.error('[SMS Twilio Error]:', err.message);
      return { success: false, error: err.message };
    }
  }

  // Graceful standard fallback / dev log
  console.log(`📱 [SMS Service] Notification dispatched to ${toPhone}: "${message}"`);
  return { success: true, mocked: true, recipient: toPhone, message };
};

module.exports = {
  createInAppNotification,
  sendEmailNotification,
  sendSMSNotification
};
