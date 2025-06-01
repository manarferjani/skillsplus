import express from 'express';
import SubmissionService from '../services/submission.service.js'; // Le service pour gérer les réponses
import { auth, isCollaborator } from '../middleware/auth.js'; // Importation des middlewares

const router = express.Router();

// POST /api/submission/submission : Envoie de la réponse d'un collaborateur pour une question d'un test
router.post('/submission', auth, isCollaborator, async (req, res) => {
    const { testId, questionText, response } = req.body;
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('User ID:', req.userId);

    try {
        // Utilisation de req.userId pour obtenir l'ID du collaborateur
        const collaboratorId = req.userId;

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
