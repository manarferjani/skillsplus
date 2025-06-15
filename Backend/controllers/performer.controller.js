import express from 'express';
const router = express.Router();
import PerformerService from '../services/performer.service.js';
import GlobalStats from '../models/globalStats.js';
import { auth } from "../middleware/auth.js";

// Met à jour les performers of the week
router.post('/updatePerformersOfTheWeek', async (req, res) => {
  try {
    await PerformerService.updatePerformersOfTheWeek();
    res.status(200).json({ message: 'Performers of the week mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des performers:', error);
    res.status(500).json({ message: "Erreur serveur lors de la mise à jour des performers.", error: error.message });
  }
});

// Récupère les performers of the week actuels
router.get('/getPerformersOfTheWeek', async (req, res) => {
  

  try {
    const result = await GlobalStats.findOne({ type: 'performerOfWeek' });

    if (!result || !result.value || result.value.length === 0) {
      return res.status(404).json({ message: "Aucun performer of the week trouvé." });
    }

    res.status(200).json(result.value);
  } catch (error) {
    console.error('Erreur lors de la récupération des performers:', error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des performers.", error: error.message });
  }
});



export default router;