const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom du cours est requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise']
  },
  category: {
    type: String,
    enum: ['technology', 'methodology', 'development', 'news'],
    required: true
  },
  subCategory: {
    type: String,
    enum: ['backend', 'frontend', 'agile', 'classic', 'devops', 'framework', null],
    default: null
  },
  completed: {
    type: Boolean,
    default: false
  },
  enrolled: {
    type: Boolean,
    default: false
  },
  logo: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);