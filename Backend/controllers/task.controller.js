import express from "express";
const router = express.Router();
import TaskService from "../services/task.service.js";
import { auth } from "../middleware/auth.js";

// Middleware supposé : req.user._id disponible après authentification

// Récupérer toutes les tâches de l'utilisateur connecté
router.get("/getTaskByUId", auth, async (req, res) => {
  try {
    const tasks = await TaskService.getTasksByUser(req.userId); // req.userId injecté par le middleware
    res.status(200).json({ success: true, tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route protégée par auth avec validation complète
router.post("/add", auth, async (req, res) => {
  try {
    // Vérification debug
    console.log("User ID from middleware:", req.user?._id);
    console.log("Request user object:", req.user);

    if (!req.user?._id) {
      return res.status(400).json({
        success: false,
        message: "User ID not available in request",
      });
    }

    const task = await TaskService.createTask(req.body, req.user._id);
    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Mettre à jour une tâche
router.put("/update/:id", async (req, res) => {
  try {
    const updatedTask = await TaskService.updateTask(
      req.params.id,
      req.body,
      req.user._id
    );
    res.status(200).json(updatedTask);
  } catch (error) {
    const status = error.message === "Tâche non trouvée" ? 404 : 400;
    res.status(status).json({ message: error.message });
  }
});

// Supprimer une tâche
router.delete("/delete/:id", auth, async (req, res) => {  // <-- Ajout du middleware auth ici
  try {
    // Debug: vérification des IDs
    console.log("Tentative suppression - TaskID:", req.params.id, "UserID:", req.user?._id);
    
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Non autorisé" });
    }

    const deletedTask = await TaskService.deleteTask(
      req.params.id,
      req.user._id  // Maintenant garanti d'exister grâce au middleware auth
    );

    res.status(204).json({ 
      success: true,
      message: "Tâche supprimée avec succès" 
    });
  } catch (error) {
    console.error("Erreur suppression:", error);
    
    const status = error.message.includes("non trouvée") ? 404 : 400;
    res.status(status).json({ 
      success: false,
      message: error.message,
      taskId: req.params.id
    });
  }
});

export default router;
