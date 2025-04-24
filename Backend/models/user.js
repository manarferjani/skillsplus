import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: Number,
        enum: [1, 2, 3], // 1=admin, 2=manager, 3=collaborator
        default: 3 // default to collaborator
    },
    clerkId: {
        type: String,
        sparse: true
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordExpires: {
        type: Date
    },
    
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    const user = this;
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 10);
    }
    next();
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Helper method to get role name from role number
userSchema.methods.getRoleName = function() {
    const roleMap = {
        1: 'admin',
        2: 'manager',
        3: 'collaborator'
    };
    return roleMap[this.role] || 'unknown';
};

const User = mongoose.model('User', userSchema);

export default User;
