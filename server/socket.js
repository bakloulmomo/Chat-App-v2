import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';

let io;

export const initSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173', // porta frontend
            credentials: true // permette l'invio automatico dei cookie HttpOnly
        }
    });

    // 1 MIDDLEWARE DI AUTENTICAZIONE SOCKET
    // viene eseguito ogni volta che un client tenta di connettersi via WebSocket
    io.use((socket, next) => {
        try {
            const rawCookies = socket.handshake.headers.cookie;

            if (!rawCookies) {
                return next(new Error("Autenticazione Socket fallita: nessun cookie presente"));
            }

            // estraggo il cookie "token"
            const parsedCookies = cookie.parse(rawCookies);
            const token = parsedCookies.token; // verifico se il nome del cookie coincide con quello usato al login

            if (!token) {
                return next(new Error("Autenticazione Socket fallita: token mancante"));
            }

            // verifico la validità del token JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // salvo i dati dell'utente direttamente nello pspazio socket dell'utente
            socket.user = decoded; 
            next();
        } catch (error) {
            console.error("Errore auth Socket:", error.message);
            return next(new Error("Autenticazione Socket fallita: token non valido"));
        }
    });

    // 2 GESTIONE EVENTI WEBSOCKET
    io.on('connection', (socket) => {
        console.log('WebSocket connesso: Utente ${socket.user.username} (ID: ${socket.user.id})');

        // l'utente entra in una "stanza" specifica per una conversazione (es conversation_12)
        socket.on('join_conversation', (conversationId) => {
            const roomName = `conversation_${conversationId}`;
            socket.join(roomName);
            console.log(`Utente ${socket.user.username} entrato nella stanza ${roomName}`);
        });

        // l'utente esce dalla stanza della conversazione
        socket.on('leave_conversation', (conversationId) => {
            const roomName = `conversation_${conversationId}`;
            socket.leave(roomName);
            console.log(`Utente ${socket.user.username} uscito dalla stanza ${roomName}`);
        });

        // evento quando l'utente sta digitando, per UX (come sta scrivendo su whatsapp)
        socket.on('typing', ({ conversationId, isTyping }) => {
            socket.to(`conversation_${conversationId}`).emit('user_typing', {
                userId: socket.user.id,
                username: socket.user.username,
                isTyping
            });
        });

        // Disconnessione del client
        socket.on('disconnect', () => {
            console.log('Utente disconnesso dal WebSocket: ${socket.user.username}');
        });
    });

    return io;
};

// funzione helper per accedere all'istanza 'io' ovunque nel backend
export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io non è stato ancora inizializzato");
    }
    return io;
};