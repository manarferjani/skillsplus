// services/formation.service.js
import Formation from '../models/formation.js'; // Importer l'export par défaut


class FormationService {
  /**
   * Crée une nouvelle formation.
   * @param {Object} data - Les données de la formation (title, levelRequired, technology, description).
   * @returns {Promise<Object>} La formation sauvegardée.
   * @throws {Error} Si un champ obligatoire manque ou en cas d'erreur durant la sauvegarde.
   */
  async addFormation(data) {
    // Vérification des champs obligatoires
    if (!data.title || !data.levelRequired || !data.technology) {
      throw new Error("Les champs 'title', 'levelRequired' et 'technology' sont obligatoires");
    }
    try {
      const newFormation = new Formation(data);
      const savedFormation = await newFormation.save();
      return savedFormation;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Récupère toutes les formations.
   * @returns {Promise<Array>} La liste de toutes les formations.
   * @throws {Error} En cas d'erreur durant la récupération.
   */
  async getAllFormations() {
    try {
      const formations = await Formation.find();
      return formations;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Récupère une formation par son identifiant.
   * @param {string} id - L'identifiant de la formation.
   * @returns {Promise<Object|null>} La formation trouvée ou null si non existante.
   * @throws {Error} Si l'identifiant n'est pas fourni ou en cas d'erreur durant la recherche.
   */
  async getFormationById(id) {
    if (!id) {
      throw new Error("L'identifiant de la formation est requis");
    }
    try {
      const formation = await Formation.findOne({ _id: id });
      return formation;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Met à jour une formation par son identifiant.
   * @param {string} id - L'identifiant de la formation à mettre à jour.
   * @param {Object} data - Les données à mettre à jour.
   * @returns {Promise<Object|null>} La formation mise à jour ou null si elle n'est pas trouvée.
   * @throws {Error} Si l'identifiant ou les données sont manquants ou en cas d'erreur.
   */
  async updateFormation(id, data) {
    if (!id) {
      throw new Error("L'identifiant de la formation est requis");
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Aucune donnée fournie pour la mise à jour");
    }
    try {
      const updatedFormation = await Formation.findOneAndUpdate({ _id: id }, data, { new: true });
      return updatedFormation;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Supprime une formation par son identifiant.
   * @param {string} id - L'identifiant de la formation à supprimer.
   * @returns {Promise<Object|null>} La formation supprimée ou null si non trouvée.
   * @throws {Error} Si l'identifiant n'est pas fourni ou en cas d'erreur durant la suppression.
   */
  async deleteFormation(id) {
    if (!id) {
      throw new Error("L'identifiant de la formation est requis");
    }
    try {
      const deletedFormation = await Formation.findOneAndDelete({ _id: id });
      return deletedFormation;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new FormationService();
