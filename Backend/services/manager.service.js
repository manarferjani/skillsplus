// services/manager.service.js
import Test from '../models/test.js';
import Formation from '../models/formation.js';

class ManagerService {
  /**
   * Crée un nouveau test.
   * @param {Object} data - Les données du test (p.ex. title, technology, managerId, etc.).
   * @returns {Promise<Object>} Le test sauvegardé.
   */
  async createTest(data) {
    if (!data.title || !data.technology) {
      throw new Error("Les champs 'title' et 'technology' sont obligatoires");
    }
    try {
      const newTest = new Test(data);
      const savedTest = await newTest.save();
      return savedTest;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Récupère les tests créés par un manager.
   * @param {string} managerId - L'identifiant du manager.
   * @returns {Promise<Array>} Les tests correspondants.
   */
  async getTestsByManager(managerId) {
    if (!managerId) {
      throw new Error("L'identifiant du manager est requis");
    }
    try {
      const tests = await Test.find({ managerId });
      return tests;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Met à jour un test par son identifiant.
   * @param {string} testId - L'identifiant du test.
   * @param {Object} data - Les données à mettre à jour.
   * @returns {Promise<Object>} Le test mis à jour.
   */
  async updateTest(testId, data) {
    if (!testId) {
      throw new Error("L'identifiant du test est requis");
    }
    try {
      const updatedTest = await Test.findByIdAndUpdate(testId, data, { new: true });
      return updatedTest;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Supprime un test par son identifiant.
   * @param {string} testId - L'identifiant du test à supprimer.
   * @returns {Promise<Object>} Le test supprimé.
   */
  async deleteTest(testId) {
    if (!testId) {
      throw new Error("L'identifiant du test est requis");
    }
    try {
      const deletedTest = await Test.findByIdAndDelete(testId);
      return deletedTest;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  /**
   * Crée une formation liée à un test ou destinée à être recommandée aux collaborateurs.
   * @param {Object} data - Les données de la formation (title, levelRequired, technology, description).
   * @returns {Promise<Object>} La formation sauvegardée.
   */
  async createFormation(data) {
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
}

export default new ManagerService();
