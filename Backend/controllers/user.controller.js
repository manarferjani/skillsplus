import express from "express";
import User from "../models/user.js";
import UserService from "../services/user.service.js";

const router = express.Router();

// 👉 Ajout d'un utilisateur AVEC email envoyé automatiquement
router.post("/addWithEmail", async (req, res) => {
  try {
    console.log(req.body);

    const { name, email, password, role, jobPosition, gender, status } =
      req.body;

    // Validation des champs
    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    // Vérification de l'existence de l'utilisateur
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur existe déjà",
      });
    }
    console.log("fffffffffffffffff");

    // Création de l'utilisateur via le service + envoi email
    const newUser = await UserService.createUserWithEmail({
      name,
      email,
      password,
      role,
      jobPosition,
      gender,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Utilisateur créé et email envoyé avec succès",
      data: newUser,
    });
  } catch (error) {
    // Capture de l'erreur et réponse à l'utilisateur
    console.error("Erreur serveur:", error);

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue";

    res.status(500).json({
      success: false,
      error: errorMessage,
    });
  }
});

router.get("/get-main-admin", async (req, res) => {
  try {
    const admin = await User.findOne({ role: "admin" }).select("_id");
    if (!admin) return res.status(404).json({ message: "Admin non trouvé" });

    res.json({ adminId: admin._id });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Récupérer les stats par niveau (junior, intermediate, senior)
router.get("/stats/levels", async (req, res) => {
  try {
    const stats = await UserService.getStatsByLevel();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Ajout d'un utilisateur (sans email automatique)
router.post("/add", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs sont requis",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "L'utilisateur existe déjà",
      });
    }

    const newUser = await UserService.addUser({
      name,
      email,
      password,
      role,
      clerkId,
    });

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Récupération de tous les utilisateurs
router.get("/getallUsers", async (req, res) => {
  try {
    const users = await UserService.getAllUsers();

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucun utilisateur trouvé",
      });
    }

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Récupération d'un utilisateur par ID
router.get("/getUserById/:id", async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Mise à jour d'un utilisateur
router.put("/update/:id", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Aucune donnée fournie pour la mise à jour",
      });
    }

    const updatedUser = await UserService.updateUser(req.params.id, req.body);

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé pour mise à jour",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Suppression d'un utilisateur
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedUser = await UserService.deleteUser(req.params.id);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé pour suppression",
      });
    }

    res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès",
      data: deletedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// routes/user.routes.js (ajoute cela à ton routeur)

router.get("/pending-requests", async (req, res) => {
  try {
    const pendingUsers = await UserService.getPendingRequests();

    if (!pendingUsers || pendingUsers.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Aucun utilisateur en attente de validation",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      count: pendingUsers.length,
      data: pendingUsers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
