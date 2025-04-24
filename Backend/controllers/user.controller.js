import express from 'express';
import User from '../models/user.js';
import UserService from '../services/user.service.js';

const router = express.Router();

// Ajout d'un utilisateur (fonctionnel)
router.post('/add', async (req, res) => {
  try {
    const { name, email, password, role, clerkId } = req.body;
    
    // Validation des champs
    if (!name || !email || !password || !role || !clerkId) {
      return res.status(400).json({ 
        success: false,
        message: "Tous les champs sont requis" 
      });
    }

    // Vérification de l'existence de l'utilisateur
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "L'utilisateur existe déjà" 
      });
    }
    
    // Création de l'utilisateur via le service
    const newUser = await UserService.addUser({
      name,
      email,
      password,
      role,
      clerkId
    });
    
    res.status(201).json({
      success: true,
      data: newUser
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Récupération de tous les utilisateurs
router.get('/getallUsers', async (req, res) => {
  try {
    const users = await UserService.getAllUsers();
    
    if (!users || users.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "Aucun utilisateur trouvé" 
      });
    }
    
    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Récupération d'un utilisateur par ID
router.get('/getUserById/:id', async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Mise à jour d'un utilisateur
router.put('/update/:id', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Aucune donnée fournie pour la mise à jour" 
      });
    }
    
    const updatedUser = await UserService.updateUser(req.params.id, req.body);
    
    if (!updatedUser) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé pour mise à jour" 
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Suppression d'un utilisateur
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedUser = await UserService.deleteUser(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: "Utilisateur non trouvé pour suppression" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès",
      data: deletedUser
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

export default router;