import express from "express";
const router = express.Router();
import CollaboratorService from "../services/collaborator.service.js";
import authenticate from "./authenticator.js";
import { auth, isAdmin } from "../middleware/auth.js";
import Collaborator from "../models/collaborator.js";

// Route pour récupérer les résultats du collaborateur pour un test spécifique

router.get(
  "/results/:testId/:collaboratorId",
  authenticate(["admin", "collaborator"]),
  async (req, res) => {
    try {
      const id = req.user.id;
      const { testId, collaboratorId } = req.params;

      const results = await CollaboratorService.getCollaboratorResults(
        testId,
        collaboratorId
      );
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);
router.get("/timeSpent/:testId/:collaboratorId", async (req, res) => {
  try {
    const { testId, collaboratorId } = req.params;

    const results = await CollaboratorService.getTimeSpent(
      testId,
      collaboratorId
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer les performeurs
router.get("/performers", auth, isAdmin, async (req, res) => {
  try {
    const { filter, limit, sortBy } = req.query;
    const performers = await CollaboratorService.getPerformers({
      filter,
      limit,
      sortBy,
    });
    res.json(performers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:collaboratorId/technology/:technologyId/success-history",
  async (req, res) => {
    console.log("Route hit: Success History"); 
    const { collaboratorId, technologyId } = req.params;

    

    try {
      const history = await CollaboratorService.getSuccessRateHistory(
        collaboratorId,
        technologyId
      );
      res.json(history);
    } catch (error) {
      console.error(error.message);
      res.status(404).json({ message: error.message });
    }
  }
);

// GET /api/collaborators/basic
router.get("/basic", async (req, res) => {
  try {
    const collaborators =await CollaboratorService.getAllCollaboratorsBasicInfo();
    res.json(collaborators);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
