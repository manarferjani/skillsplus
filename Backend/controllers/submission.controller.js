import express from "express";
import { getSubmissionByCollaboratorAndTest } from "../services/submission.service.js";
import SubmissionService from "../services/submission.service.js";
import {
  auth,
  isCollaborator,
  isAdmin,
  isManager,
} from "../middleware/auth.js";
import Test from "../models/test.js"; // <-- Importez le modèle Test

const router = express.Router();

router.post("/submission", auth, isCollaborator, async (req, res) => {
  

  
  const { testId, questionId, response } = req.body;
  const collaboratorId = req.userId;
  console.log("Requête reçue :", req.body);

  try {
    // Récupérer le test et la question pour obtenir le texte de la question
    const test = await Test.findById(testId);

    if (!test) {
      return res.status(404).json({ message: "Test introuvable" });
    } 

    const question = test.questions.find(
      (q) => q._id.toString() === questionId
    );

    if (!question) {
      return res
        .status(404)
        .json({ message: "Question introuvable dans ce test" });
    }

    console.log("addNewAnswer - answer envoyé :", {
      questionId,
      questionText: question.questionText,
      response,
      points: question.points || 0,
    });

    // Construire l'objet réponse avec le texte de la question
    const updatedSubmission = await SubmissionService.addNewAnswer(
      testId,
      collaboratorId,
      {
        questionId,
        questionText: question.questionText, // <-- ici
        response,
        points: question.points || 0, // vous pouvez adapter cela si nécessaire
      }
    );

    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la réponse:", error);
    res.status(500).json({ message: error.message });
  }
});

router.get("/getSubmission", async (req, res) => {
  const { testId, collaboratorEmail }= req.query; 
  console.log("Requête reçue avec :", { collaboratorEmail, testId });

  if (!testId || !collaboratorEmail) {
    return res.status(400).json({
      message: "Les paramètres testId et collaboratorEmail sont obligatoires.",
    });
  }

  try {
    const submission = await getSubmissionByCollaboratorAndTest(
      testId,
      collaboratorEmail
    );

    if (!submission) {
      return res.status(404).json({ message: "Soumission non trouvée." });
    }

    res.status(200).json(submission);
  } catch (error) {
    console.error("Erreur serveur lors de la récupération :", error);
    res
      .status(500)
      .json({ message: "Erreur serveur interne", details: error.message });
  }
});

export default router;
