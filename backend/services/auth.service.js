const db = require("../db");
const bcrypt = require("bcryptjs");
const { getRankFromPoints } = require("../rank");
const { normalizeAuthBody } = require("../utils/auth.utils");
const { findUserWithStatsByName, buildUserPayload } = require("../utils/user.utils");

function signUp(req, res) {
  const normalized = normalizeAuthBody(req, res);
  if (!normalized) return;

  const { player_name, faction, password, confirm_password } = normalized;

  if (!confirm_password) {
    return res.status(400).json({ message: "Please confirm your password" });
  }

  if (password !== confirm_password) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

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

    // Hash the password
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        return res.status(500).json({
          message: "Failed to encrypt password",
          error: hashErr.message
        });
      }

      const defaultRank = getRankFromPoints(0, faction);

      const insertUserSql = `
        INSERT INTO users (player_name, faction, password_hash)
        VALUES (?, ?, ?)
      `;

      db.query(insertUserSql, [player_name, faction, hashedPassword], (insertErr, insertResult) => {
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
            message: "Sign up successful! Please sign in with your new account.",
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
  });
}

function signIn(req, res) {
  const normalized = normalizeAuthBody(req, res);
  if (!normalized) return;

  const { player_name, faction, password } = normalized;

  const sql = `
    SELECT
      u.id,
      u.player_name,
      u.faction,
      u.password_hash,
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
    WHERE u.player_name = ?
    LIMIT 1
  `;

  db.query(sql, [player_name], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to check user",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "User does not exist. Please sign up first."
      });
    }

    const user = results[0];

    if (!user.password_hash) {
      return res.status(401).json({
        message: "Account needs password reset. Please contact support."
      });
    }

    bcrypt.compare(password, user.password_hash, (compareErr, isMatch) => {
      if (compareErr) {
        return res.status(500).json({
          message: "Authentication error",
          error: compareErr.message
        });
      }

      if (!isMatch) {
        return res.status(401).json({
          message: "Incorrect password. Please try again."
        });
      }

      return res.status(200).json({
        message: `Welcome back, ${user.player_name}!`,
        user: buildUserPayload(user)
      });
    });
  });
}

module.exports = {
  signUp,
  signIn
};