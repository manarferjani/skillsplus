// services/collaborator.service.js
import Formation from "../models/formation.js"; // Utiliser l'import par défaut
import Collaborator from "../models/collaborator.js";

import Test from "../models/test.js";

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
        (participation) =>
          participation.collaborator.toString() === collaboratorId
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
      throw new Error(
        `Erreur lors de la récupération des résultats: ${error.message}`
      );
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
        (participation) =>
          participation.collaborator.toString() === collaboratorId
      );

      if (!participation) {
        throw new Error("Participation non trouvée pour ce collaborateur");
      }

      // Récupérer les résultats
      const time_spent = participation.timeSpent;

      // Retourner les résultats
      return time_spent;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des résultats: ${error.message}`
      );
    }
  }

  /**
   * Récupère les formations recommandées en fonction du score.
   * @param {number} score - Le score du collaborateur.
   * @returns {Array} - Liste des formations recommandées.
   */
  async getRecommendedFormations(score) {
    if (typeof score !== "number") {
      throw new Error("Le score doit être un nombre");
    }
    try {
      // Exemple de critère : recommander les formations dont le niveau requis est supérieur au score obtenu.
      const formations = await Formation.find({
        levelRequired: { $gt: score },
      });
      return formations;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getPerformers({ filter = "all", limit, sortBy }) {
    try {
      let query = Collaborator.find({ isPerformerOfTheWeek: true });

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      if (filter === "current") {
        query = query.where("performerOfTheWeek.date").gte(oneWeekAgo);
      } else if (filter === "past") {
        query = query.where("performerOfTheWeek.date").lt(oneWeekAgo);
      }

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      if (sortBy === "date") {
        query = query.sort({ "performerOfTheWeek.date": -1 });
      } else if (sortBy === "successRate") {
        query = query.sort({ "performerOfTheWeek.successRateAfter": -1 });
      }

      const performers = await query
        .populate("performerOfTheWeek.technologyId", "name") // garde la population
        .populate("technology_success_rate.technologyId", "name")
        .select("name jobPosition technology_success_rate performerOfTheWeek")
        .lean();

      return performers.map((p) => ({
        name: p.name,
        jobPosition: p.jobPosition,
        technology_success_rate: p.technology_success_rate.map((tech) => ({
          technologyId:
            tech.technologyId && typeof tech.technologyId === "object"
              ? {
                  _id: tech.technologyId._id,
                  name: tech.technologyId.name,
                }
              : { _id: null, name: "Inconnue" },
          history: tech.history || [],
        })),
        performerOfTheWeek: {
          ...p.performerOfTheWeek,
          technologyId:
            p.performerOfTheWeek.technologyId &&
            typeof p.performerOfTheWeek.technologyId === "object"
              ? {
                  _id: p.performerOfTheWeek.technologyId._id,
                  name: p.performerOfTheWeek.technologyId.name,
                }
              : { _id: null, name: "Inconnue" },
        },
      }));
    } catch (error) {
      throw new Error(`Erreur dans getPerformers: ${error.message}`);
    }
  }
  /**
   * Récupère l'historique du taux de réussite d'un collaborateur pour une technologie donnée sur l'année en cours.
   * @param {String} collaboratorId - L'ID du collaborateur.
   * @param {String} technologyId - L'ID de la technologie.
   * @returns {Array} - Historique trié du taux de réussite pour l'année en cours.
   */
  async getSuccessRateHistory(collaboratorId, technologyId) {
    try {
      const collaborator = await Collaborator.findById(collaboratorId);

      if (!collaborator) {
        throw new Error("Collaborateur non trouvé");
      }
      
      console.log(
        "Liste des tech success rates :",
        collaborator.technology_success_rate.map((item) => ({
          id: String(item.technologyId),
          raw: item.technologyId,
        }))
      );
      console.log("TechnologyId reçu dans la requête :", technologyId);

      const techData = collaborator.technology_success_rate.find(
        (item) => String(item.technologyId) === technologyId
      );

      if (!techData) {
        throw new Error("Aucun historique pour cette technologie");
      }

      const currentYear = new Date().getFullYear();

      const history = techData.history
        .filter((entry) => new Date(entry.date).getFullYear() === currentYear)
        .sort((a, b) => new Date(a.date) - new Date(b.date));

      return history;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération de l'historique du taux de réussite : ${error.message}`
      );
    }
  }

  /**
   * Récupère tous les collaborateurs avec leur _id et fullName.
   * @returns {Array} Liste des collaborateurs
   */
  async getAllCollaboratorsBasicInfo() {
    try {
      const collaborators = await Collaborator.find({}, "_id name");
      return collaborators;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des collaborateurs : ${error.message}`
      );
    }
  }
}

export default new CollaboratorService();
