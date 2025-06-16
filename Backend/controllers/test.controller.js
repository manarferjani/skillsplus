// controllers/test.controller.js
import express from "express";
const router = express.Router();
import TestService from "../services/test.service.js";
import Technologie from "../models/technology.js";
import { auth } from "../middleware/auth.js";
import { sendNotification } from "../services/notification.service.js";
import User from "../models/user.js";

// Ajout d'un test avec vérification complète des champs
router.post("/add", auth, async (req, res) => {
  try {
    const {
      title,
      level,
      technology,
      scheduledDate,
      duration,
      TestMaxScore,
      TestBasicScore = 0, // Valeur par défaut
      TestIntermediateScore = 0, // Valeur par défaut
      TestExpertScore = 0, // Valeur par défaut
      questions,
    } = req.body;

    // 1. Validation des champs requis de base
    const requiredFields = [
      "title",
      "level",
      "technology",
      "scheduledDate",
      "duration",
      "TestMaxScore",
      "TestBasicScore",
      "TestIntermediateScore",
      "TestExpertScore",
    ];
    const missingFields = requiredFields.filter(
      (field) => req.body[field] === undefined || req.body[field] === null
    );

    if (missingFields.length > 0 || !questions?.length) {
      return res.status(400).json({
        message: "Champs obligatoires manquants.",
        missing: [
          ...missingFields,
          ...(!questions?.length ? ["questions"] : []),
        ],
      });
    }

    // 2. Validation des questions
    const invalidQuestions = questions
      .map((question, index) => {
        const errors = [];

        // Validation pour les questions de code
        if (question.type === "code") {
          if (!question.language) {
            errors.push("Le langage est requis pour les questions de code");
          } else if (
            ![
              "javascript",
              "python",
              "java",
              "c",
              "cpp",
              "csharp",
              "php",
              "ruby",
              "go",
              "typescript",
              "dart"
            ].includes(question.language)
          ) {
            errors.push("Langage non supporté");
          }
        }

        // Validation pour les questions à choix unique/multiple
        if (question.type === "single" && !question.correctAnswer) {
          errors.push(
            "Réponse correcte requise pour les questions à choix unique"
          );
        }

        if (
          question.type === "multiple" &&
          (!question.correctAnswers || question.correctAnswers.length === 0)
        ) {
          errors.push(
            "Réponses correctes requises pour les questions à choix multiple"
          );
        }

        return errors.length > 0 ? { questionIndex: index, errors } : null;
      })
      .filter(Boolean);

    if (invalidQuestions.length > 0) {
      return res.status(400).json({
        message: "Validation des questions échouée",
        invalidQuestions,
      });
    }

    // 3. Recherche de la technologie
    const technologie = await Technologie.findOne({
      name: new RegExp(`^${technology}$`, "i"),
    });

    if (!technologie) {
      return res.status(400).json({
        message: `Technologie "${technology}" non trouvée.`,
        suggestions: await Technologie.find().distinct("name"),
      });
    }

    // 4. Préparation des données avec valeurs par défaut
    const testData = {
      title,
      level,
      technology: technologie._id,
      scheduledDate: new Date(scheduledDate),
      duration: Number(duration),
      TestMaxScore: Number(TestMaxScore),
      TestBasicScore: Number(TestBasicScore),
      TestIntermediateScore: Number(TestIntermediateScore),
      TestExpertScore: Number(TestExpertScore),
      createdBy: req.userId,
      questions: questions.map((q) => ({
        ...q,
        // Assurer que les questions de code ont un langage valide
        language: q.type === "code" ? q.language || "javascript" : undefined,
        // Normaliser les points
        points: Number(q.points) || 1,
      })),
      status: "scheduled",
      published: false,
    };

    // 5. Création du test
    const newTest = await TestService.addTest(testData);

    // 6. Notifier les utilisateurs concernés
    const collaborateurs = await User.find({
      role: "collaborator",
      level: testData.level,
    });
    console.log("👥 Collaborateurs trouvés :", collaborateurs.length);

    if (collaborateurs.length > 0) {
      for (const user of collaborateurs) {
        //console.log("📨 Envoi de notification pour", user._id);
        await sendNotification({
          userId: user._id,
          message: `🔔 Un nouveau test "${
            testData.title
          }" vous a été assigné pour le ${new Date(
            testData.scheduledDate
          ).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "2-digit",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}.`,
          type: "test_assigned",
          link: `/calendar`, // ou un lien utile
          save: true, // facultatif, par défaut true
        });
      }
    }

    res.status(201).json({
      success: true,
      test: newTest,
      message: "Test créé avec succès",
    });
  } catch (error) {
    console.error("Erreur détaillée:", error);

    // Gestion spécifique des erreurs de validation Mongoose
    if (error.name === "ValidationError") {
      const errors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});

      return res.status(400).json({
        success: false,
        message: "Erreur de validation",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});



// Récupère tous les tests
router.get("/getallTests", async (req, res) => {
  try {
    const tests = await TestService.getAllTests();

    // Si aucun test n'est trouvé, retourner une réponse 404
    if (!tests || tests.length === 0) {
      return res.status(404).json({ message: "Aucun test trouvé" });
    }

    res.status(200).json(tests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route pour récupérer tous les tests avec formatage des données
// backend/services/testServices.js ou où tu as défini ce endpoint

/*router.get('/api/getFormattedTests', async (req, res) => {
  try {
    const tests = await Test.find()
      .populate('technology', 'nom') // juste le champ "nom" de la technologie
      .populate('participations.user'); // juste le "nom" du collaborateur

    const formattedTests = tests.map(test => ({
      title: test.title,
      technologie: test.technology.nom,
      duration: test.duration,
      scheduledDate: test.scheduledDate,
      averageScore: test.averageScore,
      averageSuccessRate: test.averageSuccessRate,
      participations: test.participations.map(p => ({
        collaborateurNom: p.user?.nom || 'Inconnu',
        collaborateurEmail: p.user?.email ,
        totalScore: p.TotalScore,
        successRate: p.successRate,
        timeSpent: p.timeSpent
        
        
      }))
    }));

    res.json(formattedTests);
  } catch (error) {
    console.error('Erreur récupération des tests formatés:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});*/

router.get("/getFormattedTests", async (req, res) => {
  try {
    console.log("Début de la récupération des tests formatés");

    // Récupération de l'ID utilisateur (optionnel) depuis la query string
    const userId = req.query.userId || null;

    // Appel du service avec ou sans userId
    const formattedTests = await TestService.getFormattedTests(userId);

    res.json({
      success: true,
      count: formattedTests.length,
      data: formattedTests,
    });
  } catch (error) {
    console.error("Erreur détaillée:", error);
    console.error("Erreur détaillée:", error); // Log complet de l'erreur
    res.status(500).json({
      success: false,
      message:
        error.message || "Erreur lors de la récupération des tests formatés",
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

/**
 * GET /api/tests/:id/questions
 * Récupère un test avec ses questions formatées (sans explication)
 * Retourne les questions avec id, label et isCorrect
 */
router.get("/:id/questions", async (req, res) => {
  try {
    // Récupère l'ID du test depuis l'URL
    const { id: testId } = req.params;

    // Appel à la méthode du service
    const quizData = await TestService.getTestByIdFormatted(testId);

    // Réponse réussie
    res.status(200).json({
      success: true,
      data: quizData,
    });
  } catch (error) {
    console.error(
      "Erreur dans la route /api/tests/:id/questions:",
      error.message
    );
    res.status(500).json({
      success: false,
      message:
        error.message || "Erreur serveur lors de la récupération du test",
    });
  }
});

// Récupère un test par son ID
router.get("/getTestById/:id", async (req, res) => {
  try {
    const test = await TestService.getTestById(req.params.id);

    // Vérification : si le test n'est pas trouvé, retourner 404
    if (!test) {
      return res.status(404).json({ message: "Test non trouvé" });
    }

    res.status(200).json(test);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Met à jour un test par son ID
router.put("/update/:id", async (req, res) => {
  try {
    // Vérifier que le corps de la requête n'est pas vide
    if (!req.body || Object.keys(req.body).length === 0) {
      return res
        .status(400)
        .json({ message: "Aucune donnée fournie pour la mise à jour" });
    }

    const updatedTest = await TestService.updateTest(req.params.id, req.body);

    // Si aucun test n'est trouvé pour la mise à jour, retourner 404
    if (!updatedTest) {
      return res
        .status(404)
        .json({ message: "Test non trouvé pour mise à jour" });
    }

    res.status(200).json(updatedTest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprime un test par son ID
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedTest = await TestService.deleteTest(req.params.id);

    // Vérifier si un test a bien été supprimé
    if (!deletedTest) {
      return res
        .status(404)
        .json({ message: "Test non trouvé pour suppression" });
    }

    res.status(200).json({ message: "Test supprimé avec succès", deletedTest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/*router.post('/CalculerResultat', async (req, res) => {
  try {
    const { submissionId } = req.body; // On reçoit maintenant l'ID de la soumission
    const result = await testService.CalculerResultatTest(submissionId);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});*/

/**
 * GET /calendar
 * Renvoie la liste des tests avec l'indicateur "joinable" pour l'affichage dans le calendrier.
 */
router.get("/getCalendarTests", async (req, res) => {
  try {
    const tests = await TestService.getTestsForCalendar();
    res.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /tests/:id/join
 * Permet au collaborateur de rejoindre un test lorsqu'il clique sur le bouton "Join".
 * On suppose que l'ID du collaborateur est disponible dans le corps de la requête (req.body.collaboratorId)
 * ou via un middleware d'authentification.
 */
router.post("/startTest/:id/join", async (req, res) => {
  try {
    const testId = req.params.id;
    // Récupération de l'ID du collaborateur
    // Dans un contexte réel, cela pourrait provenir d'un token JWT ou du middleware d'authentification.
    const collaboratorId = req.body.collaboratorId;

    // Appel à la méthode de démarrage du test
    const participation = await TestService.demarrerTest(
      testId,
      collaboratorId
    );

    // Renvoi de l'objet participation en indiquant que l'utilisateur peut être redirigé vers la page du test.
    res.json({
      success: true,
      message: "Participation enregistrée. Redirection vers la page du test...",
      data: participation,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch("/updateScore", async (req, res) => {
  try {
    const { testId, collaboratorId, totalScore, successRate } = req.body;

    if (
      !testId ||
      !collaboratorId ||
      totalScore === undefined ||
      successRate === undefined
    ) {
      return res.status(400).json({
        message:
          "Champs requis manquants (testId, collaboratorId, score, successRate)",
      });
    }
    console.log("testId:", testId, "collaboratorId:", collaboratorId); // Debugging

    const result = await TestService.updateScore(
      testId,
      collaboratorId,
      totalScore,
      successRate
    );
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/history/:collaboratorId", async (req, res) => {
  console.log("Paramètre collaborateur:", req.params.collaboratorId); // Log de l'ID
  try {
    const history = await TestService.getUserTestHistory(
      req.params.collaboratorId
    );
    res.json(history);
  } catch (error) {
    console.error(
      "Erreur dans la récupération de l'historique:",
      error.message
    );
    res.status(500).json({ message: error.message });
  }
});

// Route pour récupérer les moyennes des tests selon un filtre de date
router.get("/averages", async (req, res) => {
  try {
    const tests = await TestService.getWeeklyTestAverages();
    res.json(tests);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des moyennes de tests :",
      error
    );
    res.status(500).json({
      message: "Erreur serveur lors de la récupération des moyennes de tests.",
    });
    console.error("Erreur lors de la récupération des moyennes de tests :", error);
    res.status(500).json({ message: "Erreur serveur lors de la récupération des moyennes de tests." });
  }
});

/**
 * POST /tests/:id/calculate-statistics
 * Calcule les statistiques d'un test (moyenne des scores et taux de réussite)
 */
router.post('/:id/calculate-statistics', async (req, res) => {
  try {
    const testId = req.params.id;
    const statistics = await TestService.calculateTestStatistics(testId);
    
    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    console.error("Erreur lors du calcul des statistiques:", error);
    res.status(500).json({
      success: false,
      message:
        error.message || "Erreur lors du calcul des statistiques du test",
    });
  }
});

export default router;
