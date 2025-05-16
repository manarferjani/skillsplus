import Submission from "../models/submission.js";
import Test from "../models/test.js";
import mongoose from "mongoose";
import Collaborator from "../models/collaborator.js";

// Fonction pour réinitialiser les performers dont la performance date de plus de 7 jours
async function clearExpiredPerformers() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await Collaborator.updateMany(
    {
      isPerformerOfTheWeek: true,
      "performerOfTheWeek.date": { $lt: sevenDaysAgo },
    },
    {
      $set: { isPerformerOfTheWeek: false },
      $unset: { performerOfTheWeek: "" },
    }
  );
}

// Fonction principale pour ajouter une réponse à une soumission
async function addNewAnswer(testId, collaboratorId, answer) {
  console.log(
    "[addNewAnswer] Début - TestID:",
    testId,
    "CollaboratorID:",
    collaboratorId
  );

  if (!answer || !answer.questionText) {
    throw new Error("La réponse doit contenir un champ 'questionText'");
  }

  try {
    const test = await Test.findById(testId);
    if (!test) throw new Error("Test non trouvé");

    let submission = await Submission.findOne({
      test: testId,
      collaborator: collaboratorId,
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
        expertScore: 0,
      });
    }

    const alreadyAnswered = submission.responses.some(
      (r) => r.questionText === answer.questionText
    );
    if (alreadyAnswered) {
      throw new Error("Cette question a déjà été répondue");
    }

    const question = test.questions.find(
      (q) => q.questionText === answer.questionText
    );
    if (!question) throw new Error("Question introuvable");

    let isCorrect = false;
    switch (question.type) {
      case "single":
        isCorrect = answer.response === question.correctAnswer;
        break;
      case "multiple":
        isCorrect =
          JSON.stringify([...answer.response].sort()) ===
          JSON.stringify([...question.correctAnswers].sort());
        break;
      case "code":
        isCorrect = false;
        break;
    }

    if (isCorrect) {
      submission.totalScore += question.points;
      switch (question.level) {
        case "basic":
          submission.basicScore += question.points;
          break;
        case "intermediate":
          submission.intermediateScore += question.points;
          break;
        case "expert":
          submission.expertScore += question.points;
          break;
      }
    }

    submission.responses.push({
      questionText: answer.questionText,
      response: answer.response,
      isCorrect,
    });

    submission.successRate = Math.round(
      (submission.responses.filter((r) => r.isCorrect).length /
        test.questions.length) *
        100
    );

    // Assurez-vous que test.participations existe et est un tableau
    test.participations = test.participations || [];

    // Vérifier si une participation existe déjà pour ce collaborateur
    const existingParticipation = test.participations.find(
      (p) => p.user && p.user.toString() === collaboratorId
    );

    if (existingParticipation) {
      // Si la participation existe, mettez à jour les scores et autres détails
      existingParticipation.totalScore = submission.totalScore;
      existingParticipation.successRate = submission.successRate;
    } else {
      // Sinon, ajoutez une nouvelle participation
      test.participations.push({
        user: collaboratorId,
        totalScore: submission.totalScore,
        successRate: submission.successRate,
        startTime: new Date(),
        endTime: null,
        timeSpent: null,
      });
    }

    const now = new Date();
    const elapsedTime = Math.round((now - submission.startTime) / 1000);
    const isAllQuestionsAnswered =
      submission.responses.length === test.questions.length;
    const isTimeExceeded = test.duration && elapsedTime >= test.duration;

    let estimatedLevel = null;

    if (isAllQuestionsAnswered || isTimeExceeded) {
      submission.endTime = now;
      submission.timeSpent = elapsedTime;

      if (existingParticipation) {
        existingParticipation.endTime = now;
        existingParticipation.timeSpent = elapsedTime;
      }

      // Déduction du niveau estimé
      const totalBasicPoints = test.questions
        .filter((q) => q.level === "basic")
        .reduce((sum, q) => sum + q.points, 0);

      const totalIntermediatePoints = test.questions
        .filter((q) => q.level === "intermediate")
        .reduce((sum, q) => sum + q.points, 0);

      const totalExpertPoints = test.questions
        .filter((q) => q.level === "expert")
        .reduce((sum, q) => sum + q.points, 0);

      const performance = {
        basic:
          totalBasicPoints > 0
            ? Math.round((submission.basicScore / totalBasicPoints) * 100)
            : 0,
        intermediate:
          totalIntermediatePoints > 0
            ? Math.round(
                (submission.intermediateScore / totalIntermediatePoints) * 100
              )
            : 0,
        expert:
          totalExpertPoints > 0
            ? Math.round((submission.expertScore / totalExpertPoints) * 100)
            : 0,
      };

      if (performance.expert >= 70) {
        estimatedLevel = "expert";
      } else if (performance.intermediate >= 70) {
        estimatedLevel = "intermediate";
      } else if (performance.basic >= 70) {
        estimatedLevel = "basic";
      } else {
        estimatedLevel = "beginner";
      }

      submission.estimatedLevel = estimatedLevel;

      // ✅ Recalcul de la moyenne après la soumission
      const totalParticipants = test.participations.length;

      const totalScoreSum = test.participations.reduce((sum, p) => {
        return sum + (typeof p.totalScore === "number" ? p.totalScore : 0);
      }, 0);

      const totalSuccessRateSum = test.participations.reduce((sum, p) => {
        return sum + (typeof p.successRate === "number" ? p.successRate : 0);
      }, 0);

      test.averageScore =
        totalParticipants > 0
          ? Math.round(totalScoreSum / totalParticipants)
          : null;
      test.averageSuccessRate =
        totalParticipants > 0
          ? Math.round(totalSuccessRateSum / totalParticipants)
          : null;

      // ✅ Mise à jour du collaborateur + performer
      const collaborator = await Collaborator.findById(collaboratorId);
      if (!collaborator) throw new Error("Collaborateur non trouvé");

      collaborator.testsTaken = collaborator.testsTaken || [];
      collaborator.testsTaken.push({
        testId: test._id,
        score: submission.totalScore,
        successRate: submission.successRate,
        takenAt: new Date(),
      });

      const techIndex = collaborator.technology_success_rate.findIndex((e) =>
        e.technologyId.equals(test.technology)
      );

      if (techIndex >= 0) {
        collaborator.technology_success_rate[techIndex].history.push({
          successRate: submission.successRate,
          date: new Date(),
        });
      } else {
        collaborator.technology_success_rate.push({
          technologyId: new mongoose.Types.ObjectId(
            test.technology._id || test.technology
          ),
          history: [{ successRate: submission.successRate, date: new Date() }],
        });
      }

      let successRateBefore = 0;
      const techEntry = collaborator.technology_success_rate.find((e) =>
        e.technologyId.equals(test.technology)
      );
      if (techEntry && techEntry.history.length > 1) {
        successRateBefore =
          techEntry.history[techEntry.history.length - 2].successRate;
      } else {
        successRateBefore = 0;
      }

      const improvement = submission.successRate - successRateBefore;

      // Condition : test passé au moins deux fois + amélioration ≥ 15%
      const participationsForTest = collaborator.testsTaken.filter(
        (t) => t.testId.toString() === test._id.toString()
      );

      const hasTakenTestBefore = participationsForTest.length >= 2;
      const hasSignificantImprovement = improvement >= 15;

      if (hasTakenTestBefore && hasSignificantImprovement) {
        collaborator.isPerformerOfTheWeek = true;
        collaborator.performerOfTheWeek = {
          technologyId: new mongoose.Types.ObjectId(
            test.technology._id || test.technology
          ),
          successRateBefore,
          successRateAfter: submission.successRate,
          date: new Date(),
        };

        collaborator.markModified("performerOfTheWeek");
      }

      collaborator.markModified("testsTaken");
      collaborator.markModified("technology_success_rate");

      await collaborator.save({ validateBeforeSave: true });
    }

      await submission.save();
      await test.save();
      await clearExpiredPerformers();

      return {
        totalScore: submission.totalScore,
        successRate: submission.successRate,
        basicScore: submission.basicScore,
        intermediateScore: submission.intermediateScore,
        expertScore: submission.expertScore,
        estimatedLevel: submission.estimatedLevel,
      };
    
  } catch (err) {
    console.error("[addNewAnswer] ERREUR:", {
      message: err.message,
      stack: err.stack,
      testId,
      collaboratorId,
    });
    throw new Error(`Erreur lors de la sauvegarde: ${err.message}`);
  }
}

export default { addNewAnswer };
