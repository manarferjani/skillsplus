import express from 'express';
import PreferenceService from '../services/preference.service.js';

const router = express.Router();

// Middleware pour extraire userId (simplifié, remplacez par une authentification réelle)
const authenticate = (req, res, next) => {
  const userId = req.headers['user-id']; // À remplacer par une vraie authentification (JWT, etc.)
  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }
  req.userId = userId;
  next();
};

// GET : Récupérer la configuration globale (thèmes et polices)
router.get('/appearance-config', async (req, res) => {
  try {
    const config = await PreferenceService.getAppearanceConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET : Récupérer les préférences d'un utilisateur
router.get('/user/preferences', authenticate, async (req, res) => {
  try {
    const preferences = await PreferenceService.getUserPreferences(req.userId);
    res.json(preferences);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST : Mettre à jour les préférences d'un utilisateur
router.post('/user/preferences', authenticate, async (req, res) => {
  try {
    const { theme, font } = req.body;
    const preferences = await PreferenceService.updateUserPreferences(req.userId, { theme, font });
    res.json({ message: 'Préférences mises à jour avec succès', preferences });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

export default router;