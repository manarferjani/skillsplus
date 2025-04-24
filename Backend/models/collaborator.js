// models/Collaborator.js
import mongoose from 'mongoose';
import User from './user.js';
const { Schema } = mongoose;

const collaboratorSchema = new Schema({
    testsTaken: {
      type: [{
        testId: { type: Schema.Types.ObjectId, ref: 'Test' },
        score: Number,
        successRate: Number,
        takenAt: { type: Date, default: Date.now }
      }],
      default: []  // Ce qui force l'initialisation à un tableau vide dès la création du document
    },
    formationsFollowed: {
      type: [{
        formationId: { type: Schema.Types.ObjectId, ref: 'Formation' },
        date: { type: Date, default: Date.now }
      }],
      default: []
    }
  });
  

// Le discriminator utilise le champ interne __t pour identifier le type
// Vous pouvez choisir d'appeler ce type "Collaborator"
export const Collaborator = mongoose.model('Collaborator', collaboratorSchema);


