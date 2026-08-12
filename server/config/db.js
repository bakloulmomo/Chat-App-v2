import mysql from 'mysql2/promise';
import 'dotenv/config';

// 1 Creazione Connection Pool 
export const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  

  waitForConnections: true,  //mette in coda le query se tutte le connessioni sono occupate
  connectionLimit: 10,       // max connessioni aperte contemporaneamente
  queueLimit: 0              // = coda illimitata per le richieste in attesa
});

// 2  per testare la connessione all avvio server
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('connessione al database ok');
    connection.release(); // Rilascia connessione 
  } catch (error) {
    console.error('errore di connessione al database', error.message);
  }
};