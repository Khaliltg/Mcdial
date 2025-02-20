const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,  // ✅ FIXED
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Vérification de la connexion pour les erreurs
db.getConnection()
    .then(connection => {
        console.log('✅ Connected to the MySQL database');
        connection.release(); // Libérez la connexion après la vérification
    })
    .catch(err => {
        console.error('❌ Error connecting to the database:', err);
        process.exit(1);
    });

module.exports = db;