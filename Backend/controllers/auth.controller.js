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
  console.log('POST /signin reçu avec body:', req.body);
  try {
    const result = await AuthService.signin(req.body);
    res.status(200).json(result);
  } catch (error) {
    console.log('Erreur signin:', error.message);
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
 * Déconnexion sécurisée : supprime le refreshToken côté serveur.
 */
router.post("/logout", auth, async (req, res) => {
  try {
    const userId = req.userId; // injecté par ton middleware `auth`
    const result = await authService.logout(userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Logout failed",
      error: err.message,
    });
  }
  router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier que email est fourni
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    // Chercher l'utilisateur dans la base
    const user = await User.findOne({ email });
    if (!user) {
      // Pour sécurité, on ne dit pas que l'email n'existe pas
      return res.status(200).json({ success: true, message: 'If that email is registered, you will receive a reset link shortly.' });
    }

    // Générer un token de réinitialisation (random hex string)
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Calculer date d'expiration (ex: 1h)
    const resetTokenExpiry = Date.now() + 3600000; // 1 heure en ms

    // Sauvegarder token et expiration dans l'utilisateur
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Construire l’URL de réinitialisation (à adapter à ton front)
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Préparer email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password reset request',
      text: `You requested a password reset. Please click the link to reset your password: ${resetUrl} \n\nIf you did not request this, please ignore this email.`,
      html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>If you did not request this, ignore this email.</p>`,
    };

    // Envoyer email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Reset password email sent' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
});

export default router;
