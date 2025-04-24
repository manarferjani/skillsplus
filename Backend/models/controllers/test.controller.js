// controllers/test.controller.js
import express from 'express';
const router = express.Router();
import TestService from '../services/test.service.js';
import test from '../models/test.js';

// Ajout d'un test avec vérification des champs requis
router.post('/add', async (req, res) => {
  try {
    const { title, level, technology, scheduledDate, duration, createdBy, questions } = req.body;

    if (!title || !level || !technology || !scheduledDate || !duration || !createdBy || !questions?.length) {
      return res.status(400).json({ message: "Champs obligatoires manquants." });
    }

    const newTest = await TestService.addTest(req.body);
    res.status(201).json(newTest);
  } catch (error) {
    res.status(500).json({ error: "Erreur lors de la création du test : " + error.message });
  }
});

// Récupère tous les tests
router.get('/getallTests', async (req, res) => {
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

router.get('/getFormattedTests', async (req, res) => {
  try {
      console.log('Début de la récupération des tests formatés'); // Log de débogage
      const formattedTests = await TestService.getFormattedTests();
      console.log('Tests récupérés:', formattedTests.length); // Log de débogage
      
      res.json({
          success: true,
          count: formattedTests.length,
          data: formattedTests
      });
  } catch (error) {
      console.error('Erreur détaillée:', error); // Log complet de l'erreur
      res.status(500).json({
          success: false,
          message: error.message || 'Erreur lors de la récupération des tests formatés',
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
  }
});


// Récupère un test par son ID
router.get('/getTestById/:id', async (req, res) => {
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
router.put('/update/:id', async (req, res) => {
  try {
    // Vérifier que le corps de la requête n'est pas vide
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Aucune donnée fournie pour la mise à jour" });
    }
    
    const updatedTest = await TestService.updateTest(req.params.id, req.body);
    
    // Si aucun test n'est trouvé pour la mise à jour, retourner 404
    if (!updatedTest) {
      return res.status(404).json({ message: "Test non trouvé pour mise à jour" });
    }
    
    res.status(200).json(updatedTest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Supprime un test par son ID
router.delete('/delete/:id', async (req, res) => {
  try {
    const deletedTest = await TestService.deleteTest(req.params.id);
    
    // Vérifier si un test a bien été supprimé
    if (!deletedTest) {
      return res.status(404).json({ message: "Test non trouvé pour suppression" });
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
router.get('/getCalendarTests', async (req, res) => {
  try {
    const tests = await TestService.getTestsForCalendar();
    res.json({
      success: true,
      data: tests
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
router.post('/startTest/:id/join', async (req, res) => {
  try {
    const testId = req.params.id;
    // Récupération de l'ID du collaborateur
    // Dans un contexte réel, cela pourrait provenir d'un token JWT ou du middleware d'authentification.
    const collaboratorId = req.body.collaboratorId;
    
    // Appel à la méthode de démarrage du test
    const participation = await TestService.demarrerTest(testId, collaboratorId);
    
    // Renvoi de l'objet participation en indiquant que l'utilisateur peut être redirigé vers la page du test.
    res.json({
      success: true,
      message: "Participation enregistrée. Redirection vers la page du test...",
      data: participation
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.patch('/updateScore', async (req, res) => {
  try {
    const { testId, collaboratorId, totalScore, successRate } = req.body;

    if (!testId || !collaboratorId || totalScore === undefined || successRate === undefined) {
      return res.status(400).json({ message: "Champs requis manquants (testId, collaboratorId, score, successRate)" });
    }
    console.log('testId:', testId, 'collaboratorId:', collaboratorId); // Debugging


    const result = await TestService.updateScore(testId, collaboratorId, totalScore, successRate);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;


