const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCoursesByCategory,
  markAsCompleted
} = require('../controllers/courseControllers');

const  { auth }= require('../middleware/auth'); // Assure-toi que ce middleware existe

// Routes
router.get('/', getAllCourses);
/**
 * @swagger
 * /courses:
 *   post:
 *     tags:
 *       - Courses
 *     summary: Créer un nouveau cours
 *     description: Cette route permet de créer un cours dans l'application SkillsPlus.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Introduction à JavaScript"
 *               description:
 *                 type: string
 *                 example: "Cours pour apprendre les bases de JavaScript."
 *               duration:
 *                 type: string
 *                 example: "3 heures"
 *               instructor:
 *                 type: string
 *                 example: "John Doe"
 *     responses:
 *       201:
 *         description: Cours créé avec succès
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 */

router.post('/', auth, createCourse);
router.get('/filter', getCoursesByCategory);
router.get('/:id', getCourseById);
router.put('/:id', auth, updateCourse);
router.delete('/:id', auth, deleteCourse);
router.patch('/:id/complete', auth, markAsCompleted);

module.exports = router;
