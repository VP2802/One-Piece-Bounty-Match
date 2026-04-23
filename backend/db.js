const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "onepiece_db"
});

db.connect((err) => {
  if (err) {
    console.error("MySQL connection error:", err.message);
    return;
  }
  console.log("Connected to Railway MySQL successfully!");
});

module.exports = db;