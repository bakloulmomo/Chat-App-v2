import { pool } from '../config/db.js'; // Connection Pool mySQL

// 1 recupero le informazioni profilate dell'utente loggato
export const getUserInfo = async (req, res) => {
    try {
        // req.user dal middleware di autenticazione JWT
        const [rows] = await pool.execute(
            'SELECT id, username, email, created_at, fcm_token, notifications_enabled FROM Users WHERE id = ?',
            [req.user.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Utente non trovato" });
        }

        const user = rows[0];

        // Mappatura dei dati da snake_case a camelCase per React Frontend (nel senso così: da ciao_babbo a CiaoBabbo)
        const secureUserInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.created_at,
            fcmToken: user.fcm_token,
            notificationsEnabled: Boolean(user.notifications_enabled)
        };

        return res.status(200).json(secureUserInfo);
    } catch (error) {
        return res.status(500).json({ message: "Errore durante il recupero profilo", error: error.message });
    }
};

// 2 aggiorno il token FCM per le notifiche push
export const updateFcmToken = async (req, res) => {
    const { fcmToken } = req.body;

    if (!fcmToken) {
        return res.status(400).json({ message: "fcmToken richiesto" });
    }

    try {
        await pool.execute(
            'UPDATE Users SET fcm_token = ? WHERE id = ?',
            [fcmToken, req.user.id]
        );

        return res.status(200).json({ 
            message: "Token FCM aggiornato con successo",
            fcmToken 
        });
    } catch (error) {
        return res.status(500).json({ message: "Errore durante l'aggiornamento del token FCM", error: error.message });
    }
};

// 3 verifico se il token JWT in arrivo dal frontend è ancora valido
export const checkAuth = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Token mancante o non valido, effettua nuovamente il login" });
    }

    // Ricostruisco le info leggendo l'utente validato dal middleware JWT
    return getUserInfo(req, res);
};