import User from '../models/user.js';
import Admin from '../models/admin.js';
import Manager from '../models/manager.js';
import Collaborator from '../models/collaborator.js';
import { sendWelcomeEmail } from './email.service.js';

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
        ...withRole(admins, 'admin'),
        ...withRole(managers, 'manager'),
        ...withRole(collaborators, 'collaborator'),
      ];
    } catch (error) {
      throw new Error('Erreur lors de la récupération des utilisateurs : ' + error.message);
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
}

export default new UserService();
