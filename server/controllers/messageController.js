import { pool } from '../config/db.js';

// 1 invia un nuovo messaggio in una conversazione
export const sendMessage = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const { conversationId } = req.params;
        const { message_text } = req.body;

        // validazione base
        if (!message_text || message_text.trim() === '') {
            return res.status(400).json({ success: false, message: "Il testo del messaggio non può essere vuoto." });
        }

        // sicurezza, verifica se l'utente sia un membro della conversazione
        const [membership] = await pool.execute(
            `SELECT id FROM ConversationMembers WHERE conversation_id = ? AND user_id = ?`,
            [conversationId, currentUserId]
        );

        if (membership.length === 0) {
            return res.status(403).json({ success: false, message: "Non hai i permessi per inviare messaggi in questa chat." });
        }

        // inserimento del messaggio nel database
        const [result] = await pool.execute(
            `INSERT INTO Messages (conversation_id, sender_id, message_text, status) 
             VALUES (?, ?, ?, 'sent')`,
            [conversationId, currentUserId, message_text]
        );

        return res.status(201).json({
            success: true,
            data: {
                id: result.insertId,
                conversation_id: conversationId,
                sender_id: currentUserId,
                message_text: message_text,
                status: 'sent',
                created_at: new Date()
            }
        });
    } catch (error) {
        console.error("Errore nell'invio del messaggio:", error);
        next(error);
    }
};

// 2 recupera la cronologia dei messaggi di una chat
export const getMessagesByConversation = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;
        const { conversationId } = req.params;

        // sicurezza, verifica l'appartenenza prima di mostrare la cronologia
        const [membership] = await pool.execute(
            `SELECT id FROM ConversationMembers WHERE conversation_id = ? AND user_id = ?`,
            [conversationId, currentUserId]
        );

        if (membership.length === 0) {
            return res.status(403).json({ success: false, message: "Accesso negato a questa conversazione." });
        }

        // recuperia i messaggi in ordine (dal più vecchio al più recente)
        const [messages] = await pool.execute(
            `SELECT id, sender_id, message_text, status, created_at, edited_at 
             FROM Messages 
             WHERE conversation_id = ? 
             ORDER BY created_at ASC`,
            [conversationId]
        );

        return res.status(200).json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error("Errore nel recupero dei messaggi:", error);
        next(error);
    }
};