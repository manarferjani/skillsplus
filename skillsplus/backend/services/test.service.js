// services/test.service.js
import Test from "../models/test.js";
import Collaborator from "../models/collaborator.js";
import Technologie from "../models/technology.js"; // Utilise l'export par défaut
import dayjs from "dayjs";

import "../models/user.js";

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
      questions,
    } = data;

    // Création de l'objet test
    const newTest = new Test({
      title,
      level,
      technology, // Utilisation directe de l'ObjectId de la technologie
      description,
      scheduledDate,
      duration,
      createdBy,
      questions,
    });

    const savedTest = await newTest.save(); // Sauvegarde d'abord

    // Ajout automatique du test à la technologie avec l'ObjectId de la technologie
    await Technologie.findByIdAndUpdate(
      technology, // Ici on utilise directement l'ObjectId passé dans la requête
      { $push: { tests: savedTest._id } },
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
          path: "technology",
          select: "name",
          model: "Technologie",
        })
        .populate({
          path: "participations.user",
          select: "name email role",
          model: "User",
        })
        .lean();

      return tests.map((test) => {
        // Protection contre les valeurs nulles
        const technology = test.technology || {};
        const participations = test.participations || [];

        return {
          id: test._id?.toString() || "", // Conversion sécurisée en string
          title: test.title || "Titre non spécifié",
          technologie: technology.name || "Technologie non spécifiée",
          status: test.status,
          //technologieDescription: technology.description || '', // Ajout séparé si nécessaire
          duration: test.duration || 0,
          scheduledDate: test.scheduledDate || null,
          averageScore: test.averageScore || 0,
          averageSuccessRate: test.averageSuccessRate || 0,
          participations: participations.map((p) => {
            const user = p.user || {};
            return {
              collaborateurNom: user.name || "Inconnu",
              collaborateurEmail: user.email || "",
              totalScore: p.totalScore || 0,
              successRate: p.successRate || 0,
              timeSpent: p.timeSpent || 0,
            };
          }),
        };
      });
    } catch (error) {
      console.error("Erreur dans getFormattedTests:", {
        message: error.message,
        stack: error.stack,
      });
      throw new Error("Échec de la récupération des tests: " + error.message);
    }
  }

  async getTestByIdFormatted(id) {
    if (!id) {
      throw new Error("L'identifiant du test est requis");
    }

    try {
      const test = await Test.findById(id)
        .populate({
          path: "technology",
          select: "name",
          model: "Technologie",
        })
        .populate({
          path: "participations.user",
          select: "name email role",
          model: "User",
        })
        .lean();

      if (!test) {
        throw new Error("Test non trouvé");
      }

      // Formatage des questions pour le frontend
      const formattedQuestions = test.questions.map((question) => {
        // ❌ Supprimez le formatage des options → envoyez-les en tant que string[]
        return {
          questionText: question.questionText,
          options: question.options, // ✅ options sont des strings
          correctAnswer: question.correctAnswer,
          correctAnswers: question.correctAnswers,
          type: question.type,
          points: question.points || 0, // Par défaut si absent
        };
      });

      // ✅ Structure finale conforme à l'interface frontend
      return {
        testId: test._id.toString(),
        title: test.title,
        questions: formattedQuestions,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération du test:", error.message);
      throw new Error("Impossible de charger le test");
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
      const updatedTest = await Test.findOneAndUpdate({ _id: id }, data, {
        new: true,
      });
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

  async CalculerResultatTest(testId, collaboratorId, response) {
    const test = await Test.findById(testId);
    if (!test) throw new Error("Test non trouvé");

    // Trouver la question correspondante
    const question = test.questions.find(
      (q) => q._id.toString() === response.questionTextt.toString()
    );
    if (!question) throw new Error("Question introuvable");

    let isCorrect = false;
    let gainedScore = 0;

    // Vérification selon le type de question
    if (question.type === "single") {
      isCorrect = response.response === question.correctAnswer;
    } else if (question.type === "multiple") {
      // Vérifie que toutes les bonnes réponses sont présentes et aucune réponse incorrecte
      const sortedUserResponse = [...response.response].sort();
      const sortedCorrectAnswers = [...question.correctAnswers].sort();
      isCorrect =
        JSON.stringify(sortedUserResponse) ===
        JSON.stringify(sortedCorrectAnswers);
    } else if (question.type === "code") {
      // Ici, à adapter selon votre logique d'évaluation automatique ou manuelle
      // Par défaut on suppose que ce type est évalué manuellement donc false
      isCorrect = false;
    }

    // Calcul du score uniquement si la réponse est correcte
    if (isCorrect) {
      gainedScore = question.points;
    }

    return {
      isCorrect,
      gainedScore,
    };
  }

  /**
   * Récupère la liste des tests pour le calendrier en ajoutant un indicateur "joinable".
   * Un test est joinable si l'heure actuelle est >= scheduledDate ET <= scheduledDate + 15 minutes.
   *
   * @returns {Promise<Array>} Tableau d'objets tests enrichis.
   */
  async getTestsForCalendar() {
    // Récupération de tous les tests ayant une scheduledDate définie, triés chronologiquement
    const tests = await Test.find({ scheduledDate: { $ne: null } })
      .sort({ scheduledDate: 1 })
      .populate("technology"); // <-- Ajout ici

    const now = new Date();
    const joinWindow = 15 * 60 * 1000; // 15 minutes en ms

    const formatHourMinute = (date) => {
      return new Intl.DateTimeFormat("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date);
    };

    return tests.map((test) => {
      const scheduledDate = new Date(test.scheduledDate);
      const durationInMs = (test.duration || 60) * 60 * 1000;
      const endDate = new Date(scheduledDate.getTime() + durationInMs);

      const nowTime = now.getTime();
      const scheduledTime = scheduledDate.getTime();
      const joinable =
        nowTime >= scheduledTime && nowTime <= scheduledTime + joinWindow;

      return {
        _id: test._id,
        title: test.title,
        scheduledDate: test.scheduledDate,
        joinable,
        startTime: formatHourMinute(scheduledDate),
        endTime: formatHourMinute(endDate),
        timeRange: `${formatHourMinute(scheduledDate)} - ${formatHourMinute(
          endDate
        )}`,
        technology: test.technology, // <-- Ajout ici pour le transmettre au frontend
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
      throw new Error(
        "Le test ne peut pas être démarré avant la date programmée"
      );
    }
    if (nowTime > scheduledTime + joinWindow) {
      throw new Error("La période pour rejoindre ce test est expirée");
    }

    // Vérifier si le collaborateur a déjà rejoint le test dans le tableau results
    const alreadyJoined = test.results.find(
      (result) => result.collaborator.toString() === collaboratorId
    );
    if (alreadyJoined) {
      throw new Error(
        "Vous avez déjà rejoint ce test. Vous ne pouvez le rejoindre qu'une seule fois."
      );
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
      expertScore: 0,
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
      takenAt: now,
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
      const participationIndex = test.participations.findIndex(
        (participation) =>
          participation.collaborator.toString() === collaboratorId
      );
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
      const minutes = Math.floor(
        (timeSpentInMillis % (1000 * 60 * 60)) / (1000 * 60)
      );
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
        const testTakenIndex = collaborator.testsTaken.findIndex(
          (entry) => entry.testId.toString() === testId
        );
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
        participationIndex,
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
      const participation = test.participations.find(
        (p) => p.user.toString() === collaboratorId
      );
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
        const testIndex = collaborator.testsTaken.findIndex(
          (entry) => entry.testId.toString() === testId
        );
        if (testIndex !== -1) {
          collaborator.testsTaken[testIndex].totalScore = totalScore;
          collaborator.testsTaken[testIndex].successRate = successRate;
          await collaborator.save();
        }
      }

      return {
        message: "Score mis à jour avec succès",
        totalScore,
        successRate,
      };
    } catch (error) {
      throw new Error(
        "Erreur lors de la mise à jour du score : " + error.message
      );
    }
  }

  /**
   * Récupère l'historique des tests passés par un utilisateur (collaborator).
   * @param {String} collaboratorId - L'ID du collaborateur.
   * @returns {Promise<Array>} Liste des tests avec les détails de participation du collaborateur.
   */
  async getUserTestHistory(collaboratorId) {
    if (!collaboratorId) {
      throw new Error("L'identifiant du collaborateur est requis");
    }

    const tests = await Test.find({ "participations.user": collaboratorId })
      .populate({
        path: "technology",
        select: "name",
        model: "Technologie",
      })
      .populate({
        path: "participations.user",
        select: "name email",
        model: "User",
      })
      .lean();

    // Filtrer et formater uniquement les participations du collaborateur concerné
    return tests
      .map((test) => {
        const participation = test.participations.find(
          (p) => p.user?._id.toString() === collaboratorId
        );
        if (!participation) return null;

        return {
          testId: test._id,
          title: test.title,
          technology: test.technology?.name || "Inconnu",
          scheduledDate: test.scheduledDate,
          duration: test.duration,
          totalScore: participation.totalScore,
          successRate: participation.successRate,
          timeSpent: participation.timeSpent,
        };
      })
      .filter(Boolean); // Enlève les nulls
  }

async getWeeklyTestAverages() {
  const now = dayjs();

  // Définir la plage de dates pour cette semaine
  const dateQuery = {
    scheduledDate: {
      $gte: now.startOf("week").toDate(),
      $lte: now.endOf("week").toDate(),
    }
  };

  // Récupérer les tests complétés cette semaine
  const tests = await Test.find({
    status: "completed",
    ...dateQuery,
  }).select("title technology averageScore averageSuccessRate");

  return tests;
}
 /**
   * Calcule les statistiques d'un test (moyenne des scores et taux de réussite)
   * @param {string} testId - ID du test
   * @returns {Promise<Object>} - Objet contenant averageScore et averageSuccessRate
   */
  async calculateTestStatistics(testId) {
    const test = await Test.findById(testId);
    if (!test) {
      throw new Error("Test non trouvé");
    }

    let totalScores = 0;
    let totalSuccessRates = 0;
    let validParticipations = 0;

    test.participations.forEach(participation => {
      if (participation.totalScore !== null && participation.successRate !== null) {
        totalScores += participation.totalScore;
        totalSuccessRates += participation.successRate;
        validParticipations++;
      }
    });

    let averages = {
      averageScore: null,
      averageSuccessRate: null
    };

    if (validParticipations > 0) {
      averages.averageScore = totalScores / validParticipations;
      averages.averageSuccessRate = totalSuccessRates / validParticipations;
      
      // Mettre à jour le test
      test.averageScore = averages.averageScore;
      test.averageSuccessRate = averages.averageSuccessRate;
      await test.save();
    }

    return averages;
  }


}

export default new TestService();
