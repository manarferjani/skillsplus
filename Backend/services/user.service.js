import User from "../models/user.js";
import Admin from "../models/admin.js";
import Manager from "../models/manager.js";
import { Collaborator, getCollaboratorById } from "../models/collaborator.js";
import { sendWelcomeEmail } from "./email.service.js";

// Mapper le rôle au bon modèle Mongoose
const mapRoleToModel = {
  admin: Admin,
  manager: Manager,
  collaborator: Collaborator,
};

class UserService {
  async addUser(data) {
    try {
      const Model = mapRoleToModel[data.role] || User;
      const user = new Model(data);
      return await user.save();
    } catch (error) {
      throw new Error(error.message);
    }
  }
  /**
   * Récupérer les stats du nombre d'utilisateurs par niveau (junior, intermediate, senior)
   * Retourne un objet { junior: x, intermediate: y, senior: z }
   */
  async getStatsByLevel() {
    try {
      // Regroupement MongoDB par champ level dans Collaborator
      const aggregation = await Collaborator.aggregate([
        {
          $group: {
            _id: "$level", // on groupe par "level"
            count: { $sum: 1 },
          },
        },
      ]);

      // Formatage en objet { junior: ..., intermediate: ..., senior: ... }
      const stats = { junior: 0, intermediate: 0, senior: 0 };
      aggregation.forEach((item) => {
        if (item._id && stats.hasOwnProperty(item._id.toLowerCase())) {
          stats[item._id.toLowerCase()] = item.count;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(
        "Erreur lors de la récupération des statistiques par niveau : " +
          error.message
      );
    }
  }

  async createUserWithEmail(data) {
    try {
      const Model = mapRoleToModel[data.role] || User;

      // Créer l'utilisateur avec génération du username dans le modèle
      const user = new Model(data);
      const savedUser = await user.save();

      // Envoyer l'email de bienvenue
      await sendWelcomeEmail(savedUser.email, savedUser.name, data.password);

      return savedUser;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getAllUsers() {
    try {
      const admins = await Admin.find({});
      const managers = await Manager.find({});
      const collaborators = await Collaborator.find({});

      // Ajouter explicitement le rôle (utile côté frontend)
      const withRole = (users, role) =>
        users.map((u) => ({ ...u.toObject(), role }));

      return [
        ...withRole(admins, "admin"),
        ...withRole(managers, "manager"),
        ...withRole(collaborators, "collaborator"),
      ];
    } catch (error) {
      throw new Error(
        "Erreur lors de la récupération des utilisateurs : " + error.message
      );
    }
  }

  async getUserById(id) {
    if (!id) {
      throw new Error("L'identifiant de l'utilisateur est requis");
    }

    try {
      return await User.findById(id);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateUser(id, data) {
    if (!id) {
      throw new Error("L'identifiant de l'utilisateur est requis");
    }

    try {
      return await User.findByIdAndUpdate(id, data, { new: true });
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteUser(id) {
    if (!id) {
      throw new Error("L'identifiant de l'utilisateur est requis");
    }

    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async join_Test(testId, date) {
    throw new Error("Not implemented yet");
  }

  
  async getPendingRequests() {
    try {
      const pendingUsers = await User.find({ role: "unspecified" });
      return pendingUsers;
    } catch (error) {
      throw new Error("Erreur lors de la récupération des utilisateurs en attente : " + error.message);
    }
  }
}

export default new UserService();
