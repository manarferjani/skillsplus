// services/collaborator.service.js
import Formation from '../models/formation.js'; // Utiliser l'import par défaut


import Test from '../models/test.js';

class CollaboratorService {

  /**
   * Récupère les résultats du collaborateur pour un test donné.
   * @param {String} testId - L'ID du test.
   * @param {String} collaboratorId - L'ID du collaborateur.
   * @returns {Object} - Les résultats du test pour le collaborateur.
   */
  async getCollaboratorResults(testId, collaboratorId) {
    try {
      // Récupérer le test
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test non trouvé");
      }

      // Trouver la participation du collaborateur dans ce test
      const participation = test.participations.find(
        (participation) => participation.collaborator.toString() === collaboratorId
      );

      if (!participation) {
        throw new Error("Participation non trouvée pour ce collaborateur");
      }

      // Récupérer les résultats
      const result = {
        score: participation.totalScore,
        successRate: participation.successRate,
        timeSpent: participation.timeSpent,
        basicScore: participation.basicScore,
        intermediateScore: participation.intermediateScore,
        expertScore: participation.expertScore,
      };

      // Retourner les résultats
      return result;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des résultats: ${error.message}`);
    }
  }
  async getTimeSpent(testId, collaboratorId) {
    try {
      // Récupérer le test
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test non trouvé");
      }

      // Trouver la participation du collaborateur dans ce test
      const participation = test.participations.find(
        (participation) => participation.collaborator.toString() === collaboratorId
      );

      if (!participation) {
        throw new Error("Participation non trouvée pour ce collaborateur");
      }

      // Récupérer les résultats
      const time_spent = participation.timeSpent;

      // Retourner les résultats
      return time_spent;
    } catch (error) {
      throw new Error(`Erreur lors de la récupération des résultats: ${error.message}`);
    }
  }



  /**
   * Récupère les formations recommandées en fonction du score.
   * @param {number} score - Le score du collaborateur.
   * @returns {Array} - Liste des formations recommandées.
   */
  async getRecommendedFormations(score) {
    if (typeof score !== 'number') {
      throw new Error("Le score doit être un nombre");
    }
    try {
      // Exemple de critère : recommander les formations dont le niveau requis est supérieur au score obtenu.
      const formations = await Formation.find({ levelRequired: { $gt: score } });
      return formations;
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

export default new CollaboratorService();
