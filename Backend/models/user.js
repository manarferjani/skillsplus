const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    lastname: {
        type: String
    },
    age: {
        type: Number
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
