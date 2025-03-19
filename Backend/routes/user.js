const express = require('express');

const User = require('../models/user.js'); // Respecte la casse

const router = express.Router();


router.post('/add', (req , res)=>{

    data = req.body;

    usr = new User(data);

    usr.save()
        .then(
            (savedUser)=>{
                res.send(savedUser)
            }
        )
        .catch(
            (err)=>{
                res.send(err)
            }
        )

    //res.status(200).send({message : "user added"})
});

router.post('/create', async(req , res)=>{

    try {
        data = req.body;
        usr = new User(data);

        savedUser = await usr.save();

        res.send(savedUser)

    } catch (error) {
        res.send(error)
    }

})

router.get('/getall', (req,res)=>{

    User.find()
        .then(
            (users)=>{
                res.send(users);
            }
        )
        .catch(
            (err)=>{
                res.send(err)
            }
        )

});

router.get('/all', async(req , res)=>{

    try {
        users = await User.find({age : 21 });
        res.send(users);

    } catch (error) {
        res.send(error)
        
    }
})

router.get('/getbyid/:id' , (req, res)=>{

    myid = req.params.id;

    User.findOne({ _id: myid })
        .then(
            (user)=>{
                res.send(user)
            }
        )
        .catch(
            (err)=>{
                res.send(err)
            }
        )
})

router.get('/findbyid/:id', async(req , res)=>{

    try {
        myid = req.params.id;
        user = await User.findOne({_id : myid });
        res.send(user);
        
    } catch (error) {
        res.send(error)
        
    }

})


router.put('/update/:id',  (req,res)=>{

    v_id = req.params.id;

    new_data = req.body;

    User.findByIdAndUpdate({_id:v_id} , new_data )
        .then(
            (updated)=>{
                res.send(updated)
            }
        )
        .catch(
            (err)=>{
                res.send(err)
            }
        )
    

    //res.status(200).send({message : "success_put"})

});

router.put('/maj/:id', async(req,res)=>{

    try {
        v_id = req.params.id;
        new_data = req.body;

        updated = await User.findOneAndUpdate({_id : v_id} , new_data);
        res.send(updated)

    } catch (error) {
        res.send(error);
    }
})

router.delete('/delete/:id', (req,res)=>{

    id = req.params.id;

    User.findOneAndDelete({_id:id })
        .then(
            (deletedUser)=>{
                res.send(deletedUser)
            }
        )
        .catch(
            (err)=>{
                res.send
            }
        )

    
    
});

router.delete('/delete/:id' , async(req,res)=>{

    try {
        id=req.params.id
        deletedUser=await User.findOneAndRemove({_id:id})
        res.send(deletedUser)
    } catch (error) {
        res.send(error)
        
    }
})


module.exports = router;