import { pool } from '../config/db.js'; // Connection Pool mySQL
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // jwt
import { registerSchema, loginSchema } from '../schemas/auth.schema.js';
import dotenv from 'dotenv';

// registrazione utente
export const registerUser = async (req, res, next) => {
  try {
    // 1 validazione con Zod
    const { username, email, password } = registerSchema.parse(req.body);

    // 2 controllo Esistenza Utente
    const [existingUsers] = await pool.execute(
      'SELECT id FROM Users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({ 
        code: "USER_ALREADY_EXISTS",
        message: "Email o username già registrati" 
      });
    }

    // 3 hashing della password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4 persistence nel Database
    const [result] = await pool.execute(
      'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // 5 risposta formattata in modo consistente
    return res.status(201).json({
      success: true,
      message: "Utente registrato con successo",
      data: {
        userId: result.insertId,
        username,
        email
      }
    });

  } catch (error) {
    console.error("Errore durante la registrazione:", error); // ///// -------
    next(error);
  }
};

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

// 4 accesso utente (Login)
export const loginUser = async (req, res, next) => {
  try {
    // validazione input con Zod
    const { email, password } = loginSchema.parse(req.body);

    // cerco l'utente nel DB
    const [rows] = await pool.execute(
      'SELECT id, username, email, password_hash, fcm_token, notifications_enabled FROM Users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "Credenziali non valide"
      });
    }

    const user = rows[0];

    // confronta la password inviata con l'hash salvato
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        code: "INVALID_CREDENTIALS",
        message: "Credenziali non valide"
      });
    }

    // genera il Token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // imposto il cookie HTTP-Only per la massima sicurezza
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 giorni
    });

    return res.status(200).json({
      success: true,
      message: "Login effettuato con successo",
      token, // opzionale se si salva in memoria su React
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        fcmToken: user.fcm_token,
        notificationsEnabled: Boolean(user.notifications_enabled)
      }
    });

  } catch (error) {
    next(error);
  }
};

// 5 logout utente
export const logoutUser = async (req, res) => {
  // pulisce il cookie contenente il JWT
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  return res.status(200).json({
    success: true,
    message: "Logout effettuato con successo"
  });
};