const jwt = require('jsonwebtoken');
const User = require('../models/user');

/**
 * Middleware to protect routes that require authentication
 */
const auth = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        
        // Find user by id
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Add user to request object
        req.user = user;
        req.userId = decoded.id;
        req.userRole = user.role;
        
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ 
            success: false,
            message: 'Token is not valid' 
        });
    }
};

/**
 * Middleware to check if user is admin (role=1)
 */
const isAdmin = (req, res, next) => {
    if (req.userRole !== 1) {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin privileges required' 
        });
    }
    next();
};

/**
 * Middleware to check if user is manager (role=2) or above
 */
const isManager = (req, res, next) => {
    if (req.userRole > 2) { // Role 1 (admin) or 2 (manager) only
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Manager privileges required' 
        });
    }
    next();
};

/**
 * Middleware to check if user has specific role
 */
const hasRole = (roleRequired) => {
    return (req, res, next) => {
        if (req.userRole > roleRequired) {
            return res.status(403).json({ 
                success: false,
                message: 'Access denied. Insufficient privileges' 
            });
        }
        next();
    };
};

module.exports = { auth, isAdmin, isManager, hasRole }; 