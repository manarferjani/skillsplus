import Task from "../models/task.js";
import mongoose from "mongoose";

class TaskService {
  async getTasksByUser(userId) {
    try {
      const tasks = await Task.find({ userId });
      return tasks;
    } catch (error) {
      throw new Error("Erreur lors de la récupération des tâches");
    }
  }

  async createTask(data, userId) {
    try {
      // Accepte à la fois les ObjectId et les strings
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Conversion en ObjectId si nécessaire
      const userIdToUse =
        typeof userId === "string"
          ? new mongoose.Types.ObjectId(userId)
          : userId;

      const requiredFields = [
        "title",
        "status",
        "label",
        "priority",
        "dueDate",
      ];
      const missingFields = requiredFields.filter((field) => !data[field]);

      if (missingFields.length > 0) {
        throw new Error(`Champs manquants: ${missingFields.join(", ")}`);
      }

      const taskData = {
        ...data,
        userId, // mongoose convertira automatiquement en ObjectId
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const newTask = new Task(taskData);

      return await newTask.save();
    } catch (error) {
      console.error("Erreur création tâche:", error);
      throw new Error(
        error.message || "Erreur lors de la création de la tâche"
      );
    }
  }

  async updateTask(taskId, data, userId) {
    try {
      const updatedTask = await Task.findOneAndUpdate(
        { _id: taskId, userId },
        data,
        { new: true }
      );
      if (!updatedTask) {
        throw new Error("Tâche non trouvée");
      }
      return updatedTask;
    } catch (error) {
      throw new Error("Erreur lors de la mise à jour de la tâche");
    }
  }

// task.service.js
async deleteTask(taskId, userId) {
  try {
    // Validation des IDs
    if (!taskId || !userId) {
      throw new Error("IDs manquants");
    }

    const deletedTask = await Task.findOneAndDelete({ 
      _id: taskId, 
      userId // Sécurité: vérifie que la tâche appartient à l'utilisateur
    });

    if (!deletedTask) {
      throw new Error(`Tâche non trouvée (ID: ${taskId})`);
    }

    return deletedTask;
  } catch (error) {
    console.error("Erreur service:", error);
    throw error; // Transmet l'erreur originale
  }
}
}

export default new TaskService();
