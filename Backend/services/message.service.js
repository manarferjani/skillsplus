import mongoose from 'mongoose';
import Message from '../models/message.model.js';
import Conversation from '../models/conversation.model.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MessageService = {
  async getMessagesByConversation(conversationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error('Invalid conversation ID');
      }

      const messages = await Message.find({ conversation: conversationId })
        .populate('sender', 'name')
        .sort({ createdAt: 1 });

      return messages;
    } catch (err) {
      console.error('Erreur récupération messages:', err);
      throw new Error(err.message || 'Error fetching messages');
    }
  },

  async sendMessage({ conversationId, senderId, message, messageType }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        throw new Error('Invalid conversation or sender ID');
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const newMessage = new Message({
        conversation: conversationId,
        sender: senderId,
        message,
        messageType,
        attachments: [],
        readBy: [],
      });

      await newMessage.save();
      return newMessage.populate('sender', 'name');
    } catch (err) {
      console.error('Erreur envoi message:', err);
      throw new Error(err.message || 'Error sending message');
    }
  },

  async editMessage(messageId, message) {
    try {
      if (!mongoose.Types.ObjectId.isValid(messageId)) {
        throw new Error('Invalid message ID');
      }

      const existingMessage = await Message.findById(messageId);
      if (!existingMessage) {
        throw new Error('Message not found');
      }

      existingMessage.message = message;
      existingMessage.edited = true;
      existingMessage.editedAt = new Date();
      await existingMessage.save();
      return existingMessage.populate('sender', 'name');
    } catch (err) {
      console.error('Erreur modification message:', err);
      throw new Error(err.message || 'Error editing message');
    }
  },
  async deleteMessage(messageId) {
    const message = await Message.findByIdAndDelete(messageId);
    if (!message) {
      throw new Error('Message not found');
    }
    return message; // Retourne le message supprimé
  },

  async markMessageAsRead(messageId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid message or user ID');
      }

      const message = await Message.findById(messageId);
      if (!message) {
        throw new Error('Message not found');
      }

      if (!message.readBy.some(r => r.user.toString() === userId)) {
        message.readBy.push({ user: userId, readAt: new Date() });
        await message.save();
      }

      return message.populate('sender', 'name');
    } catch (err) {
      console.error('Erreur marquage message lu:', err);
      throw new Error(err.message || 'Error marking message as read');
    }
  },

  async updateLastMessage(conversationId, lastMessage) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error('Invalid conversation ID');
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.lastMessage = lastMessage;
      await conversation.save();
    } catch (err) {
      console.error('Erreur mise à jour dernier message:', err);
      throw new Error(err.message || 'Error updating last message');
    }
  },

  async getLastMessage(conversationId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error('Invalid conversation ID');
      }

      const message = await Message.findOne({ conversation: conversationId })
        .sort({ createdAt: -1 })
        .populate('sender', 'name');

      return message;
    } catch (err) {
      console.error('Erreur récupération dernier message:', err);
      throw new Error(err.message || 'Error fetching last message');
    }
  },

  async uploadFile({ conversationId, senderId, messageType, file }) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(senderId)) {
        throw new Error('Invalid conversation or sender ID');
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      const newMessage = new Message({
        conversation: conversationId,
        sender: senderId,
        messageType,
        attachments: [{
          url: `/Uploads/${file.filename}`,
          filename: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
        }],
        readBy: [],
      });

      await newMessage.save();
      return newMessage.populate('sender', 'name');
    } catch (err) {
      console.error('Erreur téléchargement fichier:', err);
      throw new Error(err.message || 'Error uploading file');
    }
  },
};

export default MessageService;