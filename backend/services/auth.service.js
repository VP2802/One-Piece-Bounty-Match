const db = require("../db");
const { getRankFromPoints } = require("../rank");
const { normalizeAuthBody } = require("../utils/auth.utils");
const { findUserWithStatsByName, buildUserPayload } = require("../utils/user.utils");

function signUp(req, res) {
  const normalized = normalizeAuthBody(req, res);
  if (!normalized) return;

  const { player_name, faction } = normalized;

  findUserWithStatsByName(player_name, (findErr, foundUsers) => {
    if (findErr) {
      return res.status(500).json({
        message: "Failed to check user",
        error: findErr.message
      });
    }

    if (foundUsers.length > 0) {
      const existingUser = foundUsers[0];

      if (existingUser.faction !== faction) {
        return res.status(409).json({
          message: "This player name already exists in another faction",
          existing_faction: existingUser.faction
        });
      }

      return res.status(409).json({
        message: "This player name already exists. Please sign in instead."
      });
    }

    const defaultRank = getRankFromPoints(0, faction);

    const insertUserSql = `
      INSERT INTO users (player_name, faction)
      VALUES (?, ?)
    `;

    db.query(insertUserSql, [player_name, faction], (insertErr, insertResult) => {
      if (insertErr) {
        return res.status(500).json({
          message: "Failed to create user",
          error: insertErr.message
        });
      }

      const userId = insertResult.insertId;

      const insertStatsSql = `
        INSERT INTO leaderboard_stats (
          user_id,
          highest_score,
          highest_stage,
          best_run_time_seconds,
          total_single_runs,
          total_pvp_matches,
          total_pvp_wins,
          ranking_points,
          current_rank
        )
        VALUES (?, 0, 1, 0, 0, 0, 0, 0, ?)
      `;

      db.query(insertStatsSql, [userId, defaultRank], (statsErr) => {
        if (statsErr) {
          return res.status(500).json({
            message: "User was created but failed to initialize stats",
            error: statsErr.message
          });
        }

        return res.status(201).json({
          message: "Sign up successful",
          user: {
            id: userId,
            player_name,
            faction,
            highest_score: 0,
            highest_stage: 1,
            best_run_time_seconds: 0,
            total_single_runs: 0,
            total_pvp_matches: 0,
            total_pvp_wins: 0,
            ranking_points: 0,
            current_rank: defaultRank
          }
        });
      });
    });
  });
}

function signIn(req, res) {
  const normalized = normalizeAuthBody(req, res);
  if (!normalized) return;

  const { player_name, faction } = normalized;

  findUserWithStatsByName(player_name, (findErr, foundUsers) => {
    if (findErr) {
      return res.status(500).json({
        message: "Failed to check user",
        error: findErr.message
      });
    }

    if (foundUsers.length === 0) {
      return res.status(404).json({
        message: "User does not exist. Please sign up first."
      });
    }

    const existingUser = foundUsers[0];

    if (existingUser.faction !== faction) {
      return res.status(409).json({
        message: "Faction does not match this account",
        existing_faction: existingUser.faction
      });
    }

    return res.status(200).json({
      message: "Sign in successful",
      user: buildUserPayload(existingUser)
    });
  });
}

module.exports = {
  signUp,
  signIn
};
