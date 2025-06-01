import mongoose from 'mongoose';

const sidebarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // 1 seul sidebar par user
  },
  selectedItems: {
    type: [String],
    default: [],
  }
}, { timestamps: true });

const Sidebar = mongoose.model('Sidebar', sidebarSchema);
export default Sidebar;
