import mongoose from 'mongoose';
const { Schema } = mongoose;
import User from './user.js';

const testSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    enum: ['junior', 'intermediaire', 'senior'], // valeurs possibles
    required: true
    
  },
  technology: {
    type: Schema.Types.ObjectId,
    ref: 'Technologie',
    required: true
  },
  description: {
    type: String
  },
  scheduledDate: {
    type: Date,
    required: true 
  },
  status: {
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  },
  averageScore: { 
    type: Number, 
    default: null 
  },
  averageSuccessRate: {
    type: Number, 
    default: null 
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'Manager', 
    required: true 
  },
  duration: { 
    type: Number // durée en minutes
  },
  questions: [{
    questionText: { 
      type: String, 
      required: true 
    },
    type: {
      type: String,
      enum: ['single', 'multiple', 'code'],
      required: true
    },
    level: {
      type: String,
      enum: ['basic', 'intermediate', 'expert'],
      required: true
    },
    options: [{ 
      type: String 
    }],
    correctAnswer: { 
      type: String,
      required: function () {
        return this.type === 'single';
      }
    },
    correctAnswers: {
      type: [String],
      required: function () {
        return this.type === 'multiple';
      }
    },
    points: {
      type: Number,
      required: true
    }
  }],
  participations: {
    type: [{
      user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        required: true,
        validate: {
          validator: async function(userId) {
            const user = await User.findById(userId);
            return user && user.role === 'collaborator';  // Comparaison avec la chaîne "collaborator"
          },
          message: 'Seuls les collaborateurs (role="collaborator") peuvent être associés à un test'
        }
      },
      totalScore: {
        type: Number,
        default: null
      },
      successRate: {
        type: Number,
        default: null
      },
      startTime: { 
        type: Date, 
        default: null 
      },
      endTime: { 
        type: Date,
        default: null
      },
      timeSpent: { 
        type: Number,
        default: null
      }
    }],
    default: []
  },
  published: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// Définition du modèle
const Test = mongoose.model('Test', testSchema);

// Exportation du modèle Test
export default Test;
