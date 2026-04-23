const db = require("../db");
const { getRankFromPoints, clampRankPoints } = require("../rank");
const { resolvePvpResult } = require("../utils/pvp.utils");

function getKFactor(rp, faction) {
  const rank = getRankFromPoints(rp, faction).toLowerCase();
  if (rank.includes("rookie") || rank.includes("recruit")) return 50;
  if (rank.includes("crewmate") || rank.includes("petty officer")) return 40;
  if (rank.includes("captain") && !rank.includes("yonko") && !rank.includes("fleet")) return 30;
  if (rank.includes("super rookie") || rank.includes("major")) return 25;
  if (rank.includes("shichibukai") || rank.includes("commodore")) return 25;
  if (rank.includes("yonko commander") || rank.includes("vice admiral")) return 25;
  if (rank.includes("yonko") && !rank.includes("commander")) return 20;
  if (rank.includes("pirate king") || rank.includes("fleet admiral")) return 20;
  return 25;
}

function calculateRankedRPChange(playerRP, opponentRP, result, faction) {
  const K = getKFactor(playerRP, faction);
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRP - playerRP) / 400));
  
  let actualScore;
  switch (result) {
    case "win": actualScore = 1; break;
    case "draw": actualScore = 0.5; break;
    case "loss": actualScore = 0; break;
    default: return 0;
  }
  
  const rawChange = Math.round(K * (actualScore - expectedScore));
  return Math.max(-50, Math.min(50, rawChange));
}

