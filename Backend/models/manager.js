// models/Manager.js
import mongoose from 'mongoose';
import User from './user.js';
const { Schema } = mongoose;

const managerSchema = new Schema({
    testsCreated: [{
        testId: { type: Schema.Types.ObjectId, ref: 'Test' },
        createdAt: { type: Date, default: Date.now }
    }],
    
    
});

export default User.discriminator('Manager', managerSchema);

