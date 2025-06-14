import mongoose from "mongoose";
const { Schema } = mongoose;

const submissionSchema = new Schema(
  {
    test: {
      // Référence au test
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },
    collaborator: {
      // Référence au collaborateur
      type: Schema.Types.ObjectId,
      ref: "Collaborator",
      required: true,
    },
    responses: [
      {
        // Les réponses du collaborateur pour chaque question du test
        questionText: {
          type: String, // Texte de la question
          required: true,
        },
        questionType: {
          // Ajoutez ce champ
          type: String,
          enum: ["single", "multiple", "code"],
          required: true,
        },
        response: {
          type: Schema.Types.Mixed,
          required: true,
        },
        isCorrect: {
          type: Boolean,
          required: true,
        },
        score: {
          // Nouveau champ pour le score
          type: Number,
          min: 0,
          max: 20,
        },
        feedback: {
          synthese: {
            type: String,
            required: function () {
              return this.questionType === "code";
            },
          },
          exigencesFonctionnelles: [
            {
              exigence: {
                type: String,
                required: true,
              },
              statut: {
                type: String,
                enum: ["✅", "❌", "⚠️"],
                required: true,
              },
              lignes: {
                type: String,
                required: false,
              },
              details: {
                type: String,
                required: false,
              },
            },
          ],
          bonnesPratiques: [
            {
              categorie: {
                type: String,
                enum: ["Lisibilité", "Structure", "Conventions", "Performance"],
                required: true,
              },
              statut: {
                type: String,
                enum: ["✅", "⚠️", "❌"],
                required: true,
              },
              details: {
                type: String,
                required: true,
              },
            },
          ],
          recommandations: [
            {
              priorite: {
                type: String,
                enum: ["Haute", "Moyenne", "Basse"],
                required: true,
              },
              suggestion: {
                type: String,
                required: true,
              },
            },
          ],
        },
      },
    ],

    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
    },
    timeSpent: {
      type: Number,
      default: 0,
    },
    totalScore: {
      type: Number,
      required: false,
    },
    successRate: {
      type: Number,
      required: false,
    },
    // Décomposons le score en fonction des niveaux de difficulté
    basicScore: {
      type: Number,
      default: 0,
    },
    intermediateScore: {
      type: Number,
      default: 0,
    },
    expertScore: {
      type: Number,
      default: 0,
    },
    awardedBadge: {
      type: String,
    },
    basicRate: {
      type: Number,
      default: 0,
    },
    intermediateRate: {
      type: Number,
      default: 0,
    },
    expertRate: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

submissionSchema.index({ test: 1, collaborator: 1 }, { unique: true });

export default mongoose.model("Submission", submissionSchema); // Export par défaut
