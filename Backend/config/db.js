//import mongoose library
const mongoose = require('mongoose')
const dotenv = require('dotenv')

dotenv.config()

const connectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, connectionOptions)
    .then(() => {
        console.log('Connected to MongoDB successfully')
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err)
    })

module.exports = mongoose;

