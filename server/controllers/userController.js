import { pool } from '../config/db.js';

export const searchUsers = async (req, res, next) => {
    try {
        // req.user viene popolato dal middleware authenticateToken
        const currentUserId = req.user.id; 
        
        // il termine di ricerca arriverà dall'URL, es: /api/users/search?q=momo
        const searchQuery = req.query.q;

        // se l'utente non digita nulla, restituiamo un array vuoto senza interrogare il DB
        if (!searchQuery) {
            return res.status(200).json({
                success: true,
                data: []
            });
        }

        // cerco utenti il cui username o email contenga la stringa cercata
        // escludo l'utente che sta facendo la ricerca (id != ?)
        const [users] = await pool.execute(
            `SELECT id, username, email 
             FROM Users 
             WHERE (username LIKE ? OR email LIKE ?) 
             AND id != ?
             LIMIT 20`,
            [`%${searchQuery}%`, `%${searchQuery}%`, currentUserId]
        );

        return res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        console.error("Errore durante la ricerca utenti:", error);
        next(error); // passo l'errore al middleware globale in server.js
    }
};