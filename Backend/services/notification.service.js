import Notification from "../models/notification.js";
import { io, connectedUsers } from "../server.js";

export async function getUserNotifications(userId) {
  try {
    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });
    return notifications;
  } catch (error) {
    throw new Error("Erreur lors de la récupération des notifications.");
  }
}

// Marquer toutes les notifications comme lues pour un utilisateur
export async function markAllNotificationsAsRead(userId) {
  try {
    const result = await Notification.updateMany(
      { userId, read: false }, // Filtre : notifications de l'utilisateur non lues
      { $set: { read: true } } // Mise à jour : marquer comme lues
    );
    return result;
  } catch (error) {
    throw new Error("Erreur lors du marquage global des notifications");
  }
}

export async function markNotificationAsRead(notifId) {
  await Notification.findByIdAndUpdate(notifId, { read: true });
}

// Créer une nouvelle notification (fonction générique)
export async function createNotification({
  userId,
  message,
  link = "",
  type = "info",
}) {
  try {
    const newNotif = new Notification({
      userId,
      message,
      link,
      type,
      read: false,
      createdAt: new Date(),
    });
    await newNotif.save();
    return newNotif;
  } catch (error) {
    throw new Error("Erreur lors de la création de la notification.");
  }
}

// Optionnel: supprimer une notification (si besoin)
export async function deleteNotification(notifId) {
  try {
    await Notification.findByIdAndDelete(notifId);
  } catch (error) {
    throw new Error("Erreur lors de la suppression de la notification.");
  }
}

export async function sendNotification({
  userId,
  message,
  type = "info",
  link = "",
  save = true,
}) {
  try {
    console.log("🔔 Appel à sendNotification avec :", {
      userId,
      message,
      type,
      link,
      save,
    });

    const socketId = connectedUsers?.get(userId);

    if (socketId) {
      console.log(
        `📡 Envoi de la notification en temps réel via socket à l'utilisateur ${userId}`
      );
      io.to(socketId).emit("receiveNotification", { message, type, link });
    } else {
      console.log(
        `⚠️ Aucun socketId trouvé pour l'utilisateur ${userId}. Notification non envoyée en direct.`
      );
    }
    console.log("🔍 Valeur de save :", save);
    if (save) {
      const notif = new Notification({
        userId,
        message,
        type,
        link,
        read: false,
        createdAt: new Date(),
      });

      console.log("📝 Tentative de sauvegarde de la notification :", notif);

      try {
        await notif.save();
        console.log("✅ Notification enregistrée avec succès !");
      } catch (saveErr) {
        console.error(
          "❌ Erreur lors de la sauvegarde de la notification :",
          saveErr
        );
      }
    }
  } catch (err) {
    console.error(
      "❌ Erreur lors de l'envoi ou l'enregistrement de la notification :",
      err
    );
  }
}
