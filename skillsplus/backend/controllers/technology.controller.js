// controllers/technology.controller.js
import express from "express";
const router = express.Router();
import TechnologyService from "../services/technology.service.js";
import mongoose from 'mongoose';


// Ajout d'une nouvelle technologie avec vérification du champ requis 'name'
router.post("/add", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ message: "Le champ 'name' est requis" });
    }
    const newTechnology = await TechnologyService.addTechnology(req.body);
    res.status(201).json(newTechnology);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Ajoute un test à une technologie existante
router.put("/addTestToTechnology/:technologyId/:testId", async (req, res) => {
  try {
    const { technologyId, testId } = req.params;

    const updatedTechnology = await TechnologyService.addTestToTechnology(
      technologyId,
      testId
    );

    if (!updatedTechnology) {
      return res.status(404).json({ message: "Technologie non trouvée" });
    }

    res.status(200).json({
      message: "Test ajouté avec succès à la technologie",
      updatedTechnology,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupère toutes les technologies
router.get("/getall", async (req, res) => {
  try {
    const technologies = await TechnologyService.getAllTechnologies();
    if (!technologies || technologies.length === 0) {
      return res.status(404).json({ message: "Aucune technologie trouvée" });
    }
    res.status(200).json(technologies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupère toutes les technologies filtrées par id et name

router.get("/getFilteredTech", async (req, res) => {
  try {
    const technologies = await TechnologyService.getAllTechnologiesFiltered();
    if (!technologies || technologies.length === 0) {
      return res.status(404).json({ message: "Aucune technologie trouvée" });
    }
    // Retourner uniquement les noms
    const techNames = technologies.map((tech) => tech.name);
    res.status(200).json(techNames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupère une technologie par son ID
router.get("/getTechnologyById/:id", async (req, res) => {
  try {
    const technology = await TechnologyService.getTechnologyById(req.params.id);
    if (!technology) {
      return res.status(404).json({ message: "Technologie non trouvée" });
    }
    res.status(200).json(technology);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Met à jour une technologie par son ID
router.put("/update/:id", async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée fournie pour la mise à jour" });
    }
    const updatedTechnology = await TechnologyService.updateTechnology(
      req.params.id,
      req.body
    );
    if (!updatedTechnology) {
      return res
        .status(404)
        .json({ message: "Technologie non trouvée pour mise à jour" });
    }
    res.status(200).json(updatedTechnology);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprime une technologie par son ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedTechnology = await TechnologyService.deleteTechnology(
      req.params.id
    );
    if (!deletedTechnology) {
      return res
        .status(404)
        .json({ message: "Technologie non trouvée pour suppression" });
    }
    res
      .status(200)
      .json({
        message: "Technologie supprimée avec succès",
        deletedTechnology,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Récupère toutes les technologies avec seulement _id et name
router.get("/getIdAndNameOnly", async (req, res) => {
  try {
    const technologies =
      await TechnologyService.getAllTechnologiesFilteredByIdAndName();
    if (!technologies || technologies.length === 0) {
      return res.status(404).json({ message: "Aucune technologie trouvée" });
    }
    res.status(200).json(technologies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/basic", async (req, res) => {
  try {
    const technologies = await TechnologyService.getAllTechnologiesBasicInfo();
    res.json(technologies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Dans votre fichier de routes (ex: technology.routes.ts)
router.get("/:id/yearly-averages", async (req, res) => {
  try {
    const technologyId = req.params.id;

    // Validation de l'ID
    if (!technologyId || !mongoose.Types.ObjectId.isValid(technologyId)) {
      return res.status(400).json({
        success: false,
        message: "ID de technologie invalide",
      });
    }

    const averages = await TechnologyService.calculateYearlyAverages(
      technologyId
    );

    // Vérification des résultats
    if (!averages) {
      return res.status(404).json({
        success: false,
        message: "Aucune donnée trouvée pour cette technologie",
      });
    }

    res.json({
      success: true,
      data: averages,
    });
  } catch (error) {
    console.error("Erreur serveur dans yearly-averages:", error);
    res.status(500).json({
      success: false,
      message: "Erreur interne du serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});
export default router;
