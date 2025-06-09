import mongoose from 'mongoose';
import NotificationSettings from '../models/notification.model.js';
import User from '../models/user.js';

class NotificationSettingsService {
  async getSettings(userId) {
    try {
      const settings = await NotificationSettings.findOne({ user: userId })
        .populate('user', 'name email role');
      
      if (!settings) {
        throw new Error('Notification settings not found');
      }
      
      return settings;
    } catch (err) {
      console.error('Erreur lors de la récupération des paramètres de notification :', err);
      throw err;
    }
  }

  async updateSettings(userId, data) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let settings = await NotificationSettings.findOne({ user: userId });

      if (!settings) {
        settings = new NotificationSettings({
          user: userId,
          type: data.type || 'none',
          mobile: data.mobile || false,
          communication_emails: data.communication_emails || false,
          social_emails: data.social_emails || true,
          marketing_emails: data.marketing_emails || false,
          security_emails: true, // Toujours true
        });
      } else {
        settings.type = data.type || settings.type;
        settings.mobile = data.mobile !== undefined ? data.mobile : settings.mobile;
        settings.communication_emails = data.communication_emails !== undefined ? data.communication_emails : settings.communication_emails;
        settings.social_emails = data.social_emails !== undefined ? data.social_emails : settings.social_emails;
        settings.marketing_emails = data.marketing_emails !== undefined ? data.marketing_emails : settings.marketing_emails;
        settings.security_emails = true; // Toujours true
      }

      await settings.save();
      await settings.populate('user', 'name email role');
      return settings;
    } catch (err) {
      console.error('Erreur lors de la mise à jour des paramètres de notification :', err);
      throw err;
    }
  }
}

export default new NotificationSettingsService();