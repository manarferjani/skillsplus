const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();
const crypto = require('crypto');
const { auth } = require('../middleware/auth');

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated id of the user
 *         name:
 *           type: string
 *           description: The user's name
 *         email:
 *           type: string
 *           description: The user's email
 *         password:
 *           type: string
 *           description: The user's password (will be hashed)
 *         role:
 *           type: number
 *           enum: [1, 2, 3]
 *           description: User role (1=admin, 2=manager, 3=collaborator)
 *         clerkId:
 *           type: string
 *           description: ID from Clerk authentication service
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the user was created
 *       example:
 *         name: John Doe
 *         email: john.doe@example.com
 *         password: Password123
 *         role: 3
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         token:
 *           type: string
 *           description: Access token for authentication
 *         refreshToken:
 *           type: string
 *           description: Refresh token for getting new access tokens
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             role:
 *               type: number
 *             roleName:
 *               type: string
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
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *               role:
 *                 type: number
 *                 enum: [1, 2, 3]
 *                 description: User role (1=admin, 2=manager, 3=collaborator)
 *               clerkId:
 *                 type: string
 *                 description: ID from Clerk authentication (optional)
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: User already exists or invalid data
 *       500:
 *         description: Server error
 */
router.post('/signup', async (req, res) => {
    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false,
                message: 'User with this email already exists' 
            });
        }

        // Create new user
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            role: req.body.role || 3, // Default to collaborator (3)
            clerkId: req.body.clerkId || null
        });

        // Save user to database
        const savedUser = await user.save();

        // Create tokens
        const { accessToken, refreshToken } = generateTokens(savedUser);

        // Return user data without password
        res.status(201).json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                id: savedUser._id,
                name: savedUser.name,
                email: savedUser.email,
                role: savedUser.role,
                roleName: savedUser.getRoleName()
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Login a user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid credentials' 
            });
        }

        // Create tokens
        const { accessToken, refreshToken } = generateTokens(user);

        res.json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roleName: user.getRoleName()
            }
        });
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * @swagger
 * /api/auth/clerk:
 *   post:
 *     summary: Register or authenticate a user via Clerk
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - clerkId
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email
 *               name:
 *                 type: string
 *                 description: The user's name (optional)
 *               clerkId:
 *                 type: string
 *                 description: ID from Clerk authentication
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */
router.post('/clerk', async (req, res) => {
    try {
        const { email, name, clerkId } = req.body;
        
        if (!email || !clerkId) {
            return res.status(400).json({
                success: false,
                message: 'Email and clerkId are required'
            });
        }

        // Check if user exists with this clerk ID
        let user = await User.findOne({ clerkId });
        
        // If no user with this clerk ID, check by email
        if (!user) {
            user = await User.findOne({ email });
            
            // If user exists by email, update their clerkId
            if (user) {
                user.clerkId = clerkId;
                await user.save();
            } else {
                // Create new user if doesn't exist
                user = new User({
                    name: name || email.split('@')[0],
                    email,
                    // Create a random secure password since login will be via Clerk
                    password: Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12),
                    clerkId,
                    role: 3 // Default to collaborator role
                });
                await user.save();
            }
        }

        // Create tokens
        const { accessToken, refreshToken } = generateTokens(user);

        res.json({
            success: true,
            token: accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roleName: user.getRoleName(),
                clerkId: user.clerkId
            }
        });
    } catch (error) {
        console.error('Clerk auth error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error', 
            error: error.message 
        });
    }
});

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Get a new access token using a refresh token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token
 *     responses:
 *       200:
 *         description: New access token generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: New access token
 *       401:
 *         description: Invalid refresh token
 *       500:
 *         description: Server error
 */
router.post('/refresh-token', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        try {
            // Verify refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'your_refresh_jwt_secret');
            
            // Find user
            const user = await User.findById(decoded.id);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'Invalid refresh token'
                });
            }

            // Generate new access token
            const accessToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'your_jwt_secret',
                { expiresIn: '1h' }
            );

            return res.json({
                success: true,
                token: accessToken
            });
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: 'Invalid refresh token'
            });
        }
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email
 *     responses:
 *       200:
 *         description: Password reset request successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset token generated
 *                 resetToken:
 *                   type: string
 *                   description: Token for password reset (would normally be sent via email)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User with this email does not exist'
            });
        }

        // Generate reset token
        const resetToken = crypto.randomBytes(20).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

        // Save token to user
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        // In a production environment, send email with reset link
        // For demo purposes, we'll just return the token
        res.json({
            success: true,
            message: 'Password reset token generated',
            resetToken // In production, this would be sent via email, not in the response
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using a reset token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 description: The reset token sent to user's email
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: The new password
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password has been reset
 *       400:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        
        // Find user with this reset token and valid expiry
        const user = await User.findOne({
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Password reset token is invalid or has expired'
            });
        }

        // Set new password
        user.password = newPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({
            success: true,
            message: 'Password has been reset'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: number
 *                     roleName:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *                       format: date
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/profile', auth, async (req, res) => {
    try {
        // User is already available from auth middleware
        const user = req.user;
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roleName: user.getRoleName(),
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: number
 *                     roleName:
 *                       type: string
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/profile', auth, async (req, res) => {
    try {
        const user = req.user;
        
        // Update allowed fields
        if (req.body.name) {
            user.name = req.body.name;
        }
        
        // Save updated user
        await user.save();
        
        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                roleName: user.getRoleName()
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Current password
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Current password is incorrect
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = req.user;
        
        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }
        
        // Update password
        user.password = newPassword;
        await user.save();
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out a user (client-side token removal)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logout instructions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: To complete logout, remove tokens from client storage
 */
router.post('/logout', (req, res) => {
    // Since JWT is stateless, server-side logout is mostly for guidance
    // The actual logout happens on the client by removing the tokens
    res.json({
        success: true,
        message: 'To complete logout, remove tokens from client storage'
    });
});

// Helper function to generate access and refresh tokens
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'your_jwt_secret',
        { expiresIn: '1h' }
    );
    
    const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || 'your_refresh_jwt_secret',
        { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
};

module.exports = router; 