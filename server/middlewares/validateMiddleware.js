export const validateData = (schema) => {
    return (req, res, next) => {
        try {
            // se i dati sono validi, Zod li approva e si passa al controller
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            // se fallisce, restituisco un 400 Bad Request con i dettagli dell'errore
            return res.status(400).json({
                success: false,
                message: "Dati non validi",
                errors: error.errors.map(err => err.message)
            });
        }
    };
};