function saveBotPracticeMatch(payload, callback) {
  const {
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
  } = payload;

  const getUserSql = `
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
    FROM users u
    JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE u.id = ?
    LIMIT 1
  `;

  db.query(getUserSql, [user_id], (err, results) => {
    if (err) return callback(err);

    if (results.length === 0) {
      return callback(new Error("User not found"));
    }

    const player = results[0];
    const bot = {
      score: bot_score,
      stage: bot_stage,
      time_seconds: bot_time_seconds
    };

    const result = resolvePvpResult(
      {
        score: player_score,
        stage: player_stage,
        time_seconds: player_time_seconds
      },
      {
        score: bot.score,
        stage: bot.stage,
        time_seconds: bot.time_seconds
      }
    );

    const rankChange = 0;
    const didWin = result === "player1_win" ? 1 : 0;

    const newRankingPoints = player.ranking_points ?? 0;
    const newCurrentRank =
      player.current_rank ?? getRankFromPoints(newRankingPoints, player.faction);

    const newHighestScore = Math.max(player.highest_score ?? 0, player_score);
    const newHighestStage = Math.max(player.highest_stage ?? 0, player_stage);

    let newBestRunTime = player.best_run_time_seconds ?? 0;
    if (player_stage > 0) {
      if (newBestRunTime === 0 || player_time_seconds < newBestRunTime) {
        newBestRunTime = player_time_seconds;
      }
    }

    const updateSql = `
      UPDATE leaderboard_stats
      SET
        highest_score = ?,
        highest_stage = ?,
        best_run_time_seconds = ?,
        total_pvp_matches = total_pvp_matches + 1,
        total_pvp_wins = total_pvp_wins + ?
      WHERE user_id = ?
    `;

    db.query(
      updateSql,
      [newHighestScore, newHighestStage, newBestRunTime, didWin, player.id],
      (updateErr) => {
        if (updateErr) return callback(updateErr);

        const insertBotMatchSql = `
          INSERT INTO bot_matches (
            user_id,
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
            rank_change
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertBotMatchSql,
          [
            player.id,
            match_id,
            bot_name,
            bot_faction,
            random_mode,
            player_score,
            bot.score,
            player_stage,
            bot.stage,
            player_time_seconds,
            bot.time_seconds,
            result,
            rankChange
          ],
          (insertErr) => {
            if (insertErr) return callback(insertErr);

            callback(null, {
              message: "Bot practice match submitted successfully",
              match_id,
              result,
              rank_change: 0,
              player: {
                id: player.id,
                player_name: player.player_name,
                faction: player.faction,
                highest_score: newHighestScore,
                highest_stage: newHighestStage,
                best_run_time_seconds: newBestRunTime,
                ranking_points: newRankingPoints,
                current_rank: newCurrentRank
              },
              bot: {
                player_name: bot_name,
                faction: bot_faction,
                score: bot.score,
                stage: bot.stage,
                time_seconds: bot.time_seconds
              }
            });
          }
        );
      }
    );
  });
}

function saveFriendlyRoomMatch(payload, callback) {
  const {
    player1_id,
    player2_id,
    random_mode,
    player1_score,
    player2_score,
    player1_stage,
    player2_stage,
    player1_time_seconds,
    player2_time_seconds
  } = payload;

  const getPlayersSql = `
    SELECT
      u.id,
      u.player_name,
      u.faction,
      ls.ranking_points,
      ls.current_rank,
      ls.total_pvp_matches,
      ls.total_pvp_wins
    FROM users u
    JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE u.id IN (?, ?)
  `;

  db.query(getPlayersSql, [player1_id, player2_id], (err, players) => {
    if (err) return callback(err);

    if (players.length !== 2) {
      return callback(new Error("Could not find both players"));
    }

    const player1 = players.find((p) => p.id === Number(player1_id));
    const player2 = players.find((p) => p.id === Number(player2_id));

    if (!player1 || !player2) {
      return callback(new Error("Could not find valid data for both players"));
    }

    const result = resolvePvpResult(
      {
        score: player1_score,
        stage: player1_stage,
        time_seconds: player1_time_seconds
      },
      {
        score: player2_score,
        stage: player2_stage,
        time_seconds: player2_time_seconds
      }
    );

    let winnerUserId = null;
    const player1Change = 0;
    const player2Change = 0;

    if (result === "player1_win") {
      winnerUserId = player1.id;
    } else if (result === "player2_win") {
      winnerUserId = player2.id;
    }

    const newPlayer1Points = player1.ranking_points ?? 0;
    const newPlayer2Points = player2.ranking_points ?? 0;

    const newPlayer1Rank =
      player1.current_rank ??
      getRankFromPoints(newPlayer1Points, player1.faction);
    const newPlayer2Rank =
      player2.current_rank ??
      getRankFromPoints(newPlayer2Points, player2.faction);

    const updatePlayer1Sql = `
      UPDATE leaderboard_stats
      SET
        total_pvp_matches = total_pvp_matches + 1,
        total_pvp_wins = total_pvp_wins + ?
      WHERE user_id = ?
    `;

    const updatePlayer2Sql = `
      UPDATE leaderboard_stats
      SET
        total_pvp_matches = total_pvp_matches + 1,
        total_pvp_wins = total_pvp_wins + ?
      WHERE user_id = ?
    `;

    const player1WinAdd = result === "player1_win" ? 1 : 0;
    const player2WinAdd = result === "player2_win" ? 1 : 0;

    db.query(updatePlayer1Sql, [player1WinAdd, player1.id], (updateErr1) => {
      if (updateErr1) return callback(updateErr1);

      db.query(updatePlayer2Sql, [player2WinAdd, player2.id], (updateErr2) => {
        if (updateErr2) return callback(updateErr2);

        const insertMatchSql = `
          INSERT INTO pvp_matches (
            player1_id,
            player2_id,
            random_mode,
            player1_score,
            player2_score,
            player1_stage,
            player2_stage,
            player1_time_seconds,
            player2_time_seconds,
            winner_user_id,
            match_result,
            player1_rank_points_change,
            player2_rank_points_change
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(
          insertMatchSql,
          [
            player1.id,
            player2.id,
            random_mode,
            player1_score,
            player2_score,
            player1_stage,
            player2_stage,
            player1_time_seconds,
            player2_time_seconds,
            winnerUserId,
            result,
            player1Change,
            player2Change
          ],
          (insertErr, insertResult) => {
            if (insertErr) return callback(insertErr);

            callback(null, {
              message: "Friendly room match saved successfully",
              match_id: insertResult.insertId,
              result,
              winner_user_id: winnerUserId,
              player1: {
                id: player1.id,
                ranking_points: newPlayer1Points,
                current_rank: newPlayer1Rank,
                rank_change: player1Change
              },
              player2: {
                id: player2.id,
                ranking_points: newPlayer2Points,
                current_rank: newPlayer2Rank,
                rank_change: player2Change
              }
            });
          }
        );
      });
    });
  });
}

