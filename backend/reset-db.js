const db = require("./db");

const tables = [
  "match_invites",
  "friend_requests",
  "pvp_matches",
  "bot_matches",
  "leaderboard_stats",
  "users"
];

(async () => {
  try {
    await db.promise().query("SET FOREIGN_KEY_CHECKS = 0");
    for (const table of tables) {
      await db.promise().query(`DELETE FROM ${table}`);
      console.log(`Cleared table: ${table}`);
    }
    await db.promise().query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("✅ All user data deleted. Database is fresh.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset failed:", err.message);
    process.exit(1);
  }
})();