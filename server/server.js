const express = require('express');
const db = require('./config/db.js');
const authRoutes = require('./routes/authRoutes.js');

const app = express();

app.use(express.json());

app.use('/api/auth', authRoutes);


app.get('/', (req, res) => {
    res.json({
        message: "Express funziona"
    });
});

app.listen(3000, () => {
    console.log("Server running");
});

