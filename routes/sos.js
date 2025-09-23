const express = require('express');
const router = express.Router();
const Sos = require('../models/Sos');
const { verifyToken } = require('../middleware/auth');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Setup email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail', // Or use another email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Function to send SOS alert via email
const sendSosEmail = async (userId, latitude, longitude, message) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.ADMIN_EMAIL,
    subject: '🚨 SOS Triggered - Naija Clinic',
    text: `⚠️ Emergency SOS Triggered\n\nUser ID: ${userId}\nLocation: (${latitude}, ${longitude})\nMessage: ${message || 'No message'}\nTime: ${new Date().toLocaleString()}`
  };

  return transporter.sendMail(mailOptions);
};

// @route   POST /api/sos
// @desc    Create SOS alert (live trigger)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;
    const userId = req.user?._id || req.body.user;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const sos = new Sos({
      user: userId,
      location: { latitude, longitude },
      message,
      isSynced: true,
    });

    await sos.save();

    // Send alert email to admin
    try {
      await sendSosEmail(userId, latitude, longitude, message);
    } catch (e) {
      console.warn('Failed to send SOS email:', e.message);
    }

    res.status(201).json({ message: 'SOS alert created successfully', sos });
  } catch (error) {
    console.error('SOS Error:', error.message);
    res.status(500).json({ error: 'Server error while creating SOS alert' });
  }
});

// @route   POST /api/sos/sync
// @desc    Sync offline SOS alerts
router.post('/sync', async (req, res) => {
  try {
    const { sosList } = req.body;

    if (!Array.isArray(sosList) || sosList.length === 0) {
      return res.status(400).json({ error: 'No SOS data provided' });
    }

    const saved = await Sos.insertMany(
      sosList.map((sos) => ({
        user: sos.user,
        location: sos.location,
        message: sos.message || 'Emergency SOS triggered',
        isSynced: true,
        createdAt: sos.createdAt || new Date()
      }))
    );

    res.status(201).json({ message: 'Offline SOS synced successfully', saved });
  } catch (error) {
    console.error('SOS Sync Error:', error.message);
    res.status(500).json({ error: 'Failed to sync SOS data' });
  }
});

// @route   GET /api/sos
// @desc    Get all SOS alerts (admin/hospital)
router.get('/', verifyToken, async (req, res) => {
  try {
    const alerts = await Sos.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(alerts);
  } catch (error) {
    console.error('Get SOS Error:', error.message);
    res.status(500).json({ error: 'Failed to load SOS alerts' });
  }
});

module.exports = router;
