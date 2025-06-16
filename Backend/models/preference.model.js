import mongoose from 'mongoose';

// Schéma pour une configuration de thème
const themeSchema = new mongoose.Schema({
  value: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  label: {
    type: String,
    required: true,
    trim: true,
  },
  preview: {
    bg: { type: String, required: true },
    cardBg: { type: String, required: true },
    accent: { type: String, required: true },
  },
});

// Schéma pour les préférences utilisateur
const preferenceSchema = new mongoose.Schema({
  userId: {
    type: String, // Peut être mongoose.Schema.Types.ObjectId si lié à une collection User
    required: true,
    unique: true,
    trim: true,
  },
  theme: {
    type: String,
    required: true,
    trim: true,
  },
  font: {
    type: String,
    required: true,
    trim: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Schéma pour les configurations globales (thèmes et polices disponibles)
const appearanceConfigSchema = new mongoose.Schema({
  themes: [themeSchema],
  fonts: [{
    type: String,
    required: true,
    trim: true,
  }],
});

// Mettre à jour le champ `updatedAt` avant chaque sauvegarde
preferenceSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

const Preference = mongoose.model('Preference', preferenceSchema);
const AppearanceConfig = mongoose.model('AppearanceConfig', appearanceConfigSchema);

export { Preference, AppearanceConfig };