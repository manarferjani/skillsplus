import express from 'express';
import mongoose from 'mongoose';
import MessageService from '../services/message.service.js';
import Conversation from '../models/conversation.model.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de Multer pour le téléchargement de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Obtenir les messages d'une conversation
router.get('/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID' });
    }

    const messages = await MessageService.getMessagesByConversation(conversationId);

    res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error('Erreur récupération messages:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Envoyer un nouveau message
router.post('/', async (req, res) => {
  try {
    const { conversationId, senderId, message, messageType } = req.body;

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation or sender ID' });
    }

    const newMessage = await MessageService.sendMessage({
      conversationId,
      senderId,
      message,
      messageType,
    });

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      io.to(conversation.members.map(m => m.toString())).emit('receive-message', newMessage);
      await MessageService.updateLastMessage(conversationId, {
        content: message || (messageType !== 'text' ? '[Attachment]' : ''),
        sender: senderId,
        timestamp: newMessage.createdAt,
      });
      io.to(conversation.members.map(m => m.toString())).emit('last-message-updated', {
        conversationId,
        lastMessage: {
          content: message || (messageType !== 'text' ? '[Attachment]' : ''),
          sender: senderId,
          timestamp: newMessage.createdAt,
        },
      });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error('Erreur envoi message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Modifier un message
router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, error: 'Invalid message ID' });
    }

    const updatedMessage = await MessageService.editMessage(messageId, message);

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    const conversation = await Conversation.findById(updatedMessage.conversation);
    if (conversation) {
      io.to(conversation.members.map(m => m.toString())).emit('message-updated', updatedMessage);
    }

    res.status(200).json({ success: true, data: updatedMessage });
  } catch (err) {
    console.error('Erreur modification message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Supprimer un message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, error: 'Invalid message ID' });
    }

    const message = await MessageService.deleteMessage(messageId);

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    const conversation = await Conversation.findById(message.conversation);
    if (conversation) {
      io.to(conversation.members.map(m => m.toString())).emit('delete-message', messageId);
      const lastMessage = await MessageService.getLastMessage(message.conversation);
      io.to(conversation.members.map(m => m.toString())).emit('last-message-updated', {
        conversationId: message.conversation,
        lastMessage: lastMessage
          ? {
              content: lastMessage.message || (lastMessage.messageType !== 'text' ? '[Attachment]' : ''),
              sender: lastMessage.sender,
              timestamp: lastMessage.createdAt,
            }
          : null,
      });
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Erreur suppression message:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Marquer un message comme lu
router.put('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid message or user ID' });
    }

    const updatedMessage = await MessageService.markMessageAsRead(messageId, userId);

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    const conversation = await Conversation.findById(updatedMessage.conversation);
    if (conversation) {
      io.to(conversation.members.map(m => m.toString())).emit('message-read', updatedMessage);
    }

    res.status(200).json({ success: true, data: updatedMessage });
  } catch (err) {
    console.error('Erreur marquage message lu:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Télécharger un fichier
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const { conversationId, senderId, messageType } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation or sender ID' });
    }

    const newMessage = await MessageService.uploadFile({
      conversationId,
      senderId,
      messageType,
      file,
    });

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    const conversation = await Conversation.findById(conversationId);
    if (conversation) {
      io.to(conversation.members.map(m => m.toString())).emit('receive-message', newMessage);
      await MessageService.updateLastMessage(conversationId, {
        content: '[Attachment]',
        sender: senderId,
        timestamp: newMessage.createdAt,
      });
      io.to(conversation.members.map(m => m.toString())).emit('last-message-updated', {
        conversationId,
        lastMessage: {
          content: '[Attachment]',
          sender: senderId,
          timestamp: newMessage.createdAt,
        },
      });
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error('Erreur téléchargement fichier:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;