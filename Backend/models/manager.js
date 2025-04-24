// models/Manager.js
import mongoose from 'mongoose';
import User from './models/user.js';
const { Schema } = mongoose;

const managerSchema = new Schema({
    testsCreated: [{
        testId: { type: Schema.Types.ObjectId, ref: 'Test' },
        createdAt: { type: Date, default: Date.now }
    }],
    
    
});

module.exports = User.discriminator('Manager', managerSchema);
