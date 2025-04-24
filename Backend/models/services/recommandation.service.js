// services/recommandation.service.js
const Recommendation = require('../models/recommandation');

class RecommendationService {
  /**
   * Crée une nouvelle recommandation.
   * @param {Object} data - Les données de la recommandation.
   * @returns {Promise<Object>} La recommandation sauvegardée.
   * @throws {Error} En cas d'erreur lors de la sauvegarde.
   */
  async addRecommendation(data) {
    try {
      const newRecommendation = new Recommendation(data);
      const savedRecommendation = await newRecommendation.save();
      return savedRecommendation;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Récupère toutes les recommandations.
   * @returns {Promise<Array>} La liste de toutes les recommandations.
   * @throws {Error} En cas d'erreur lors de la récupération.
   */
  async getAllRecommendations() {
    try {
      const recommendations = await Recommendation.find()
        .populate('user')
        .populate('test')
        .populate('formation');
      return recommendations;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Récupère une recommandation par son identifiant.
   * @param {string} id - L'identifiant de la recommandation.
   * @returns {Promise<Object|null>} La recommandation trouvée ou null si non trouvée.
   * @throws {Error} En cas d'erreur lors de la recherche.
   */
  async getRecommendationById(id) {
    if (!id) {
      throw new Error("L'identifiant de la recommandation est requis");
    }
    try {
      const recommendation = await Recommendation.findById(id)
        .populate('user')
        .populate('test')
        .populate('formation');
      return recommendation;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Met à jour une recommandation par son identifiant.
   * @param {string} id - L'identifiant de la recommandation à mettre à jour.
   * @param {Object} data - Les données de mise à jour.
   * @returns {Promise<Object|null>} La recommandation mise à jour ou null si non trouvée.
   * @throws {Error} En cas d'erreur lors de la mise à jour.
   */
  async updateRecommendation(id, data) {
    if (!id) {
      throw new Error("L'identifiant de la recommandation est requis");
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Aucune donnée fournie pour la mise à jour");
    }
    try {
      const updatedRecommendation = await Recommendation.findByIdAndUpdate(id, data, { new: true });
      return updatedRecommendation;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Supprime une recommandation par son identifiant.
   * @param {string} id - L'identifiant de la recommandation à supprimer.
   * @returns {Promise<Object|null>} La recommandation supprimée ou null si non trouvée.
   * @throws {Error} En cas d'erreur lors de la suppression.
   */
  async deleteRecommendation(id) {
    if (!id) {
      throw new Error("L'identifiant de la recommandation est requis");
    }
    try {
      const deletedRecommendation = await Recommendation.findByIdAndDelete(id);
      return deletedRecommendation;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new RecommendationService();
