import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

export const authenticateToken = (req, res, next) => {
    // 1 recupera il token dal cookie (impostato in loginUser)
    const token = req.cookies.token;

    // 2 se non c'è il token, l'utente non è loggato
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Accesso negato. Nessun token fornito, effettua il login."
        });
    }

    try {
        // 3 verifica la firma e la validità del token usando il tuo segreto
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4 salva il payload (id e username) nell'oggetto req per i controller successivi
        req.user = decoded;
        
        // 5 passo il controllo al controller (es checkAuth)
        next();
    } catch (error) {
        // se il token è scaduto o ha una firma errata (manipolato)
        return res.status(401).json({
            success: false,
            message: "Sessione scaduta o token non valido. Effettua nuovamente il login."
        });
    }
};