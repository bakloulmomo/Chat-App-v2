import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js'; 
import userRoutes from './routes/userRoutes.js';
import conversationRoutes from './routes/conversationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

dotenv.config(); // carica le variabili dal file .env

const app = express();

app.use(express.json());
app.use(cookieParser()); // middleware per leggere i cookie nelle req protette


// per fase di test, per non bloccare le richieste tra front e backend su porte diverse
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true // permette al frontend di inviare e ricevere il cookie JWT
}));

// registrazione delle rotte
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/messages', messageRoutes);


app.get('/', (req, res) => {
    res.json({
        message: "Express funziona"
    });
});

// middleware globale per la gestione degli errori
app.use((err, req, res, next) => {
  console.error(err);

  // intercetta gli errori di validazione di Zod
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      code: "VALIDATION_ERROR",
      message: "Dati non validi",
      errors: err.errors.map(e => ({ field: e.path[0], message: e.message }))
    });
  }

  // errore generico di fallback
  return res.status(500).json({
    success: false,
    message: "Internal server error"
  });
});




app.listen(3000, () => {
    console.log("server running on port 3000");
});