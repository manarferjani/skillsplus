// models/Formation.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const formationSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  levelRequired: {
    type: String,
    required: true,
    enum: [1, 2, 3]
  },
  // Référence à la technologie de la formation
  technology: {
    type: Schema.Types.ObjectId,
    ref: 'Technologie',
    required: true
  }
}, { timestamps: true });


export default mongoose.model('Formation', formationSchema); 

