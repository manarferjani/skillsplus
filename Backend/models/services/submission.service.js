import Submission from '../models/submission.js';  // Import par défaut
import Test from '../models/test.js';
import mongoose from 'mongoose';
import User from '../models/user.js';

async function addNewAnswer(testId, collaboratorId, answer) {
  if (!answer || !answer.questionText) {
    throw new Error("La réponse doit contenir un champ 'questionText'");
  }

  try {
    // 1. Récupération du test
    const test = await Test.findById(testId);
    if (!test) throw new Error("Test non trouvé");

    // 2. Recherche de la soumission
    let submission = await Submission.findOne({
      test: testId,
      collaborator: collaboratorId
    });

    if (!submission) {
      submission = new Submission({
        test: testId,
        collaborator: collaboratorId,
        responses: [],
        startTime: new Date(),
        timeSpent: null,
        endTime: null,
        totalScore: 0,
        successRate: 0,
        basicScore: 0,
        intermediateScore: 0,
        expertScore: 0
      });
    }
    // Vérification : a-t-on déjà répondu à cette question ?
    const alreadyAnswered = submission.responses.some(
      r => r.questionText === answer.questionText
    );

    if (alreadyAnswered) {
      throw new Error("Cette question a déjà été répondue. Une seule réponse est autorisée.");
    }


    // 3. Traitement de la réponse
    const question = test.questions.find(q => q.questionText === answer.questionText);
    if (!question) throw new Error("Question introuvable");

    let isCorrect = false;

    // Correction en fonction du type de question
    switch (question.type) {
      case 'single':
        isCorrect = answer.response === question.correctAnswer;
        break;
      case 'multiple':
        if (!Array.isArray(answer.response) || !Array.isArray(question.correctAnswers)) {
          throw new Error("Les réponses pour les questions multiples doivent être des tableaux");
        }
        const sortedUserResponse = [...answer.response].sort();
        const sortedCorrectAnswers = [...question.correctAnswers].sort();
        isCorrect = JSON.stringify(sortedUserResponse) === JSON.stringify(sortedCorrectAnswers);
        break;
      case 'code':
        // Implémentez ici la logique de correction pour les questions de type 'code'
        // Par exemple, exécuter le code et comparer la sortie attendue
        // Pour l'instant, nous considérons la réponse comme incorrecte par défaut
        isCorrect = false;
        break;
      default:
        throw new Error(`Type de question inconnu: ${question.type}`);
    }

    if (isCorrect) {
      submission.totalScore += question.points;

      // Attribution du score par niveau
      switch (question.level) {
        case 'basic':
          submission.basicScore += question.points;
          break;
        case 'intermediate':
          submission.intermediateScore += question.points;
          break;
        case 'expert':
          submission.expertScore += question.points;
          break;
        default:
          // Niveau non reconnu, aucun score spécifique attribué
          break;
      }
    }

    // 4. Ajout de la réponse dans la soumission
    submission.responses.push({
      questionText: answer.questionText,
      response: answer.response,
      isCorrect
    });

    // 5. Mise à jour du taux de réussite
    const correctAnswers = submission.responses.filter(r => r.isCorrect).length;
    submission.successRate = Math.round((correctAnswers / test.questions.length) * 100);

    // 6. Mise à jour de la participation dans le test
    // Vérification et conversion de l'ID
    if (!mongoose.isValidObjectId(collaboratorId)) {
      throw new Error("ID collaborateur invalide");
    }
    const userId = mongoose.Types.ObjectId.createFromHexString(collaboratorId);

    // Vérification de l'existence du user (méthode optimisée)
    if (!(await User.exists({ _id: userId }))) {
      throw new Error("Collaborateur non trouvé dans la base de données");
    }

    // Gestion des participations (méthode robuste)
    test.participations = test.participations || [];

    const existingParticipation = test.participations.find(p =>
      p.user && p.user.toString() === collaboratorId
    );

    if (existingParticipation) {
      existingParticipation.totalScore = submission.totalScore;
      existingParticipation.successRate = submission.successRate;
    } else {
      test.participations.push({
        user: userId,
        totalScore: submission.totalScore,
        successRate: submission.successRate,
        startTime: new Date(),
        endTime: null,
        timeSpent: null
      });
    }
    // 7. Fin du test : si le nombre de réponses atteint le nombre total de questions
    const now = new Date();
    const elapsedTime = Math.round((now - submission.startTime) / 1000); // secondes écoulées

    const isAllQuestionsAnswered = submission.responses.length === test.questions.length;
    const isTimeExceeded = test.duration && elapsedTime >= test.duration;

    if (isAllQuestionsAnswered || isTimeExceeded) {
      submission.endTime = now;
      submission.timeSpent = elapsedTime;

      if (existingParticipation) {
        existingParticipation.endTime = now;
        existingParticipation.timeSpent = elapsedTime;
      }
    }



    await submission.save();
    await test.save();

    return {
      totalScore: submission.totalScore,
      successRate: submission.successRate,
      basicScore: submission.basicScore,
      intermediateScore: submission.intermediateScore,
      expertScore: submission.expertScore,
      //timeSpent: submission.timeSpent
    };

  } catch (err) {
    console.error("Erreur détaillée lors de la gestion de la soumission:", {
      error: err.message,
      stack: err.stack,
      testId,
      collaboratorId,
      answer
    });
    throw new Error(`Erreur lors de la sauvegarde de la réponse: ${err.message}`);
  }
}

export default { addNewAnswer };
