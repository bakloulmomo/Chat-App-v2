import { z } from 'zod';

export const sendMessageSchema = z.object({
    message_text: z.string({
        required_error: "Il testo del messaggio è obbligatorio",
        invalid_type_error: "Il messaggio deve essere una stringa testuale",
    })
    .trim() // rimuove gli spazi vuoti all'inizio e alla fine
    .min(1, "Il messaggio non può essere vuoto")
    .max(2000, "Il messaggio è troppo lungo (massimo 2000 caratteri)")
});