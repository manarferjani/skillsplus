// services/test.service.js
import Test from '../models/test.js';
import { Collaborator } from '../models/collaborator.js';

import Technologie from '../models/technology.js';  // Utilise l'export par défaut


import '../models/user.js';


class TestService {

  addTest = async (data) => {
    const {
      title,
      level,
      technology,
      description,
      scheduledDate,
      duration,
      createdBy,
      questions
    } = data;

    // Création de l'objet test
    const newTest = new Test({
      title,
      level,
      technology,
      description,
      scheduledDate,
      duration,
      createdBy,
      questions
    });
    const savedTest = await newTest.save(); // Sauvegarde d'abord

    // Ajout automatique du test à la technologie
    await Technologie.findByIdAndUpdate(
      technology,
      { $push: { tests: savedTest._id } }, // ajoute l'ID du test au tableau
      { new: true }
    );

    return savedTest;
  };

  async getAllTests() {
    try {
      const tests = await Test.find();
      return tests;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async getFormattedTests() {
    try {
      const tests = await Test.find()
        .populate({
          path: 'technology',
          select: 'name',
          model: 'Technologie',
        })
        .populate({
          path: 'participations.user',
          select: 'name email role',
          model: 'User',
        })
        .lean();

      return tests.map(test => {
        // Protection contre les valeurs nulles
        const technology = test.technology || {};
        const participations = test.participations || [];

        return {
          id: test._id?.toString() || '', // Conversion sécurisée en string
          title: test.title || 'Titre non spécifié',
          technologie: technology.name || 'Technologie non spécifiée',
          //technologieDescription: technology.description || '', // Ajout séparé si nécessaire
          duration: test.duration || 0,
          scheduledDate: test.scheduledDate || null,
          averageScore: test.averageScore || 0,
          averageSuccessRate: test.averageSuccessRate || 0,
          participations: participations.map(p => {
            const user = p.user || {};
            return {
              collaborateurNom: user.name || 'Inconnu',
              collaborateurEmail: user.email || '',
              totalScore: p.totalScore || 0,
              successRate: p.successRate || 0,
              timeSpent: p.timeSpent || 0
            };
          })
        };
      });
    } catch (error) {
      console.error('Erreur dans getFormattedTests:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error('Échec de la récupération des tests: ' + error.message);
    }
  }


  async getTestById(id) {
    if (!id) {
      throw new Error("L'identifiant du test est requis");
    }
    try {
      const test = await Test.findOne({ _id: id });
      return test;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateTest(id, data) {
    if (!id) {
      throw new Error("L'identifiant du test est requis");
    }
    if (!data || Object.keys(data).length === 0) {
      throw new Error("Aucune donnée fournie pour la mise à jour");
    }
    try {
      // Utilisation de { new: true } pour retourner le document mis à jour
      const updatedTest = await Test.findOneAndUpdate({ _id: id }, data, { new: true });
      return updatedTest;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async deleteTest(id) {
    if (!id) {
      throw new Error("L'identifiant du test est requis");
    }
    try {
      const deletedTest = await Test.findOneAndDelete({ _id: id });
      return deletedTest;
    } catch (error) {
      throw new Error(error.message);
    }
  }



  /*async CalculerResultatTest(testId, collaboratorId, response) {
    const test = await Test.findById(testId);
    if (!test) throw new Error("Test non trouvé");

    // Définition des points par niveau selon vos spécifications
    let basicScore = 0;
    let intermediateScore = 0;
    let expertScore = 0;
    let isCorrect = false;
    let basic = false;
    let intermediate = false;
    let expert = false;


    const scoreByLevel = {
        basic: 5,        // 5 premières questions
        intermediate: 10, // 10 questions suivantes (6-15)
        expert: 15        // 5 dernières questions (16-20)
    };

    // Trouver la question
    const question = test.questions.find(q => q._id.toString() === response.questionTextt.toString());
    if (!question) throw new Error("Question introuvable");

    // Vérifier si la réponse est correcte
    isCorrect = response.response === question.correctAnswer;
    
    if (isCorrect) {
        const questionIndex = test.questions.indexOf(question);
        
        if (questionIndex < 5) { // Questions 1-5 (Basic)
            basicScore = scoreByLevel.basic;
            basic = true;
            return {isCorrect, basicScore, basic};
            
            
        } 
        else if (questionIndex >= 5 && questionIndex < 15) { // Questions 6-15 (Intermediate)
            intermediateScore = scoreByLevel.intermediate;
            intermediate = true;
            return {isCorrect, intermediateScore, intermediate};

        } 
        else { // Questions 16-20 (Expert)
            expertScore = scoreByLevel.expert;
            expert = true;
            return {isCorrect, expertScore, expert};
            
            //TotalScore += scoreByLevel.expert;
        }
    }
    
    
  }
*/






  /**
   * Récupère la liste des tests pour le calendrier en ajoutant un indicateur "joinable".
   * Un test est joinable si l'heure actuelle est >= scheduledDate ET <= scheduledDate + 15 minutes.
   *
   * @returns {Promise<Array>} Tableau d'objets tests enrichis.
   */
  async getTestsForCalendar() {
    // Récupération de tous les tests triés par scheduledDate
    const tests = await Test.find().sort({ scheduledDate: 1 });
    const now = new Date();

    // Durée autorisée pour rejoindre le test : 15 minutes en millisecondes
    const joinWindow = 15 * 60 * 1000;

    // Transformation du tableau des tests pour y ajouter le flag "joinable"
    return tests.map(test => {
      const scheduledTime = new Date(test.scheduledDate).getTime();
      const nowTime = now.getTime();
      // Le test est joinable si maintenant est entre scheduledDate et scheduledDate + 15 minutes
      const joinable = nowTime >= scheduledTime && nowTime <= scheduledTime + joinWindow;
      return {
        _id: test._id,
        title: test.title,
        scheduledDate: test.scheduledDate,
        joinable
      };
    });
  }

  /**
   * Permet à un collaborateur de démarrer (rejoindre) un test suite au clic sur le bouton "Join".
   * La méthode vérifie :
   *  - que le test existe,
   *  - que l'heure actuelle se situe dans la fenêtre d'ouverture (>= scheduledDate et <= scheduledDate + 15 minutes),
   *  - que le collaborateur n'a pas déjà rejoint ce test.
   *
   * Si tout est validé, la participation est enregistrée dans le tableau "results"
   * du Test, et le test est également ajouté dans le tableau "testsTaken" du Collaborator.
   *
   * @param {String} testId - L'ID du test.
   * @param {String} collaboratorId - L'ID du collaborateur.
   * @returns {Promise<Object>} L'objet participation créé.
   * @throws {Error} Si le test n'existe pas, si l'heure n'est pas dans la fenêtre de 15 minutes, ou si le collaborateur a déjà rejoint.
   */
  async demarrerTest(testId, collaboratorId) {
    // Recherche du test
    const test = await Test.findById(testId);
    if (!test) {
      throw new Error("Test non trouvé");
    }

    const now = new Date();
    const nowTime = now.getTime();
    const scheduledTime = new Date(test.scheduledDate).getTime();
    const joinWindow = 15 * 60 * 1000;

    // Vérification que l'heure actuelle se situe dans la fenêtre d'ouverture
    if (nowTime < scheduledTime) {
      throw new Error("Le test ne peut pas être démarré avant la date programmée");
    }
    if (nowTime > scheduledTime + joinWindow) {
      throw new Error("La période pour rejoindre ce test est expirée");
    }

    // Vérifier si le collaborateur a déjà rejoint le test dans le tableau results
    const alreadyJoined = test.results.find(result => result.collaborator.toString() === collaboratorId);
    if (alreadyJoined) {
      throw new Error("Vous avez déjà rejoint ce test. Vous ne pouvez le rejoindre qu'une seule fois.");
    }


    // Enregistrement de la participation dans le Test
    const newParticipation = {
      collaborator: collaboratorId,
      score: 0,
      successRate: 0,
      passedAt: now,
      startTime: nowTime,
      endTime: null,
      timeSpent: null,
      basicScore: 0,
      intermediateScore: 0,
      expertScore: 0
    };

    test.participations.push(newParticipation);
    await test.save();

    // Mise à jour du collaborateur : ajout de ce test dans testsTaken
    const collaborator = await Collaborator.findById(collaboratorId);
    if (!collaborator) {
      throw new Error("Collaborateur non trouvé");
    }

    collaborator.testsTaken.push({
      testId: test._id,
      score: 0,
      successRate: 0,
      takenAt: now
    });
    await collaborator.save();

    return newParticipation;
  }

  async submitTest(testId, collaboratorId, responses) {
    try {
      // Trouver le test correspondant et la participation du collaborateur
      const test = await Test.findOne({ _id: testId });
      if (!test) {
        throw new Error("Test non trouvé");
      }

      // Trouver la participation du collaborateur dans ce test
      const participationIndex = test.participations.findIndex(participation => participation.collaborator.toString() === collaboratorId);
      if (participationIndex === -1) {
        throw new Error("Participation du collaborateur non trouvée");
      }

      const participation = test.participations[participationIndex];

      // Enregistrer l'heure de fin du test
      const endTime = new Date();
      participation.endTime = endTime; // Associe l'heure de fin à la participation

      // Calculer le temps passé en millisecondes
      const timeSpentInMillis = endTime - participation.startTime;

      // Conversion du temps en heures, minutes, secondes
      const hours = Math.floor(timeSpentInMillis / (1000 * 60 * 60));
      const minutes = Math.floor((timeSpentInMillis % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeSpentInMillis % (1000 * 60)) / 1000);

      const timeSpent = `${hours} heures ${minutes} minutes ${seconds} secondes`;

      // Mettre à jour le temps passé dans la participation
      participation.timeSpent = timeSpent;

      // Calculer le résultat du test (ici vous pouvez utiliser votre fonction `CalculerResultatTest` pour calculer le score si nécessaire)
      //const result = await this.CalculerResultatTest(testId, collaboratorId, responses);

      // Mettre à jour le score du test dans la participation
      //participation.TotalScore = result.score;
      //participation.successRate = result.successRate;

      // Sauvegarder le test avec la mise à jour
      await test.save();

      // Optionnel : Vous pouvez aussi mettre à jour le collaborateur
      const collaborator = await Collaborator.findById(collaboratorId);
      if (collaborator) {
        const testTakenIndex = collaborator.testsTaken.findIndex(entry => entry.testId.toString() === testId);
        if (testTakenIndex !== -1) {

          collaborator.testsTaken[testTakenIndex].takenAt = endTime;
          collaborator.testsTaken[testTakenIndex].timeSpent = timeSpent;
          await collaborator.save();
        }
      }

      // Récupérer le score et le taux de réussite enregistrés dans la participation
      const score = participation.TotalScore;
      const successRate = participation.successRate;

      return {
        message: "Test soumis avec succès",
        timeSpent,
        score,
        successRate,
        participationIndex
      };

    } catch (error) {
      throw new Error(error.message);
    }
  }

  async updateScore(testId, collaboratorId, totalScore, successRate) {
    // Vérification des paramètres requis
    if (!testId || !collaboratorId) {
      throw new Error("testId et collaboratorId sont requis");
    }
  
    try {
      // Trouver le test par son ID
      const test = await Test.findById(testId);
      if (!test) {
        throw new Error("Test non trouvé");
      }
  
      // Trouver la participation du collaborateur dans le test
      const participation = test.participations.find(p => p.user.toString() === collaboratorId);
      if (!participation) {
        throw new Error("Participation du collaborateur non trouvée");
      }
  
      // Mettre à jour le score et le taux de réussite dans le test
      participation.totalScore = totalScore;
      participation.successRate = successRate;
  
      // Sauvegarder le test avec les nouvelles valeurs
      await test.save();
  
      // Mettre à jour le score et le taux de réussite dans le collaborateur (si nécessaire)
      const collaborator = await Collaborator.findById(collaboratorId);
      if (collaborator) {
        const testIndex = collaborator.testsTaken.findIndex(entry => entry.testId.toString() === testId);
        if (testIndex !== -1) {
          collaborator.testsTaken[testIndex].totalScore = totalScore;
          collaborator.testsTaken[testIndex].successRate = successRate;
          await collaborator.save();
        }
      }
  
      return {
        message: "Score mis à jour avec succès",
        totalScore,
        successRate
      };
    
    } catch (error) {
      throw new Error("Erreur lors de la mise à jour du score : " + error.message);
    }
  }
}

export default new TestService();
