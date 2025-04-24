import mongoose from 'mongoose';
const { Schema } = mongoose;

const submissionSchema = new Schema({
  test: {  // Référence au test
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  collaborator: {  // Référence au collaborateur
    type: Schema.Types.ObjectId,
    ref: 'Collaborator',
    required: true
  },
  responses: [{  // Les réponses du collaborateur pour chaque question du test
    questionText: { 
      type: String, // Texte de la question
      required: true
    },
    response: { 
      type: Schema.Types.Mixed, 
      required: true 
    },
    isCorrect: {
      type: Boolean,
      required: true
    }
  }],

  startTime: { 
    type: Date, 
    required: false 
  },
  endTime: { 
    type: Date,
    required: false 
  },
  timeSpent: { 
    type: String,
    required: false
  },
  totalScore: { 
    type: Number,
    required: false 
  },
  successRate: { 
    type: Number,
    required: false 
  },
  // Décomposons le score en fonction des niveaux de difficulté
  basicScore: { 
    type: Number, 
    default: 0 
  },
  intermediateScore: { 
    type: Number, 
    default: 0 
  },
  expertScore: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

submissionSchema.index({ test: 1, collaborator: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);  // Export par défaut
