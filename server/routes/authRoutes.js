const express = require('express');
const router = express.Router();
const registerUser = require('../controllers/authController');


router.post('/signup', (req,res)=>{
    console.log("SIGNUP ARRIVATO");
    res.json({
        ok:true
    });
});


module.exports = router;