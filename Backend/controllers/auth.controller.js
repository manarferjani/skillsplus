// controllers/authController.js
import express from 'express';
const router = express.Router();

import AuthService from '../services/auth.service.js';
import { auth } from '../middleware/auth.js';


/**
 * Inscription d'un nouvel utilisateur.
 */
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication management
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', async (req, res) => {
  try {
    const result = await AuthService.signup(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Connexion d'un utilisateur.
 */
/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 */
router.post('/signin', async (req, res) => {
  try {
    const result = await AuthService.signin(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Authentification via Clerk.
 */
router.post('/clerk', async (req, res) => {
  try {
    const result = await AuthService.clerk(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Rafraîchit le token d'accès en utilisant un refresh token.
 */

router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    res.status(200).json(result);
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

/**
 * Demande de réinitialisation du mot de passe.
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await AuthService.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * Réinitialise le mot de passe avec un token de réinitialisation.
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    const result = await AuthService.resetPassword(resetToken, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Récupère le profil de l'utilisateur authentifié.
 */
router.get('/profile', auth, async (req, res) => {
  try {
    const result = AuthService.getProfile(req.user);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Met à jour le profil de l'utilisateur authentifié.
 */
router.put('/profile', auth, async (req, res) => {
  try {
    const result = await AuthService.updateProfile(req.user, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Change le mot de passe de l'utilisateur authentifié.
 */
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await AuthService.changePassword(req.user, currentPassword, newPassword);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * Déconnexion (logout) – pour JWT, la déconnexion se gère côté client.
 */
router.post('/logout', (req, res) => {
  try {
    const result = AuthService.logout();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
