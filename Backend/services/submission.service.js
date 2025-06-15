import Submission from "../models/submission.js";
import Test from "../models/test.js";
import mongoose from "mongoose";
import { Collaborator, getCollaboratorById } from "../models/collaborator.js";
import { evaluateCodeDirect } from "./evaluate.service.js"; // par exemple
import User from "../models/user.js";

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
  console.log("addNewAnswer - answer received:", answer);
  console.log("Answer response value:", answer.response);

  // Input validation
  if (!answer || !answer.questionId) {
    throw new Error("The answer must contain a 'questionId' field");
  }
  if (!mongoose.Types.ObjectId.isValid(testId)) {
    throw new Error("Invalid test ID");
  }
  if (!mongoose.Types.ObjectId.isValid(collaboratorId)) {
    throw new Error("Invalid collaborator ID");
  }

  console.log("Response sent to backend:", answer);

  let questionText = "Not available";
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const test = await Test.findById(testId).session(session);
    if (!test) throw new Error("Test not found");

    // Find or create submission
    let submission = await Submission.findOne({
      test: testId,
      collaborator: collaboratorId,
    }).session(session);

    if (!submission) {
      submission = new Submission({
        test: testId,
        collaborator: collaboratorId,
        responses: [],
        startTime: new Date(),
        timeSpent: 0,
        endTime: null,
        totalScore: 0,
        successRate: 0,
        basicScore: 0,
        intermediateScore: 0,
        expertScore: 0,
      });
    }

    // Check if question already answered
    const alreadyAnswered = submission.responses.some(
      (r) => r.questionId?.toString() === answer.questionId
    );
    if (alreadyAnswered) {
      throw new Error("This question has already been answered");
    }

    // Find the question
    const question = test.questions.find(
      (q) => q._id.toString() === answer.questionId
    );
    if (!question) throw new Error("Question not found");

    questionText = question.questionText;
    let isCorrect = false;
    let scoreToAdd = 0;
    let evaluationFeedback = null;

    console.log("Question type:", question.type);

    // Process answer based on question type
    if (question.type === "code") {
      console.log("Code answer content:", answer);
      console.log("Type de answer.response:", typeof answer.response);
      console.log("Contenu answer.response:", answer.response);

      if (!question.language) {
        throw new Error(
          `Code question "${question.questionText}" has no specified language`
        );
      }

      if (!answer.response || typeof answer.response !== "string") {
        throw new Error(
          `Invalid answer for question "${question.questionText}" - code expected`
        );
      }

      try {
        const evaluation = await evaluateCodeDirect({
          code: answer.response,
          language: question.language,
          points: question.points,
          questionText: question.questionText,
        });

        isCorrect = evaluation.isCorrect;
        evaluationFeedback = evaluation.feedback;
        scoreToAdd = evaluation.score;
      } catch (err) {
        console.error(
          `Code evaluation failed for question ${question.questionText}:`,
          err
        );
        throw new Error(`Code evaluation failed: ${err.message || err}`);
      }
    } else {
      // Process non-code questions
      switch (question.type) {
        case "single":
          isCorrect = answer.response === question.correctAnswer;
          break;
        case "multiple":
          isCorrect =
            JSON.stringify([...(answer.response || [])].sort()) ===
            JSON.stringify([...(question.correctAnswers || [])].sort());
          break;
      }
      scoreToAdd = isCorrect ? question.points : 0;
    }

    // Update scores
    submission.totalScore += scoreToAdd;

    switch (question.level) {
      case "basic":
        submission.basicScore += scoreToAdd;
        break;
      case "intermediate":
        submission.intermediateScore += scoreToAdd;
        break;
      case "expert":
        submission.expertScore += scoreToAdd;
        break;
    }

    // Add response
    submission.responses.push({
      questionId: question._id,
      questionType: question.type,
      response: answer.response,
      isCorrect,
      feedback: evaluationFeedback,
      score: scoreToAdd,
      questionText,
    });

    // Calculate success rate
    const totalAvailablePoints = test.questions.reduce(
      (sum, q) => sum + q.points,
      0
    );
    submission.successRate =
      totalAvailablePoints > 0
        ? Math.min(
            Math.round((submission.totalScore / totalAvailablePoints) * 100),
            100
          )
        : 0;

    // Update test participations
    test.participations = test.participations || [];
    const existingParticipation = test.participations.find(
      (p) => p.user && p.user.toString() === collaboratorId
    );

    if (existingParticipation) {
      existingParticipation.totalScore = submission.totalScore;
      existingParticipation.successRate = submission.successRate;
    } else {
      test.participations.push({
        user: collaboratorId,
        totalScore: submission.totalScore,
        successRate: submission.successRate,
        startTime: new Date(),
        endTime: null,
        timeSpent: null,
      });
    }

    // Check if test is complete

    const isAllQuestionsAnswered =
      submission.responses.length === test.questions.length;

    //let estimatedLevel = null;

    if (isAllQuestionsAnswered && submission.startTime) {
      const now = new Date();
      submission.endTime = now;
      submission.timeSpent = Math.floor((now - submission.startTime) / 1000);

      if (existingParticipation) {
        existingParticipation.endTime = now;
        existingParticipation.timeSpent = submission.timeSpent;
      }

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

      submission.basicRate = performance.basic;
      submission.intermediateRate = performance.intermediate;
      submission.expertRate = performance.expert;

      // Évaluer si les niveaux sont "complets" (score parfait)
      const basicComplete =
        submission.basicScore === totalBasicPoints && totalBasicPoints > 0;
      const intermediateComplete =
        submission.intermediateScore === totalIntermediatePoints &&
        totalIntermediatePoints > 0;
      const expertComplete =
        submission.expertScore === totalExpertPoints && totalExpertPoints > 0;

      // Attribution du badge
      let badge = null;

      if (basicComplete && intermediateComplete && expertComplete) {
        badge = "platinum";
      } else if (
        (basicComplete && expertComplete) ||
        (intermediateComplete && expertComplete)
      ) {
        badge = "gold";
      } else if (
        (basicComplete && intermediateComplete) ||
        (expertComplete && !basicComplete && !intermediateComplete)
      ) {
        badge = "silver";
      } else if (
        (basicComplete && !intermediateComplete && !expertComplete) ||
        (intermediateComplete && !basicComplete && !expertComplete)
      ) {
        badge = "bronze";
      } else {
        badge = null;
      }

      submission.awardedBadge = badge;

      // Update test averages
      const totalParticipants = test.participations.length;
      const totalScoreSum = test.participations.reduce(
        (sum, p) => sum + (typeof p.totalScore === "number" ? p.totalScore : 0),
        0
      );
      const totalSuccessRateSum = test.participations.reduce(
        (sum, p) =>
          sum + (typeof p.successRate === "number" ? p.successRate : 0),
        0
      );

      test.averageScore =
        totalParticipants > 0
          ? Math.round(totalScoreSum / totalParticipants)
          : null;
      test.averageSuccessRate =
        totalParticipants > 0
          ? Math.round(totalSuccessRateSum / totalParticipants)
          : null;
    }

    // Update collaborator data
    console.log("Searching for collaborator with ID:", collaboratorId);
    const collaborator = await Collaborator.findById(collaboratorId).session(
      session
    );
    console.log("Found collaborator:", collaborator);
    if (!collaborator) throw new Error("Collaborator not found");

    // Initialize arrays if they don't exist
    collaborator.testsTaken = collaborator.testsTaken || [];
    collaborator.technology_success_rate =
      collaborator.technology_success_rate || [];

    // Add test to collaborator's history
    collaborator.testsTaken.push({
      testId: test._id,
      score: submission.totalScore,
      successRate: submission.successRate,
      takenAt: new Date(),
    });

    // Update technology success rate
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
        technologyId: test.technology, // Assuming test.technology is an ObjectId
        history: [{ successRate: submission.successRate, date: new Date() }],
      });
    }

    // Check for performer status
    let successRateBefore = 0;
    const techEntry = collaborator.technology_success_rate.find((e) =>
      e.technologyId.equals(test.technology)
    );
    if (techEntry && techEntry.history.length > 1) {
      successRateBefore =
        techEntry.history[techEntry.history.length - 2].successRate;
    }

    const improvement = submission.successRate - successRateBefore;
    const participationsForTest = collaborator.testsTaken.filter(
      (t) => t.testId.toString() === test._id.toString()
    );
    const hasTakenTestBefore = participationsForTest.length >= 2;
    const hasSignificantImprovement = improvement >= 20;

    if (hasTakenTestBefore && hasSignificantImprovement) {
      collaborator.isPerformerOfTheWeek = true;
      collaborator.performerOfTheWeek = {
        technologyId: test.technology,
        successRateBefore,
        improvement: improvement.toFixed(2),
        successRateAfter: submission.successRate,
        date: new Date(),
      };
      collaborator.markModified("performerOfTheWeek");
    }

    // Save all changes
    await collaborator.save({ session });
    await submission.save({ session });
    await test.save({ session });
    await session.commitTransaction();

    // Clear expired performers
    await clearExpiredPerformers();

    return {
      totalScore: submission.totalScore,
      successRate: submission.successRate,
      basicScore: submission.basicScore,
      intermediateScore: submission.intermediateScore,
      expertScore: submission.expertScore,
      //estimatedLevel: submission.estimatedLevel,
      feedback: evaluationFeedback,
    };
  } catch (err) {
    await session.abortTransaction();
    console.error("[addNewAnswer] ERROR:", {
      message: err.message,
      stack: err.stack,
      testId,
      collaboratorId,
      questionText,
    });
    throw new Error(`Error saving answer: ${err.message}`);
  } finally {
    session.endSession();
  }
}

export default { addNewAnswer };

/**
 * Récupère une soumission (Submission) par collaborateur et test.
 * @param {string} collaboratorId - Identifiant du collaborateur.
 * @param {string} testId - Identifiant du test.
 * @returns {Promise<Object|null>} - La soumission trouvée ou null si aucune.
 */
export async function getSubmissionByCollaboratorAndTest(
  testId,
  collaboratorEmail
) {
  console.log("Début getSubmissionByCollaboratorAndTest");
  console.log("Paramètres reçus:", { testId, collaboratorEmail });
  try {
    // Trouver le collaborateur par son email
    const collaborator = await User.findOne({ email: collaboratorEmail });
    if (!collaborator) {
      throw new Error("Collaborateur non trouvé avec cet email");
    }

    // Chercher la soumission par testId et collaborateur._id
    const submission = await Submission.findOne({
      test: testId,
      collaborator: collaborator._id,
    }).populate("test collaborator"); // adapte si besoin les champs à populate

    return submission;
  } catch (error) {
    console.error("Erreur dans getSubmissionByCollaboratorAndTest:", error);
    throw error;
  }
}
