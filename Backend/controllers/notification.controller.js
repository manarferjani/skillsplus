import express from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead, // <-- Cet import doit correspondre exactement
  createNotification,
  deleteNotification
} from '../services/notification.service.js'; // Vérifiez le chemin
import { sendNotification } from '../services/notification.service.js'

const router = express.Router();

// GET /api/notifications/:userId
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const notifications = await getUserNotifications(userId);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ✅ Nouvelle route : Envoyer une notification
router.post("/send", async (req, res) => {
  const { userId, message, type, link, save } = req.body;

  if (!userId || !message) {
    return res.status(400).json({ message: "userId et message sont requis." });
  }

  try {
    await sendNotification({
      userId,
      message,
      type: type || "info",
      link: link || "",
      save: save !== undefined ? save : true,
    });

    res.json({ success: true, message: "Notification envoyée" });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification :", error);
    res.status(500).json({ message: "Erreur lors de l'envoi de la notification." });
  }
});

// POST /api/notifications/mark-read/:id
router.post("/mark-read/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await markNotificationAsRead(id);
    res.send("Notification marquée comme lue");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Version optimisée - POST /api/notifications/mark-all-read
router.post("/mark-all-read", async (req, res) => {
  const { userId } = req.body; // On reçoit userId dans le body

  try {
    const result = await markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      message: `Toutes les notifications marquées comme lues`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Créer une notification (endpoint utilisé par ton backend quand une action se produit)
router.post("/create", async (req, res) => {
  const { userId, message, link, type } = req.body;
  try {
    const newNotif = await createNotification({ userId, message, link, type });
    res.status(201).json(newNotif);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Supprimer une notification (optionnel)
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await deleteNotification(id);
    res.send("Notification supprimée");
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
