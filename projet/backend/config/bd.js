const mysql = require("mysql2/promise"); // Use the promise-based version

const connection = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // Ensure this is correct
});

// Test the database connection
connection
  .getConnection()
  .then((conn) => {
    console.log("Connected to the database");
    
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err.stack);
  });


  
module.exports = connection;

