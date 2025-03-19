const express = require('express');
require('./config/connect');

const app = express();
app.use(express.json());

const productRoute = require('./routes/product');
const userRoute = require('./routes/user');

//https://127.0.0.1:3000/user/add

app.use('/product',productRoute );
app.use('/user',userRoute );


app.listen( 5000 , ()=>{

    console.log('server works')
    

});




