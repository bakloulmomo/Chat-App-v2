import { pool } from '../config/db.js';

// 1 crea una nuova chat diretta o restituisce quella esistente
export const createOrGetDirectConversation = async (req, res, next) => {
    const currentUserId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
        return res.status(400).json({ success: false, message: "ID dell'utente destinatario mancante" });
    }

    if (currentUserId === targetUserId) {
        return res.status(400).json({ success: false, message: "Non puoi creare una chat con te stesso" });
    }

    // richiedo una connessione specifica dal pool per gestire la transazione
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Step 1: controllo se esiste già una chat 'direct' tra questi due utenti
        const [existing] = await connection.execute(
            `SELECT c.id 
             FROM Conversations c
             JOIN ConversationMembers cm1 ON c.id = cm1.conversation_id
             JOIN ConversationMembers cm2 ON c.id = cm2.conversation_id
             WHERE c.type = 'direct' 
               AND cm1.user_id = ? 
               AND cm2.user_id = ?`,
            [currentUserId, targetUserId]
        );

        // Se esiste, annullo la transazione (non serve) e restituisco l'id della chat esistente
        if (existing.length > 0) {
            await connection.rollback();
            connection.release();
            return res.status(200).json({ 
                success: true, 
                data: { conversationId: existing[0].id, isNew: false } 
            });
        }

        // Step 2: se non esiste, crea la riga in Conversations
        const [convResult] = await connection.execute(
            `INSERT INTO Conversations (type, created_by) VALUES ('direct', ?)`,
            [currentUserId]
        );
        
        const newConversationId = convResult.insertId;

        // Step 3: aggiungi i due utenti alla tabella ConversationMembers
        await connection.execute(
            `INSERT INTO ConversationMembers (conversation_id, user_id, role) VALUES (?, ?, 'member')`,
            [newConversationId, currentUserId]
        );
        
        await connection.execute(
            `INSERT INTO ConversationMembers (conversation_id, user_id, role) VALUES (?, ?, 'member')`,
            [newConversationId, targetUserId]
        );

        // Step 4: conferma tutte le operazioni
        await connection.commit();
        
        return res.status(201).json({ 
            success: true, 
            data: { conversationId: newConversationId, isNew: true } 
        });

    } catch (error) {
        // se qualcosa va storto, annulla tutte le modifiche fatte nel DB
        await connection.rollback();
        console.error("Errore nella creazione della conversazione:", error);
        next(error);
    } finally {
        // rilascia sempre la connessione al pool, sia in caso di successo che di errore
        connection.release();
    }
};

// 2 recupero tutte le chat in cui l'utente loggato è presente
export const getMyConversations = async (req, res, next) => {
    try {
        const currentUserId = req.user.id;

        // faccio una JOIN per ottenere l'ID della chat e i dati dell'altro utente
        const [conversations] = await pool.execute(
            `SELECT 
                c.id as conversation_id, 
                c.created_at, 
                u.id as other_user_id, 
                u.username as other_username
             FROM Conversations c
             JOIN ConversationMembers cm1 ON c.id = cm1.conversation_id
             JOIN ConversationMembers cm2 ON c.id = cm2.conversation_id AND cm1.user_id != cm2.user_id
             JOIN Users u ON cm2.user_id = u.id
             WHERE cm1.user_id = ? AND c.type = 'direct'
             ORDER BY c.created_at DESC`,
            [currentUserId]
        );

        return res.status(200).json({ 
            success: true, 
            data: conversations 
        });
        
    } catch (error) {
        console.error("Errore nel recupero delle conversazioni:", error);
        next(error);
    }
};