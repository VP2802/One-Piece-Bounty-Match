const mysql = require("mysql2");

const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "onepiece_db"
};

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL connection error:");
    console.error("   Host:", dbConfig.host);
    console.error("   Port:", dbConfig.port);
    console.error("   User:", dbConfig.user);
    console.error("   Database:", dbConfig.database);
    console.error("   Error details:", err.message);
    return;
  }
  console.log("✅ Connected to Railway MySQL successfully!");
});

module.exports = db;