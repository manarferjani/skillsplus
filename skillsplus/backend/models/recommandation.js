// models/Recommendation.js
import mongoose from 'mongoose';
const { Schema } = mongoose;

const recommendationSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User', // ou éventuellement 'Collaborator' si vous préférez limiter aux collaborateurs
    required: true
  },
  test: {
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  formation: {
    type: Schema.Types.ObjectId,
    ref: 'Formation',
    required: true
  },
  text: {
    type: String
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Recommendation', recommendationSchema);
