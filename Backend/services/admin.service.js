// services/admin.service.js
import User from '../models/user.js';

class AdminService {
  /**
   * Récupère la liste de tous les utilisateurs.
   * @returns {Promise<Array>} Tableau des utilisateurs.
   */
  async getAllUsers() {
    try {
      const users = await User.find();
      return users;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Met à jour le rôle d'un utilisateur.
   * @param {string} userId - L'identifiant de l'utilisateur.
   * @param {number} role - Le nouveau rôle (1=admin, 2=manager, 3=collaborateur).
   * @returns {Promise<Object>} L'utilisateur mis à jour.
   */
  async updateUserRole(userId, role) {
    if (!userId || !role) {
      throw new Error("Identifiant et rôle sont requis");
    }
    if (![1, 2, 3].includes(role)) {
      throw new Error("Rôle invalide");
    }
    try {
      const updatedUser = await User.findByIdAndUpdate(userId, { role }, { new: true });
      return updatedUser;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Supprime un utilisateur par son identifiant.
   * @param {string} userId - L'identifiant de l'utilisateur à supprimer.
   * @returns {Promise<Object>} L'utilisateur supprimé.
   */
  async deleteUser(userId) {
    if (!userId) {
      throw new Error("L'identifiant de l'utilisateur est requis");
    }
    try {
      const deletedUser = await User.findByIdAndDelete(userId);
      return deletedUser;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new AdminService();
