import express from 'express';
const router = express.Router();
import CollaboratorService from '../services/collaborator.service.js';

// Route pour récupérer les résultats du collaborateur pour un test spécifique

router.get('/results/:testId/:collaboratorId', async (req, res) => {
  try {
    const { testId, collaboratorId } = req.params;

    const results = await CollaboratorService.getCollaboratorResults(testId, collaboratorId);
    res.json(results);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});
router.get('/timeSpent/:testId/:collaboratorId', async (req, res) => {
  try {
    const { testId, collaboratorId } = req.params;

    const results = await CollaboratorService.getTimeSpent(testId, collaboratorId);
    res.json(results);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }

});
export default router;
