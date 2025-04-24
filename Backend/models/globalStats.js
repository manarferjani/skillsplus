// models/GlobalStats.ts
import mongoose from 'mongoose';

const globalStatsSchema = new mongoose.Schema({
    type: { 
      type: String, 
      required: true, 
      unique: true 
    },
    value: { 
      type: [mongoose.Schema.Types.Mixed], // tableau pour stocker plusieurs performers
      required: true
    },
    updatedAt: { 
      type: Date, 
      default: Date.now 
    },
  });
  
export default mongoose.model('GlobalStats', globalStatsSchema);
  