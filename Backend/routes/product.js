//importation du express
const express = require('express');
//importation du model
const Product = require('../models/product');
//création du router
const router = express.Router();

router.post('/addprod', async(req,res)=>{
    
    try {
        
        product = new Product(req.body);

        savedProduct = await product.save();

        res.status(200).send(savedProduct);
        
    } catch (error) {
        res.status(400).send(error);
    }
        
});

router.get('/getallprod', async(req,res)=>{

    try {
        products = await Product.find();

        res.status(200).send(products);

    } catch (error) {

        res.status(400).send(error);
        
    }
})

router.get('/allprod', async(req,res)=>{

    try {
        products = await Product.find({ name:"elvive_shampoo" });

        res.status(200).send(products);

    } catch (error) {

        res.status(400).send(error);
        
    }
})

router.get('/findbyidprod/:id', async(req,res)=>{

    try {
        v_id = req.params.id;
        prod = await Product.findById({_id :v_id});
        res.status(200).send(prod);

    } catch (error) {

        res.status(400).send(error);
        
    }
})

router.put('/updateprod/:id', async(req,res)=>{

    try {
        v_id = req.params.id;
        newdata = req.body;

        updated = await Product.findByIdAndUpdate({_id : v_id} , newdata);
        res.status(200).send(updated);
        
    } catch (error) {

        res.status(400).send(error);

    }
})

router.delete('/deleteprod/:id' , async(req,res)=>{

    try {

        v_id = req.params.id;
        removed = await Product.findByIdAndDelete({_id : v_id});
        res.status(200).send(removed);

    } catch (error) {
        res.status(400).send(error);
        
    }


});





module.exports = router;