function saveRankedRoomMatch(payload, callback) {
  const {
    player1_id,
    player2_id,
    random_mode,
    player1_score,
    player2_score,
    player1_stage,
    player2_stage,
    player1_time_seconds,
    player2_time_seconds
  } = payload;

  const getPlayersSql = `
    SELECT
      u.id,
      u.player_name,
      u.faction,
      ls.ranking_points,
      ls.current_rank,
      ls.total_pvp_matches,
      ls.total_pvp_wins
    FROM users u
    JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE u.id IN (?, ?)
  `;

  db.query(getPlayersSql, [player1_id, player2_id], (err, players) => {
    if (err) return callback(err);

    if (players.length !== 2) {
      return callback(new Error("Could not find both players"));
    }

    const player1 = players.find((p) => p.id === Number(player1_id));
    const player2 = players.find((p) => p.id === Number(player2_id));

    if (!player1 || !player2) {
      return callback(new Error("Could not find valid data for both players"));
    }

    const result = resolvePvpResult(
      {
        score: player1_score,
        stage: player1_stage,
        time_seconds: player1_time_seconds
      },
      {
        score: player2_score,
        stage: player2_stage,
        time_seconds: player2_time_seconds
      }
    );

    let player1Change = 0;
    let player2Change = 0;
    let winnerUserId = null;

    let player1Result, player2Result;
    if (result === "player1_win") {
      player1Result = "win";
      player2Result = "loss";
      winnerUserId = player1.id;
    } else if (result === "player2_win") {
      player1Result = "loss";
      player2Result = "win";
      winnerUserId = player2.id;
    } else { 
      player1Result = "draw";
      player2Result = "draw";
    }

    player1Change = calculateRankedRPChange(
      player1.ranking_points ?? 0,
      player2.ranking_points ?? 0,
      player1Result,
      player1.faction
    );

    player2Change = calculateRankedRPChange(
      player2.ranking_points ?? 0,
      player1.ranking_points ?? 0,
      player2Result,
      player2.faction
    );

    const newPlayer1Points = clampRankPoints(
      (player1.ranking_points ?? 0) + player1Change
    );
    const newPlayer2Points = clampRankPoints(
      (player2.ranking_points ?? 0) + player2Change
    );

    const newPlayer1Rank = getRankFromPoints(newPlayer1Points, player1.faction);
    const newPlayer2Rank = getRankFromPoints(newPlayer2Points, player2.faction);

    const updatePlayer1Sql = `
      UPDATE leaderboard_stats
      SET
        ranking_points = ?,
        current_rank = ?,
        total_pvp_matches = total_pvp_matches + 1,
        total_pvp_wins = total_pvp_wins + ?
      WHERE user_id = ?
    `;

    const updatePlayer2Sql = `
      UPDATE leaderboard_stats
      SET
        ranking_points = ?,
        current_rank = ?,
        total_pvp_matches = total_pvp_matches + 1,
        total_pvp_wins = total_pvp_wins + ?
      WHERE user_id = ?
    `;

    const player1WinAdd = result === "player1_win" ? 1 : 0;
    const player2WinAdd = result === "player2_win" ? 1 : 0;

    db.query(
      updatePlayer1Sql,
      [newPlayer1Points, newPlayer1Rank, player1WinAdd, player1.id],
      (updateErr1) => {
        if (updateErr1) return callback(updateErr1);

        db.query(
          updatePlayer2Sql,
          [newPlayer2Points, newPlayer2Rank, player2WinAdd, player2.id],
          (updateErr2) => {
            if (updateErr2) return callback(updateErr2);

            const insertMatchSql = `
              INSERT INTO pvp_matches (
                player1_id,
                player2_id,
                random_mode,
                player1_score,
                player2_score,
                player1_stage,
                player2_stage,
                player1_time_seconds,
                player2_time_seconds,
                winner_user_id,
                match_result,
                player1_rank_points_change,
                player2_rank_points_change
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            db.query(
              insertMatchSql,
              [
                player1.id,
                player2.id,
                random_mode,
                player1_score,
                player2_score,
                player1_stage,
                player2_stage,
                player1_time_seconds,
                player2_time_seconds,
                winnerUserId,
                result,
                player1Change,
                player2Change
              ],
              (insertErr, insertResult) => {
                if (insertErr) return callback(insertErr);

                callback(null, {
                  message: "Ranked room match saved successfully",
                  match_id: insertResult.insertId,
                  result,
                  winner_user_id: winnerUserId,
                  player1: {
                    id: player1.id,
                    ranking_points: newPlayer1Points,
                    current_rank: newPlayer1Rank,
                    rank_change: player1Change
                  },
                  player2: {
                    id: player2.id,
                    ranking_points: newPlayer2Points,
                    current_rank: newPlayer2Rank,
                    rank_change: player2Change
                  }
                });
              }
            );
          }
        );
      }
    );
  });
}

module.exports = {
  saveBotPracticeMatch,
  saveFriendlyRoomMatch,
  saveRankedRoomMatch
};
