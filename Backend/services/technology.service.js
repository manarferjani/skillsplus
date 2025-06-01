// services/technology.service.js
import Technologie from '../models/technology.js';
import dayjs from 'dayjs'
import Test from '../models/test.js'; // adapte le chemin si nécessaire

class TechnologyService {

  async addTechnology(data) {
    if (!data.name) {
      throw new Error("Le champ 'name' est requis");
    }
    try {
      const newTechnology = new Technologie(data);
      const savedTechnology = await newTechnology.save();
      return savedTechnology;
    } catch (error) {
      throw new Error(error.message);
    }
  }

 
  async getAllTechnologies() {
    try {
      const technologies = await Technologie.find();
      return technologies;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  
  async getAllTechnologiesFiltered() {
    try {
      const technologies = await Technologie.find({}, '_id name');
      return technologies;
    } catch (error) {
      throw new Error('Erreur lors de la récupération des technologies filtrées');
    }
  }


  
  async getTechnologyById(id) {
    if (!id) {
      throw new Error("L'identifiant de la technologie est requis");
    }
    try {
      const technology = await Technologie.findOne({ _id: id });
      return technology;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  
  async updateTechnology(id, data) {
    if (!id) {
      throw new Error("L'identifiant de la technologie est requis");
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Aucune donnée fournie pour la mise à jour");
    }
    try {
      const updatedTechnology = await Technologie.findOneAndUpdate({ _id: id }, data, { new: true });
      return updatedTechnology;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async addTestToTechnology(technologyId, testId) {
    if (!technologyId || !testId) {
      throw new Error("technologyId et testId sont requis");
    }
  
    try {
      const updatedTechnology = await Technologie.findByIdAndUpdate(
        technologyId,
        { $push: { tests: testId } },
        { new: true }
      );
      return updatedTechnology;
    } catch (error) {
      throw new Error("Erreur lors de l'ajout du test à la technologie : " + error.message);
    }
  }

  
  async deleteTechnology(id) {
    if (!id) {
      throw new Error("L'identifiant de la technologie est requis");
    }
    try {
      const deletedTechnology = await Technologie.findOneAndDelete({ _id: id });
      return deletedTechnology;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getAllTechnologiesIdAndNameOnly() {
    try {
      const technologies = await Technologie.find({}, '_id name');
      return technologies;
    } catch (error) {
      throw new Error("Erreur lors de la récupération des technologies (id et nom uniquement) : " + error.message);
    }
  }
   /**
   * Récupère toutes les technologies avec leur _id et name.
   * @returns {Array} Liste des technologies
   */
  async getAllTechnologiesBasicInfo() {
    try {
      const technologies = await Technologie.find({}, "_id name");
      return technologies;
    } catch (error) {
      throw new Error(
        `Erreur lors de la récupération des technologies : ${error.message}`
      );
    }
  }
  async calculateYearlyAverages(technologyId) {
    const currentYear = dayjs().year();
    const startOfYear = dayjs(`${currentYear}-01-01`).toDate();
    const endOfYear = dayjs(`${currentYear}-12-31`).toDate();

    // Récupérer tous les tests complétés de cette technologie pour l'année courante
    const tests = await Test.find({
      technology: technologyId,
      status: 'completed',
      scheduledDate: {
        $gte: startOfYear,
        $lte: endOfYear
      }
    });

    let totalAverageScore = 0;
    let totalAverageSuccessRate = 0;
    let validTests = 0;

    // Calculer les statistiques pour chaque test
    for (const test of tests) {
      if (test.averageScore !== null && test.averageSuccessRate !== null) {
        totalAverageScore += test.averageScore;
        totalAverageSuccessRate += test.averageSuccessRate;
        validTests++;
      }
    }

    // Calculer les moyennes globales
    return {
      averageScore: validTests > 0 ? totalAverageScore / validTests : null,
      averageSuccessRate: validTests > 0 ? totalAverageSuccessRate / validTests : null,
      testCount: validTests,
      year: currentYear
    };
  }

  

  
}

export default new TechnologyService();
