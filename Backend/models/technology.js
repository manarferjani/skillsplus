// models/Technologie.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const technologieSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  tests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test' // référence au modèle Test
  }]
}, { timestamps: true });

export default mongoose.model('Technologie', technologieSchema);



