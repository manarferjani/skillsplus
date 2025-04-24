import jwt from 'jsonwebtoken';
import User from '../models/user.js';

/**
 * Middleware to protect routes that require authentication using JWT.
 *
 * It checks for the token in the "Authorization" header,
 * verifies it using the JWT secret, and attaches the user and token information to the request.
 */
const auth = async (req, res, next) => {
    try {
        // Extraction du token depuis le header (ou éventuellement un cookie)
        const token =
            req.header('Authorization')?.replace('Bearer ', '') ||
            req.cookies?.token;
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'No token, authorization denied' 
            });
        }

        // Vérifier le token et gérer les erreurs spécifiques
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
        } catch (error) {
            console.error('JWT verification error:', error);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    success: false,
                    message: 'Token has expired'
                });
            }
            return res.status(401).json({ 
                success: false,
                message: 'Token is not valid'
            });
        }

        if (!decoded || !decoded.id) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token payload'
            });
        }

        // Cherche l'utilisateur associé au token
        const user = await User.findById(decoded.id);
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Ajout des informations à l'objet requête
        req.user = user;
        req.userId = decoded.id;
        req.userRole = user.role;

        // Passage au middleware suivant ou à l'endpoint
        next();
    } catch (error) {
        console.error('Auth middleware unexpected error:', error);
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
 * Middleware to check if user is manager (role 1 or 2)
 */
const isManager = (req, res, next) => {
    if (req.userRole > 2) { // Only roles 1 and 2 are allowed
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Manager privileges required' 
        });
    }
    next();
};

/**
 * Middleware to check if user has a specific role or higher.
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

// Exportation des middlewares en tant qu'exportations nommées
export { auth, isAdmin, isManager, hasRole };
