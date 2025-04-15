const Course = require('../models/course');

// @desc    Récupérer tous les cours
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Créer un nouveau cours
// @route   POST /api/courses
// @access  Private/Admin
exports.createCourse = async (req, res) => {
  const course = new Course({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    subCategory: req.body.subCategory,
    completed: req.body.completed || false
  });

  try {
    const newCourse = await course.save();
    res.status(201).json(newCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Récupérer un cours spécifique
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Mettre à jour un cours
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    res.json(updatedCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// @desc    Supprimer un cours
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    res.json({ message: 'Cours supprimé' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Récupérer les cours par catégorie
// @route   GET /api/courses/filter
// @access  Public
exports.getCoursesByCategory = async (req, res) => {
  try {
    const { category, subCategory, completed } = req.query;
    let query = {};
    
    if (category) query.category = category;
    if (subCategory) query.subCategory = subCategory;
    if (completed) query.completed = completed === 'true';
    
    const courses = await Course.find(query);
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc    Marquer un cours comme complété
// @route   PATCH /api/courses/:id/complete
// @access  Private
exports.markAsCompleted = async (req, res) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    );
    
    if (!updatedCourse) {
      return res.status(404).json({ message: 'Cours non trouvé' });
    }
    
    res.json(updatedCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};