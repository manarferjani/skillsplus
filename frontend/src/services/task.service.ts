import apiClient from "@/lib/api-client"; // adapte le chemin selon ton projet
import { AxiosError } from "axios";
import { Task } from '@/interfaces/task.interface'


// Fonction pour convertir la réponse backend en Task frontend
function mapToTask(rawTask: any): Task {
    return {
        _id: rawTask._id,
        title: rawTask.title,
        description: rawTask.description,
        iconColor: rawTask.iconColor || 'bg-gray-500',
        iconType: rawTask.iconType || 'circle',
        completed: rawTask.completed,
        dueDate: rawTask.dueDate || 'today', // ou un default que tu souhaites
        priority: rawTask.priority || 'medium',
        userId: rawTask.userId,
        createdAt: rawTask.createdAt,
        updatedAt: rawTask.updatedAt,
        label: rawTask.label,
    };
}


class TaskService {


    // Récupérer toutes les tâches de l'utilisateur (authentifié)
    async getUserTasks(): Promise<Task[]> {
        try {
            const response = await apiClient.get("/api/tasks/getTaskByUId");
            const rawTasks = response.data.tasks;
            return rawTasks.map((task: any) => mapToTask(task));
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message || "Erreur lors de la récupération des tâches");
            }
            throw new Error("Erreur inconnue lors de la récupération des tâches");
        }
    }


    // Créer une nouvelle tâche
    // task.service.ts
    async createTask(taskData: {
        title: string;
        description: string;
        status: string;
        label: string;
        priority: string;
        dueDate: string;
    }): Promise<Task> {
        try {
            const response = await apiClient.post("/api/tasks/add", taskData);
            

            // Retournez un objet Task complet
            return {
                ...response.data, // Spread operator pour inclure toutes les propriétés
                dueDate: response.data.dueDate || taskData.dueDate // Fallback au cas où
            };
        } catch (error) {
            console.error("Erreur création tâche:", error);
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message || "Erreur lors de la création de la tâche");
            }
            throw new Error("Erreur inconnue lors de la création de la tâche");
        }
    }


    // (Optionnel) Mettre à jour une tâche
    async updateTask(taskId: string, updateData: Partial<Task>) {
        try {
            const response = await apiClient.put(`/api/tasks/${taskId}`, updateData);
            return response.data.task;
        } catch (error: unknown) {
            if (error instanceof AxiosError) {
                throw new Error(error.response?.data?.message || "Erreur lors de la mise à jour de la tâche");
            }
            throw new Error("Erreur inconnue lors de la mise à jour de la tâche");
        }
    }

    // (Optionnel) Supprimer une tâche
    // Supprimer une tâche
    async deleteTask(taskId: string): Promise<void> {
        try {
            if (!taskId) throw new Error("ID de tâche manquant");

            await apiClient.delete(`/api/tasks/delete/${taskId}`);
        } catch (error) {
            this.handleError(error, "Échec de la suppression de la tâche");
        }
    }
    // Gestion centralisée des erreurs
    private handleError(error: unknown, defaultMessage: string): never {
        console.error("API Error:", error);

        if (error instanceof AxiosError) {
            throw new Error(
                error.response?.data?.message ||
                error.message ||
                defaultMessage
            );
        } else if (error instanceof Error) {
            throw error;
        }

        throw new Error(defaultMessage);
    }
}

export default new TaskService();
