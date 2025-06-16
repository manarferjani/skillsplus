import mongoose from 'mongoose';

// Schéma d'un support pédagogique (vidéo, pdf, lien)
const supportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: [String],
    enum: ['video', 'pdf', 'link'],
    required: true,
  },
  imageUrl: {
    type: String,
    default: '',
  },
  videoUrl: {
    type: String,
    required: function () {
      return this.type.includes('video');
    },
  },
  pdfFile: {
    type: String,
    required: function () {
      return this.type.includes('pdf');
    },
  },
  linkUrl: {
    type: String,
    required: function () {
      return this.type.includes('link');
    },
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  isViewed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Schéma pour un niveau (débutant, intermédiaire, avancé)
const levelSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  isSaved: {
    type: Boolean,
    default: false,
  },
  supports: {
    type: [supportSchema],
    default: [],
  },
 assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Reference User, not Admin
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference User
}, { timestamps: true });


// Schéma principal du cours
const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: false,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  desc: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    enum: ['technology', 'methodology'],
    required: true,
  },
  saved: { // Ajout du champ saved
    type: Boolean,
    default: false,
  },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Nouveau champ
  levels: {
    type: [levelSchema],
    default: [],
  },
}, { timestamps: true });

const Course = mongoose.model('Course', courseSchema);
export default Course;