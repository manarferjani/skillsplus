import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  messageType: { type: String, enum: ['text', 'image', 'file', 'audio', 'video'], default: 'text' },
  attachments: [{
    url: String,
    filename: String,
    mimeType: String,
    size: Number,
  }],
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: Date,
  }],
  edited: { type: Boolean, default: false },
  editedAt: Date,
  deleted: { type: Boolean, default: false },
  deletedAt: Date,
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);