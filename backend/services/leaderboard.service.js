const db = require("../db");

function getTop10(req, res) {
  const sql = `
    SELECT
      u.id,
      u.player_name,
      u.faction,
      ls.highest_score,
      ls.highest_stage,
      ls.best_run_time_seconds,
      ls.total_single_runs,
      ls.total_pvp_matches,
      ls.total_pvp_wins,
      ls.ranking_points,
      ls.current_rank
    FROM leaderboard_stats ls
    JOIN users u ON ls.user_id = u.id
    ORDER BY
      ls.ranking_points DESC,
      ls.total_pvp_wins DESC,
      ls.highest_score DESC,
      ls.highest_stage DESC,
      ls.best_run_time_seconds ASC
    LIMIT 10
  `;

  db.query(sql, (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch top 10 leaderboard",
        error: err.message
      });
    }

    res.json(results);
  });
}

module.exports = {
  getTop10
};
