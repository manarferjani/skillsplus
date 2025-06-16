import express from 'express';
import CourseService from '../services/course.service.js';
import upload from '../middleware/upload.js';
import { sendCourseAssignmentEmail } from '../services/emailcourse.service.js'; // Import directly for email endpoint
import { auth, isManager } from '../middleware/auth.js';
const router = express.Router();

// GET all courses
router.get('/', auth, async (req, res) => {
  try {
    const courses = await CourseService.getAllCourses();
    res.json(courses);
  } catch (err) {
    console.error('Erreur lors de la récupération des cours :', err);
    res.status(500).json({ message: err.message });
  }
});
// GET a course by ID
router.get('/:courseId', async (req, res) => {
  try {
    const course = await CourseService.getCourseById(req.params.courseId);
    res.json(course);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// POST a new course
router.post('/', async (req, res) => {
  try {
    const newCourse = await CourseService.createCourse(req.body);
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE a course by ID
router.delete('/:courseId', async (req, res) => {
  try {
    const result = await CourseService.deleteCourseById(req.params.courseId);
    res.json(result);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// PUT update a course by ID
router.put('/:courseId', async (req, res) => {
  try {
    const updatedCourse = await CourseService.updateCourseById(req.params.courseId, req.body);
    res.json(updatedCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH - Toggle saved status of a course
router.patch('/:courseId/toggle-saved', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { saved } = req.body;

    if (typeof saved !== 'boolean') {
      return res.status(400).json({ message: 'saved must be a boolean' });
    }

    const result = await CourseService.toggleCourseSavedStatus(courseId, saved);
    res.json(result);
  } catch (err) {
    console.error('Error updating course saved status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH - Toggle completed status of a course
router.patch('/:courseId/toggle-completed', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { completed } = req.body;

    if (typeof completed !== 'boolean') {
      return res.status(400).json({ message: 'completed must be a boolean' });
    }

    const result = await CourseService.toggleCourseCompletedStatus(courseId, completed);
    res.json(result);
  } catch (err) {
    console.error('Error updating course completed status:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// POST - Assign a course to a user
router.post('/:courseId/assign', auth, async (req, res) => {
  try {
    const { assignTo } = req.body; // Email
    const courseId = req.params.courseId;
    const assignedById = req.user._id; // From auth middleware
    console.log('Assign request:', { courseId, assignTo, assignedById }); // Debugging
    const result = await CourseService.assignCourseToUser(courseId, assignTo, assignedById); // Use static method
    res.status(200).json(result);
  } catch (error) {
    console.error('Assignment error:', error.message);
    res.status(400).json({ message: error.message });
  }
});

// POST - Send course assignmenI email
router.post('/:courseId/assign-email', async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userEmail, userName, courseName, courseDescription } = req.body;

    if (!userEmail || !userName || !courseName || !courseDescription) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const result = await sendCourseAssignmentEmail(userEmail, userName, courseName, courseDescription, courseId);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to send email', error: result.error });
    }

    res.status(200).json({ message: 'Email sent successfully', messageId: result.messageId });
  } catch (error) {
    console.error('Error in assign-email endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});
// GET all levels of a course
router.get('/:courseId/levels', async (req, res) => {
  try {
    const levels = await CourseService.getLevelsByCourseId(req.params.courseId);
    res.json(levels);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// GET a level by ID from a course
router.get('/:courseId/levels/:levelId', async (req, res) => {
  try {
    const level = await CourseService.getLevelByCourseAndLevelId(req.params.courseId, req.params.levelId);
    res.json(level);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// POST a new level to a course
router.post('/:courseId/levels', async (req, res) => {
  try {
    const course = await CourseService.addLevelToCourseById(req.params.courseId, req.body);
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});



// PUT - Update a level
router.put('/:courseId/levels/:levelId', async (req, res) => {
  try {
    const updatedCourse = await CourseService.updateLevelById(req.params.courseId, req.params.levelId, req.body);
    res.json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE - Delete a level
router.delete('/:courseId/levels/:levelId', async (req, res) => {
  try {
    const result = await CourseService.deleteLevelById(req.params.courseId, req.params.levelId);
    res.json(result);
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    res.status(500).json({ message: err.message });
  }
});

// POST - Assign a level to a user
router.post('/:courseId/levels/:levelId/assign', auth, isManager, async (req, res) => {
  try {
    const { courseId, levelId } = req.params;
    const { assignTo } = req.body;
    const assignedBy = req.user._id;

    if (!assignTo) {
      return res.status(400).json({ message: 'L’email de l’utilisateur est requis' });
    }

    const result = await CourseService.assignLevelToUser(courseId, levelId, assignTo, assignedBy);
    res.json(result);
  } catch (err) {
    console.error('Erreur lors de l’affectation du niveau :', err);
    res.status(err.message.includes('non trouvé') ? 404 : 400).json({ message: err.message });
  }
});

// POST - Send level assignment email
router.post('/:courseId/levels/:levelId/assign-email', auth, isManager, async (req, res) => {
  try {
    const { courseId, levelId } = req.params;
    const { userEmail, userName, levelTitle, levelDescription } = req.body;

    if (!userEmail || !userName || !levelTitle || !levelDescription) {
      return res.status(400).json({ message: 'Champs requis manquants' });
    }

    const course = await CourseService.getCourseById(courseId);
    const level = await CourseService.getLevelByCourseAndLevelId(courseId, levelId);
    if (!course || !level) {
      return res.status(404).json({ message: 'Cours ou niveau non trouvé' });
    }

    const levelLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/courses/${courseId}/levels/${levelId}`;
    const result = await sendLevelAssignmentEmail(userEmail, userName, levelTitle, levelDescription, courseId, levelId, levelLink);

    if (!result.success) {
      return res.status(500).json({ message: 'Échec de l’envoi de l’email', error: result.error });
    }

    res.status(200).json({ message: 'Email envoyé avec succès', messageId: result.messageId });
  } catch (error) {
    console.error('Erreur dans l’enpoint assign-email pour niveau :', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// GET all supports for a specific level
router.get('/:courseId/levels/:levelId/supports', async (req, res) => {
  try {
    const supports = await CourseService.getSupportsByLevel(req.params.courseId, req.params.levelId);
    res.json(supports);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

// POST a new support (video/pdf/link) to a level
router.post('/:courseId/levels/:levelId/supports', upload.single('pdfFile'), async (req, res) => {
  try {
    const { courseId, levelId } = req.params;
    const { name, description, type, imageUrl, videoUrl, linkUrl } = req.body;
    const pdfFile = req.file ? req.file.filename : null;

    const supportData = {
      name,
      description,
      type: Array.isArray(type) ? type : [type],
      imageUrl,
      videoUrl,
      linkUrl,
    };

    const newSupport = await CourseService.addSupportToLevel(courseId, levelId, supportData, pdfFile);
    res.status(201).json(newSupport);
  } catch (err) {
    console.error('Error adding support:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    res.status(400).json({ message: err.message });
  }
});

// DELETE - Delete a support from a level
router.delete('/:courseId/levels/:levelId/supports/:supportId', async (req, res) => {
  try {
    const { courseId, levelId, supportId } = req.params;
    const result = await CourseService.deleteSupportById(courseId, levelId, supportId);
    res.json(result);
  } catch (err) {
    console.error('Error deleting support:', err);
    res.status(500).json({ message: err.message });
  }
});

// PUT - Update a support in a level
router.put('/:courseId/levels/:levelId/supports/:supportId', upload.single('pdfFile'), async (req, res) => {
  try {
    const { courseId, levelId, supportId } = req.params;
    const supportData = {
      name: req.body.name,
      description: req.body.description,
      type: Array.isArray(req.body.type) ? req.body.type : [req.body.type],
      imageUrl: req.body.imageUrl,
      videoUrl: req.body.videoUrl,
      linkUrl: req.body.linkUrl,
    };
    const pdfFile = req.file ? req.file.filename : null;
    const updatedSupport = await CourseService.updateSupportById(courseId, levelId, supportId, supportData, pdfFile);
    res.json(updatedSupport);
  } catch (err) {
    console.error('Error updating support:', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }
    res.status(400).json({ message: err.message });
  }
});



// PATCH - Toggle saved status of a level
router.patch('/:courseId/levels/:levelId', async (req, res) => {
  try {
    const { courseId, levelId } = req.params;
    const { isSaved } = req.body;

    const result = await CourseService.markLevelAsSaved(courseId, levelId, isSaved);
    res.json(result);
  } catch (err) {
    console.error('Error updating level:', err);
    res.status(500).json({ message: err.message });
  }
});

// PATCH - Toggle saved status of a support
router.patch('/:courseId/levels/:levelId/supports/:supportId', async (req, res) => {
  try {
    const { courseId, levelId, supportId } = req.params;
    const { isSaved } = req.body;

    const result = await CourseService.markSupportAsSaved(courseId, levelId, supportId, isSaved);
    res.json(result);
  } catch (err) {
    console.error('Error updating support save status:', err);
    res.status(500).json({ message: err.message });
  }
});

// GET - Redirect to an external link for support
router.get('/:courseId/levels/:levelId/supports/:supportId/open', async (req, res) => {
  try {
    const url = await CourseService.openSupportLink(req.params.courseId, req.params.levelId, req.params.supportId);
    res.redirect(url);
  } catch (err) {
    res.status(404).json({ message: err.message });
  }
});

export default router;