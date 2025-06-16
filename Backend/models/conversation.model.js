import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema({
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: {
    content: String,
    sender: String,
    timestamp: Date,
  },
  isMuted: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;