import express from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.js';
import ChatService from '../services/chat.service.js';

const router = express.Router();

// Créer une nouvelle conversation
router.post('/', async (req, res) => {
  try {
    const { members } = req.body;

    console.log('Received members:', members);

    // Valider l'entrée
    if (!members || !Array.isArray(members) || members.length < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least two participants are required' 
      });
    }

    // Valider les ObjectIds
    const validIds = members.every(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid participant IDs' 
      });
    }

    // Vérifier que tous les participants existent
    const users = await User.find({ _id: { $in: members } });
    if (users.length !== members.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'One or more participants not found' 
      });
    }

    // Créer la conversation via le service
    const conversation = await ChatService.createConversation(members);

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    io.to(members).emit('conversation-created', conversation);

    res.status(201).json({ success: true, data: conversation });
  } catch (err) {
    console.error('Erreur création conversation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Obtenir les conversations d'un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Valider userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID' 
      });
    }

    const conversations = await ChatService.getConversationsByUser(userId);

    res.status(200).json({ success: true, count: conversations.length, data: conversations });
  } catch (err) {
    console.error('Erreur récupération conversations:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Supprimer une conversation
router.delete('/:conversationId', async (req, res) => {
  const { conversationId } = req.params;

  try {
    console.log('DELETE /api/chat/:conversationId called with ID:', conversationId);

    // Valider conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID' });
    }

    const result = await ChatService.deleteConversation(conversationId);
    console.log('Result from deleteConversation:', result); // Log du résultat

    if (!result) {
      return res.status(404).json({ success: false, error: 'Conversation not found or already deleted' });
    }

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    const conversation = await Conversation.findById(conversationId); // Vérifie si encore présent
    if (conversation) {
      io.to(conversation.members.map(m => m.toString())).emit('conversation-deleted', conversationId);
    } else {
      console.log('Conversation not found after deletion attempt');
    }

    res.status(200).json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    console.error('Erreur suppression conversation:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});
// Ajouter un utilisateur à une conversation
router.put('/:conversationId/add-member', async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.body;

  try {
    // Valider ObjectIds
    if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversationId or userId' });
    }

    const updatedConversation = await ChatService.addMemberToConversation(conversationId, userId);

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    io.to(updatedConversation.members.map(m => m.toString())).emit('member-added', updatedConversation);

    res.status(200).json({ success: true, data: updatedConversation });
  } catch (err) {
    console.error('Erreur ajout utilisateur:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Activer/désactiver les notifications
router.put('/:conversationId/mute', async (req, res) => {
  const { conversationId } = req.params;
  const { isMuted } = req.body;

  try {
    // Valider ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID' });
    }

    const updatedConversation = await ChatService.toggleMuteConversation(conversationId, isMuted);

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    io.to(updatedConversation.members.map(m => m.toString())).emit('mute-toggled', {
      conversationId,
      isMuted,
    });

    res.status(200).json({ success: true, data: updatedConversation });
  } catch (err) {
    console.error('Erreur bascule notifications:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Archiver/désarchiver une conversation
router.put('/:conversationId/archive', async (req, res) => {
  const { conversationId } = req.params;
  const { isArchived } = req.body;

  try {
    // Valider ObjectId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return res.status(400).json({ success: false, error: 'Invalid conversation ID' });
    }

    const updatedConversation = await ChatService.toggleArchiveConversation(conversationId, isArchived);

    // Émettre un événement Socket.IO
    const io = req.app.get('io');
    io.to(updatedConversation.members.map(m => m.toString())).emit('archive-toggled', {
      conversationId,
      isArchived,
    });

    res.status(200).json({ success: true, data: updatedConversation });
  } catch (err) {
    console.error('Erreur bascule archivage:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;