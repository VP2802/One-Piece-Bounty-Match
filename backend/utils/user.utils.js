const db = require("../db");
const { getRankFromPoints } = require("../rank");

function findUserWithStatsByName(playerName, callback) {
  const findUserSql = `
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
    LEFT JOIN leaderboard_stats ls ON u.id = ls.user_id
    WHERE u.player_name = ?
    LIMIT 1
  `;

  db.query(findUserSql, [playerName], callback);
}

function buildUserPayload(userRow) {
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
      getRankFromPoints(userRow.ranking_points ?? 0, userRow.faction)
  };
}

module.exports = {
  findUserWithStatsByName,
  buildUserPayload
};
