//import mongoose library
const mongoose = require('mongoose')

//connecxion avec la BD
mongoose.connect('mongodb://127.0.0.1:27017/ecommerce')
    .then(
        ()=>{
            console.log('connected');
        }
    )
    .catch(
        (err)=>{
            console.log(err);
        }
    )

module.exports = mongoose;

