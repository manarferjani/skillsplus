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
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'skills_plus_super_secret_jwt_key_2024');
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
        req.userName = user.name;   // Le rôle de l'utilisateur est maintenant une chaîne

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
 * Middleware to check if user is admin ('admin' role)
 */
const isAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Admin privileges required' 
        });
    }
    next();
};

/**
 * Middleware to check if user is manager ('manager' or 'admin' role)
 */
const isManager = (req, res, next) => {
    if (!['manager', 'admin'].includes(req.userRole)) {  // Vérifie si le rôle est manager ou admin
        return res.status(403).json({ 
            success: false,
            message: 'Access denied. Manager privileges required' 
        });
    }
    next();
};

/**
 * Middleware to check if user is collaborator ('collaborator' role)
 */
const isCollaborator = (req, res, next) => {
    
    if (req.userRole !== 'collaborator') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Collaborator role required'
        });
    }
    next();
};

/**
 * Middleware to check if user has a specific role or higher.
 * The function compares the user's role to the required role in the hierarchy.
 * Roles order: ['collaborator', 'manager', 'admin']
 */
const hasRole = (roleRequired) => {
    return (req, res, next) => {
      const roleHierarchy = ['collaborator', 'manager', 'admin'];
      const userRoleIndex = roleHierarchy.indexOf(req.userRole);
      const requiredRoleIndex = roleHierarchy.indexOf(roleRequired);
  
      if (userRoleIndex < requiredRoleIndex) {
        return res.status(403).json({
          success: false,
          message: `Access denied. ${roleRequired.charAt(0).toUpperCase() + roleRequired.slice(1)} or higher privileges required`
        });
      }
  
      next();
    };
  };
  

// Exportation des middlewares
export { auth, isAdmin, isManager, isCollaborator, hasRole };
