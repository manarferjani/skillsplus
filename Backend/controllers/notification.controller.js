import express from 'express';
import NotificationSettingsService from '../services/notification.service.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET notification settings
router.get('/notification-settings', auth, async (req, res) => {
  try {
    const userId = req.user._id; // Supposons que l'utilisateur est authentifié via middleware
    const settings = await NotificationSettingsService.getSettings(userId);
    res.json(settings);
  } catch (err) {
    console.error('Erreur lors de la récupération des paramètres de notification :', err);
    res.status(500).json({ message: err.message });
  }
});

// POST update notification settings
router.post('/notification-settings', auth, async (req, res) => {
  try {
    const userId = req.user._id; // Supposons que l'utilisateur est authentifié via middleware
    const settings = await NotificationSettingsService.updateSettings(userId, req.body);
    res.json(settings);
  } catch (err) {
    console.error('Erreur lors de la mise à jour des paramètres de notification :', err);
    res.status(400).json({ message: err.message });
  }
});

export default router;