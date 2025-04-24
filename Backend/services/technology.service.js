// services/technology.service.js
import Technologie from '../models/technology.js';

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
}

export default new TechnologyService();
