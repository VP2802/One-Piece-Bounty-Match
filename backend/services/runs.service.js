const db = require("../db");

function saveRun(req, res) {
  const { user_id, score, stage, run_time_seconds } = req.body;

  if (!user_id || score == null || stage == null || run_time_seconds == null) {
    return res.status(400).json({
      message: "Missing run data"
    });
  }

  const getUserSql = `
    SELECT u.id, u.faction, ls.*
    FROM users u
    JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE u.id = ?
  `;

  db.query(getUserSql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch user stats",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const current = results[0];

    const newHighestScore = Math.max(current.highest_score, score);
    const newHighestStage = Math.max(current.highest_stage, stage);

    let newBestRunTime = current.best_run_time_seconds;
    if (
      current.best_run_time_seconds === 0 ||
      run_time_seconds < current.best_run_time_seconds
    ) {
      newBestRunTime = run_time_seconds;
    }

    const updateSql = `
      UPDATE leaderboard_stats
      SET
        highest_score = ?,
        highest_stage = ?,
        best_run_time_seconds = ?,
        total_single_runs = total_single_runs + 1
      WHERE user_id = ?
    `;

    db.query(
      updateSql,
      [newHighestScore, newHighestStage, newBestRunTime, user_id],
      (updateErr) => {
        if (updateErr) {
          return res.status(500).json({
            message: "Failed to update single run",
            error: updateErr.message
          });
        }

        return res.json({
          message: "Single run saved successfully",
          highest_score: newHighestScore,
          highest_stage: newHighestStage,
          best_run_time_seconds: newBestRunTime
        });
      }
    );
  });
}

module.exports = {
  saveRun
};
