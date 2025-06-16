import mongoose from 'mongoose';
import Conversation from '../models/conversation.model.js';
import User from '../models/user.js';

const ChatService = {
  async createConversation(members) {
    try {
      console.log('ChatService - Creating conversation:', { members });

      // Valider les ObjectIds
      const validIds = members.every(id => mongoose.Types.ObjectId.isValid(id));
      if (!validIds) {
        throw new Error('Invalid member IDs');
      }

      // Vérifier que les utilisateurs existent
      const users = await User.find({ _id: { $in: members } });
      if (users.length !== members.length) {
        throw new Error('One or more participants not found');
      }

      // Vérifier si une conversation existe déjà
      const existingConversation = await Conversation.findOne({
        members: { $all: members, $size: members.length },
      });

      if (existingConversation) {
        return existingConversation.populate('members', 'name email');
      }

      // Créer une nouvelle conversation
      const conversation = new Conversation({
        members,
        isMuted: false,
        isArchived: false,
      });

      await conversation.save();
      return conversation.populate('members', 'name email');
    } catch (err) {
      console.error('Erreur création conversation:', err);
      throw new Error(err.message || 'Error creating conversation');
    }
  },

  async getConversationsByUser(userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid user ID');
      }

      const conversations = await Conversation.find({
        members: userId,
      }).populate('members', 'name email').populate('lastMessage');

      return conversations;
    } catch (err) {
      console.error('Erreur récupération conversations:', err);
      throw new Error(err.message || 'Error fetching conversations');
    }
  },

 async deleteConversation(conversationId) {
    console.log(`Attempting to delete conversation with ID: ${conversationId}`);
    const conversation = await Conversation.findByIdAndDelete(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    console.log('Conversation deleted:', conversation);
    return conversation;
  },

  async addMemberToConversation(conversationId, userId) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId) || !mongoose.Types.ObjectId.isValid(userId)) {
        throw new Error('Invalid conversation or user ID');
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      if (conversation.members.includes(userId)) {
        throw new Error('User already in conversation');
      }

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      conversation.members.push(userId);
      await conversation.save();
      return conversation.populate('members', 'name email');
    } catch (err) {
      console.error('Erreur ajout utilisateur:', err);
      throw new Error(err.message || 'Error adding user to conversation');
    }
  },

  async toggleMuteConversation(conversationId, isMuted) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error('Invalid conversation ID');
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.isMuted = isMuted;
      await conversation.save();
      return conversation.populate('members', 'name email');
    } catch (err) {
      console.error('Erreur bascule notifications:', err);
      throw new Error(err.message || 'Error toggling mute status');
    }
  },

  async toggleArchiveConversation(conversationId, isArchived) {
    try {
      if (!mongoose.Types.ObjectId.isValid(conversationId)) {
        throw new Error('Invalid conversation ID');
      }

      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      conversation.isArchived = isArchived;
      await conversation.save();
      return conversation.populate('members', 'name email');
    } catch (err) {
      console.error('Erreur bascule archivage:', err);
      throw new Error(err.message || 'Error toggling archive status');
    }
  },
};

export default ChatService;