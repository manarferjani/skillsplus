const mongoose = require('mongoose');
const { Schema } = mongoose;

const questionSchema = new Schema({
  questionText: { 
    type: String, 
    required: true 
  },
  options: [{ 
    type: String, 
    required: true 
  }],
  correctAnswer: { 
    type: String, 
    required: true 
  },
  level: {
    type: String,
    enum: ['basic', 'intermediate', 'expert'],
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  technology: {
    type: Schema.Types.ObjectId,
    ref: 'Technologie',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);
