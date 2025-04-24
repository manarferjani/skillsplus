import express from 'express';
const router = express.Router();
import SubmissionService from '../services/submission.service.js'; // Le service pour gérer les réponses

// POST /api/submission : Envoie de la réponse d'un collaborateur pour une question d'un test
router.post('/submission', async (req, res) => {
  const { testId, collaboratorId, questionText, response   } = req.body;

  try {
    // Appel du service pour ajouter la réponse ou la mettre à jour
    const updatedSubmission = await SubmissionService.addNewAnswer(testId, collaboratorId, {
      questionText,
      response,
      
    });
    
    // Réponse à envoyer au frontend avec le document mis à jour
    res.status(200).json(updatedSubmission);
  } catch (error) {
    console.error("Erreur lors de l'ajout de la réponse:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;