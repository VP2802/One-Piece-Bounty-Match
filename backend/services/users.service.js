const db = require("../db");
const { getRankFromPoints } = require("../rank");

function findUserProfileById(userId) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        u.id,
        u.player_name,
        u.faction,
        u.show_pvp_history,
        ls.highest_score,
        ls.highest_stage,
        ls.best_run_time_seconds,
        ls.total_single_runs,
        ls.total_pvp_matches,
        ls.total_pvp_wins,
        ls.ranking_points,
        ls.current_rank
      FROM users u
      LEFT JOIN leaderboard_stats ls ON u.id = ls.user_id
      WHERE u.id = ?
      LIMIT 1
    `;

    db.query(sql, [userId], (err, results) => {
      if (err) return reject(err);
      if (!results.length) return reject(new Error("User not found"));
      resolve(results[0]);
    });
  });
}

function buildUserProfilePayload(userRow) {
  return {
    id: userRow.id,
    player_name: userRow.player_name,
    faction: userRow.faction,
    highest_score: userRow.highest_score ?? 0,
    highest_stage: userRow.highest_stage ?? 1,
    best_run_time_seconds: userRow.best_run_time_seconds ?? 0,
    total_single_runs: userRow.total_single_runs ?? 0,
    total_pvp_matches: userRow.total_pvp_matches ?? 0,
    total_pvp_wins: userRow.total_pvp_wins ?? 0,
    ranking_points: userRow.ranking_points ?? 0,
    current_rank:
      userRow.current_rank ??
      getRankFromPoints(userRow.ranking_points ?? 0, userRow.faction),
    show_pvp_history: Boolean(userRow.show_pvp_history)
  };
}

async function getUserProfile(req, res) {
  const { userId } = req.params;

  try {
    const user = await findUserProfileById(userId);

    return res.json({
      profile: buildUserProfilePayload(user)
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(500).json({
      message: "Failed to fetch user profile",
      error: error.message
    });
  }
}

async function getUserPvpHistory(req, res) {
  const { userId } = req.params;
  const viewerId = Number(req.query.viewer_id || 0);

  try {
    const targetUser = await findUserProfileById(userId);
    const isOwner = Number(userId) === viewerId;
    const isPublic = Boolean(targetUser.show_pvp_history);

    if (!isOwner && !isPublic) {
      return res.status(403).json({
        message: "This player has hidden their PvP history."
      });
    }

    const sql = `
      SELECT
        pm.id,
        pm.random_mode,
        pm.match_result,
        pm.created_at,
        pm.player1_id,
        pm.player2_id,
        u1.player_name AS player1_name,
        u2.player_name AS player2_name,
        pm.player1_score,
        pm.player2_score,
        pm.player1_stage,
        pm.player2_stage,
        pm.player1_time_seconds,
        pm.player2_time_seconds,
        pm.player1_rank_points_change,
        pm.player2_rank_points_change,
        pm.winner_user_id
      FROM pvp_matches pm
      JOIN users u1 ON pm.player1_id = u1.id
      JOIN users u2 ON pm.player2_id = u2.id
      WHERE pm.player1_id = ? OR pm.player2_id = ?
      ORDER BY pm.id DESC
      LIMIT 20
    `;

    db.query(sql, [userId, userId], (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch PvP history",
          error: err.message
        });
      }

      const history = rows.map((row) => {
        const isPlayer1 = Number(row.player1_id) === Number(userId);

        const myScore = isPlayer1 ? row.player1_score : row.player2_score;
        const opponentScore = isPlayer1 ? row.player2_score : row.player1_score;

        const myStage = isPlayer1 ? row.player1_stage : row.player2_stage;
        const opponentStage = isPlayer1 ? row.player2_stage : row.player1_stage;

        const myTime = isPlayer1
          ? row.player1_time_seconds
          : row.player2_time_seconds;

        const opponentTime = isPlayer1
          ? row.player2_time_seconds
          : row.player1_time_seconds;

        const rankChange = isPlayer1
          ? row.player1_rank_points_change
          : row.player2_rank_points_change;

        const opponentName = isPlayer1 ? row.player2_name : row.player1_name;

        let resultLabel = "Draw";
        if (row.match_result !== "draw") {
          resultLabel =
            Number(row.winner_user_id) === Number(userId) ? "Win" : "Lose";
        }

        return {
          id: row.id,
          random_mode: row.random_mode,
          created_at: row.created_at,
          result: resultLabel,
          opponent_name: opponentName,
          my_score: myScore,
          opponent_score: opponentScore,
          my_stage: myStage,
          opponent_stage: opponentStage,
          my_time_seconds: myTime,
          opponent_time_seconds: opponentTime,
          rank_change: rankChange
        };
      });

      return res.json({ history });
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(500).json({
      message: "Failed to fetch PvP history",
      error: error.message
    });
  }
}

async function updateUserPvpHistoryVisibility(req, res) {
  const { userId } = req.params;
  const { show_pvp_history } = req.body;

  if (typeof show_pvp_history !== "boolean") {
    return res.status(400).json({
      message: "show_pvp_history must be boolean"
    });
  }

  try {
    await findUserProfileById(userId);

    const sql = `
      UPDATE users
      SET show_pvp_history = ?
      WHERE id = ?
    `;

    db.query(sql, [show_pvp_history ? 1 : 0, userId], (err) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to update PvP history visibility",
          error: err.message
        });
      }

      return res.json({
        message: "PvP history visibility updated successfully",
        show_pvp_history
      });
    });
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(500).json({
      message: "Failed to update PvP history visibility",
      error: error.message
    });
  }
}

function searchUsers(req, res) {
  const q = String(req.query.q || "").trim();

  if (q.length < 2) {
    return res.status(400).json({
      message: "Search query must be at least 2 characters"
    });
  }

  const sql = `
    SELECT
      u.id,
      u.player_name,
      u.faction,
      ls.highest_score,
      ls.ranking_points,
      ls.current_rank
    FROM users u
    LEFT JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE u.player_name LIKE ?
    ORDER BY
      ls.ranking_points DESC,
      ls.highest_score DESC,
      u.player_name ASC
    LIMIT 10
  `;

  db.query(sql, [`%${q}%`], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to search users",
        error: err.message
      });
    }

    return res.json({
      users: results.map((row) => ({
        id: row.id,
        player_name: row.player_name,
        faction: row.faction,
        highest_score: row.highest_score ?? 0,
        ranking_points: row.ranking_points ?? 0,
        current_rank:
          row.current_rank ??
          getRankFromPoints(row.ranking_points ?? 0, row.faction)
      }))
    });
  });
}

module.exports = {
  searchUsers,
  getUserProfile,
  getUserPvpHistory,
  updateUserPvpHistoryVisibility
};