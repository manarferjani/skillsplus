// controllers/formation.controller.js
import express from 'express';
const router = express.Router();
import FormationService from '../services/formation.service.js';

// Ajout d'une formation avec vérification des champs obligatoires
router.post('/add', async (req, res) => {
  try {
    const { title, levelRequired, technology } = req.body;
    if (!title || !levelRequired || !technology) {
      return res.status(400).json({
        message: "Les champs 'title', 'levelRequired' et 'technology' sont obligatoires"
      });
    }
    const newFormation = await FormationService.addFormation(req.body);
    res.status(201).json(newFormation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupère toutes les formations
router.get('/getallFormations', async (req, res) => {
  try {
    const formations = await FormationService.getAllFormations();
    if (!formations || formations.length === 0) {
      return res.status(404).json({ message: "Aucune formation trouvée" });
    }
    res.status(200).json(formations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupère une formation par son ID
router.get('/getFormationById/:id', async (req, res) => {
  try {
    const formation = await FormationService.getFormationById(req.params.id);
    if (!formation) {
      return res.status(404).json({ message: "Formation non trouvée" });
    }
    res.status(200).json(formation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Met à jour une formation par son ID
router.put('/update/:id', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Aucune donnée fournie pour la mise à jour" });
    }
    const updatedFormation = await FormationService.updateFormation(req.params.id, req.body);
    if (!updatedFormation) {
      return res.status(404).json({ message: "Formation non trouvée pour mise à jour" });
    }
    res.status(200).json(updatedFormation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprime une formation par son ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedFormation = await FormationService.deleteFormation(req.params.id);
    if (!deletedFormation) {
      return res.status(404).json({ message: "Formation non trouvée pour suppression" });
    }
    res.status(200).json({ message: "Formation supprimée avec succès", deletedFormation });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
