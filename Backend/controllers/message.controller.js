import express from 'express';
import mongoose from 'mongoose';
import MessageService from '../services/message.service.js';
import Conversation from '../models/conversation.model.js';
import multer from 'multer';
import path from 'path';

import { fileURLToPath } from 'url';
import fs from 'fs/promises'; // Import fs/promises explicitly

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure Uploads directory exists
const uploadDir = path.join(__dirname, '../Uploads');
fs.access(uploadDir).catch(() => fs.mkdir(uploadDir, { recursive: true }));

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.log(`Type de fichier non autorisé : ${file.mimetype}`);
    cb(new Error(`Type de fichier non autorisé : ${file.mimetype}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

// Serve files with proper headers
router.get('/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!(await fs.access(filePath).then(() => true).catch(() => false))) {
      return res.status(404).json({ success: false, error: 'Fichier non trouvé' });
    }

    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    if (ext === '.pdf' && req.query.download !== 'true') {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }

    res.sendFile(filePath);
  } catch (err) {
    console.error('Erreur service fichier:', err);
    res.status(500).json({ success: false, error: 'Erreur serveur lors de la récupération du fichier' });
  }
});

// Get messages by conversation
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
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur' });
  }
});

// Send a new message
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

    const io = req.app.get('io');
    if (!io) {
      console.error('Socket.IO non initialisé');
    } else {
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
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error('Erreur envoi message:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur' });
  }
});

// Edit a message
router.put('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, error: 'Invalid message ID' });
    }

    const updatedMessage = await MessageService.editMessage(messageId, message);

    const io = req.app.get('io');
    if (io) {
      const conversation = await Conversation.findById(updatedMessage.conversation);
      if (conversation) {
        io.to(conversation.members.map(m => m.toString())).emit('message-updated', updatedMessage);
      }
    }

    res.status(200).json({ success: true, data: updatedMessage });
  } catch (err) {
    console.error('Erreur modification message:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur' });
  }
});

// Delete a message
router.delete('/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ success: false, error: 'Invalid message ID' });
    }

    const message = await MessageService.deleteMessage(messageId);

    const io = req.app.get('io');
    if (io) {
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
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Erreur suppression message:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur' });
  }
});

// Mark message as read
router.put('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid message or user ID' });
    }

    const updatedMessage = await MessageService.markMessageAsRead(messageId, userId);

    const io = req.app.get('io');
    if (io) {
      const conversation = await Conversation.findById(updatedMessage.conversation);
      if (conversation) {
        io.to(conversation.members.map(m => m.toString())).emit('message-read', updatedMessage);
      }
    }

    res.status(200).json({ success: true, data: updatedMessage });
  } catch (err) {
    console.error('Erreur marquage message lu:', err);
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur' });
  }
});

// Upload files
router.post('/upload', upload.array('files', 5), async (req, res) => {
  try {
    console.log('Requête upload reçue :', {
      conversationId: req.body.conversationId,
      senderId: req.body.senderId,
      messageType: req.body.messageType,
      files: req.files ? req.files.map(f => f.originalname) : [],
    });

    const { conversationId, senderId, messageType } = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun fichier uploadé' });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return res.status(400).json({ success: false, error: 'ID de conversation ou d\'utilisateur invalide' });
    }

    const newMessage = await MessageService.uploadFile({
      conversationId,
      senderId,
      messageType,
      files,
    });

    const io = req.app.get('io');
    if (!io) {
      console.warn('Socket.IO non initialisé');
    } else {
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
    }

    res.status(201).json({ success: true, data: newMessage });
  } catch (err) {
    console.error('Erreur upload fichier :', err);
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, error: `Erreur Multer : ${err.message}` });
    }
    res.status(500).json({ success: false, error: err.message || 'Erreur serveur lors de l\'upload' });
  }
});
export default router;