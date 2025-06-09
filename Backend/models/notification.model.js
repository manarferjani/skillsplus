import mongoose from 'mongoose';

const notificationSettingsSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['all', 'mentions', 'none'],
    required: true,
    default: 'none',
  },
  mobile: {
    type: Boolean,
    default: false,
  },
  communication_emails: {
    type: Boolean,
    default: false,
  },
  social_emails: {
    type: Boolean,
    default: true,
  },
  marketing_emails: {
    type: Boolean,
    default: false,
  },
  security_emails: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const NotificationSettings = mongoose.model('NotificationSettings', notificationSettingsSchema);
export default NotificationSettings;