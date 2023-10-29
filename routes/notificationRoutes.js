// routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const asyncMiddleware = require('../middleware/asyncMiddleware');
const authenticateJWT = require('../middleware/authenticateJWT');
const handleMongoError = require('../shared/handleMongoError');

// Get all notifications for the logged-in user with unread ones at the top
router.get('/all', authenticateJWT, asyncMiddleware(async (req, res) => {
  try {
    const userId = req.user.id;  
    const notifications = await Notification.find({ userId: userId })
                                           .sort({ isRead: 1 });  // Sort by isRead in ascending order (false comes before true)

    res.status(200).json(notifications);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Mark a notification as read
router.put('/:id/read', authenticateJWT, asyncMiddleware(async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    
    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();
    res.status(200).json({ message: 'Notification marked as read' });

  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Mark all notifications as read
router.put('/all/read', authenticateJWT, asyncMiddleware(async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId: userId });
    
    if (!notifications) {
      return res.status(404).json({ message: 'Notifications not found' });
    }

    notifications.forEach(async (notification) => {
      notification.isRead = true;
      await notification.save();
    });

    res.status(200).json({ message: 'All notifications marked as read' });

  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Update a specific notification
router.put('/:id/update', authenticateJWT, asyncMiddleware(async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndUpdate(notificationId, req.body, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    res.status(200).json(notification);
  } catch (error) {
    const { message, status } = handleMongoError(error);
    res.status(status).json({ message });
  }
}));

// Delete a specific notification
router.delete('/:id/delete', authenticateJWT, asyncMiddleware(async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = req.params.id;
        const notification = await Notification.findById(notificationId);

        if (!notification || notification.userId !== userId) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        await Notification.findByIdAndDelete(notificationId);
        res.status(200).json({ message: 'Notification deleted successfully' });

    } catch (error) {
        const { message, status } = handleMongoError(error);
        res.status(status).json({ message });
    }
}));

module.exports = router;
