// models/Admin.js
import mongoose from 'mongoose';
import User from '../models/user.js';
const { Schema } = mongoose;

const adminSchema = new Schema({
    managedRoles: [{
        type: Number,
        enum: [1, 2, 3]  // On peut ainsi préciser quels rôles cet admin gère
    }],
    testsCreated: [{
        testId: { type: Schema.Types.ObjectId, ref: 'Test' },
        createdAt: { type: Date, default: Date.now }
    }],
});

module.exports = User.discriminator('Admin', adminSchema);
