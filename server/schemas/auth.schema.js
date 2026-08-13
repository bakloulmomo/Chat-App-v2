import { z } from 'zod';

// schema per la registrazione
export const registerSchema = z.object({
  username: z
    .string({ required_error: "Username obbligatorio" })
    .min(3, "Lo username deve avere almeno 3 caratteri")
    .max(30, "Lo username può avere al massimo 30 caratteri")
    .trim(),
  
  email: z
    .string({ required_error: "Email obbligatoria" })
    .email("Formato email non valido")
    .toLowerCase()
    .trim(),
  
  password: z
    .string({ required_error: "Password obbligatoria" })
    .min(8, "La password deve contenere almeno 8 caratteri")
    // per forzare password:
    // .regex(/[A-Z]/, "Deve contenere una lettera maiuscola")
    .regex(/[0-9]/, "Deve contenere un numero")
});

// schema per il login
export const loginSchema = z.object({
  email: z
    .string({ required_error: "Email obbligatoria" })
    .email("Formato email non valido")
    .toLowerCase()
    .trim(),
    
  password: z
    .string({ required_error: "Password obbligatoria" })
    .min(1, "Inserisci la password") // al login basta verificare che non sia vuota
});