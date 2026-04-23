const db = require("../db");
const { rankedQueue, matchedRankedRooms } = require("../stores/ranked-queue.store");
const {
  createRankedRoomForUser,
  joinRankedRoomByCode
} = require("./room.service");

function getAllowedRankDifference(waitMs) {
  const waitSeconds = Math.floor(waitMs / 1000);

  if (waitSeconds < 10) return 100;  // ±100 RP for 0-9 seconds wait
  if (waitSeconds < 20) return 200;  // ±200 RP for 10-19 seconds wait
  if (waitSeconds < 30) return 300;  // ±300 RP for 20-29 seconds wait
  return 500;  // ±500 RP for 30 seconds and above
}

function findRankedUserById(userId, callback) {
  const sql = `
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

  db.query(sql, [userId], (err, results) => {
    if (err) return callback(err);
    if (!results.length) return callback(new Error("User not found"));
    callback(null, results[0]);
  });
}

function joinRankedQueue(req, res) {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "Missing user_id" });
  }

  const numericUserId = Number(user_id);

  if (matchedRankedRooms.has(numericUserId)) {
    return res.json({
      status: "matched",
      room: matchedRankedRooms.get(numericUserId)
    });
  }

  const alreadyQueued = rankedQueue.find((entry) => entry.user_id === numericUserId);
  if (alreadyQueued) {
    return res.json({ status: "searching" });
  }

  findRankedUserById(numericUserId, (userErr, currentUser) => {
    if (userErr) {
      return res.status(500).json({
        message: "Failed to load ranked user",
        error: userErr.message
      });
    }

    const now = Date.now();

    const opponent = rankedQueue.find((entry) => {
      if (entry.user_id === numericUserId) return false;

      const myWaitMs = 0; 
      const opponentWaitMs = now - entry.queued_at;

      const myAllowedDiff = getAllowedRankDifference(myWaitMs);
      const opponentAllowedDiff = getAllowedRankDifference(opponentWaitMs);

      const diff = Math.abs(entry.ranking_points - currentUser.ranking_points);

      return diff <= myAllowedDiff && diff <= opponentAllowedDiff;
    });

    if (!opponent) {
      rankedQueue.push({
        user_id: numericUserId,
        ranking_points: currentUser.ranking_points ?? 0,
        queued_at: now
      });

      return res.json({ status: "searching" });
    }

    const opponentIndex = rankedQueue.findIndex(
      (entry) => entry.user_id === opponent.user_id
    );
    if (opponentIndex >= 0) {
      rankedQueue.splice(opponentIndex, 1);
    }

    createRankedRoomForUser(opponent.user_id, (createErr, room) => {
      if (createErr) {
        return res.status(500).json({
          message: "Failed to create ranked room",
          error: createErr.message
        });
      }

      joinRankedRoomByCode(numericUserId, room.room_code, (joinErr, joinedRoom) => {
        if (joinErr) {
          return res.status(500).json({
            message: "Failed to join ranked room",
            error: joinErr.message
          });
        }

        matchedRankedRooms.set(opponent.user_id, joinedRoom);
        matchedRankedRooms.set(numericUserId, joinedRoom);

        return res.json({
          status: "matched",
          room: joinedRoom
        });
      });
    });
  });
}

function leaveRankedQueue(req, res) {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "Missing user_id" });
  }

  const numericUserId = Number(user_id);
  const index = rankedQueue.findIndex((entry) => entry.user_id === numericUserId);

  if (index >= 0) {
    rankedQueue.splice(index, 1);
  }

  return res.json({ message: "Left ranked queue successfully" });
}

function getRankedQueueStatus(req, res) {
  const numericUserId = Number(req.params.userId);

  if (matchedRankedRooms.has(numericUserId)) {
    return res.json({
      status: "matched",
      room: matchedRankedRooms.get(numericUserId)
    });
  }

  const isQueued = rankedQueue.some((entry) => entry.user_id === numericUserId);

  if (isQueued) {
    return res.json({ status: "searching" });
  }

  return res.json({ status: "idle" });
}

module.exports = {
  joinRankedQueue,
  leaveRankedQueue,
  getRankedQueueStatus
};