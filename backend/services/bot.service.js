const db = require("../db");
const { getRankFromPoints } = require("../rank");
const { generateBotPracticeResult } = require("../utils/pvp.utils");
const { saveBotPracticeMatch } = require("./match-save.service");

function createMatch(req, res) {
  const user_id = req.userId;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  const getUserSql = `
    SELECT
      u.id,
      u.player_name,
      u.faction,
      ls.ranking_points,
      ls.current_rank
    FROM users u
    JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE u.id = ?
    LIMIT 1
  `;

  db.query(getUserSql, [user_id], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch user information",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const currentUser = results[0];
    const roomModes = ["hard", "insane", "impossible"];
    const random_mode = roomModes[Math.floor(Math.random() * roomModes.length)];

    const botNames = [
      "ZoroGhost",
      "Aokiji",
      "RedHawk",
      "SeaWolf",
      "WhiteStorm",
      "AkainuBot",
      "Lawless",
      "MihawkEye"
    ];

    const opponentName = botNames[Math.floor(Math.random() * botNames.length)];
    const opponentFaction = Math.random() < 0.5 ? "pirate" : "marine";
    const opponentPoints = Math.floor(Math.random() * 2200);

    const botPracticeResult = generateBotPracticeResult(random_mode);

    const botMatchPayload = {
      match_id: `bot_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      random_mode,
      player: {
        id: currentUser.id,
        player_name: currentUser.player_name,
        faction: currentUser.faction,
        ranking_points: currentUser.ranking_points ?? 0,
        current_rank:
          currentUser.current_rank ??
          getRankFromPoints(currentUser.ranking_points ?? 0, currentUser.faction)
      },
      opponent_preview: {
        id: 0,
        player_name: opponentName,
        faction: opponentFaction,
        ranking_points: opponentPoints,
        current_rank: getRankFromPoints(opponentPoints, opponentFaction),
        is_bot: true
      },
      bot_profile: {
        bot_name: opponentName,
        bot_faction: opponentFaction,
        bot_points: opponentPoints,
        final_score: botPracticeResult.score,
        final_stage: botPracticeResult.stage,
        final_time_seconds: botPracticeResult.time_seconds
      }
    };

    return res.status(201).json({
      message: "Bot practice match created successfully",
      match: botMatchPayload
    });
  });
}

function submitMatch(req, res) {
  const user_id = req.userId;
  const {
    match_id,
    random_mode,
    player_score,
    player_stage,
    player_time_seconds,
    bot_name,
    bot_faction,
    bot_score,
    bot_stage,
    bot_time_seconds
  } = req.body;

  if (
    !user_id ||
    !match_id ||
    !random_mode ||
    !bot_name ||
    !bot_faction ||
    player_score == null ||
    player_stage == null ||
    player_time_seconds == null ||
    bot_score == null ||
    bot_stage == null ||
    bot_time_seconds == null
  ) {
    return res.status(400).json({
      message: "Missing bot practice match data",
      received: {
        user_id,
        match_id,
        random_mode,
        player_score,
        player_stage,
        player_time_seconds,
        bot_name,
        bot_faction,
        bot_score,
        bot_stage,
        bot_time_seconds
      }
    });
  }

  saveBotPracticeMatch(
    {
      user_id,
      match_id,
      random_mode,
      player_score,
      player_stage,
      player_time_seconds,
      bot_name,
      bot_faction,
      bot_score,
      bot_stage,
      bot_time_seconds
    },
    (err, savedData) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to submit bot practice match",
          error: err.message
        });
      }

      return res.status(200).json(savedData);
    }
  );
}

function getHistory(req, res) {
  const { userId } = req.params;

  const sql = `
    SELECT
      id,
      match_id,
      bot_name,
      bot_faction,
      random_mode,
      player_score,
      bot_score,
      player_stage,
      bot_stage,
      player_time_seconds,
      bot_time_seconds,
      match_result,
      rank_change,
      created_at
    FROM bot_matches
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 10
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch bot match history",
        error: err.message
      });
    }

    return res.json(results);
  });
}

module.exports = {
  createMatch,
  submitMatch,
  getHistory
};
