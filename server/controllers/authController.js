const db = require('../db');
const bcrypt = require('bcrypt');


const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // Controllo se esiste già
        const [users] = await db.query(
            `
            SELECT * FROM Users
            WHERE email = ? OR username = ?
            `,
            [email, username]
        );


        if (users.length > 0) {
            return res.status(400).json({
                error: "Username o email già utilizzati"
            });
        }


        // Creo hash password
        const password_hash = await bcrypt.hash(password, 10);


        // Inserisco utente
        const [result] = await db.query(
            `
            INSERT INTO Users
            (username, email, password_hash)
            VALUES (?, ?, ?)
            `,
            [
                username,
                email,
                password_hash
            ]
        );


        res.json({
            message: "Registrazione completata",
            userId: result.insertId
        });


    } catch(error) {

        console.error(error);

        res.status(500).json({
            error: "Errore server"
        });

    }
};


module.exports = {
    registerUser
};