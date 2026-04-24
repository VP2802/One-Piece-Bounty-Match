const db = require("../db");
const { getRankFromPoints } = require("../rank");
const { generateBoardSeed } = require("../utils/pvp.utils");
const {
  getRoomMatchStore,
  generateRoomCodeForStore,
  sanitizeRoomMatch
} = require("../stores/room-match.store");
const {
  saveFriendlyRoomMatch,
  saveRankedRoomMatch
} = require("./match-save.service");

const roomMatchModeConfig = {
  friendly: {
    label: "Friendly",
    saveMatch: saveFriendlyRoomMatch
  },
  ranked: {
    label: "Ranked",
    saveMatch: saveRankedRoomMatch
  }
};

function createRoomMatch(mode, req, res) {
  const  user_id  = req.userId;

  if (!user_id) {
    return res.status(400).json({
      message: "Missing user_id"
    });
  }

  const store = getRoomMatchStore(mode);

  if (!store) {
    return res.status(400).json({
      message: "Invalid room mode"
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

    const user = results[0];
    const room_code = generateRoomCodeForStore(store);

    const randomModes =
      mode === "friendly"
        ? ["easy", "hard", "insane", "impossible"]
        : ["hard", "insane", "impossible"];

    const random_mode =
      randomModes[Math.floor(Math.random() * randomModes.length)];

    const board_seed = generateBoardSeed();

    const room = {
      room_code,
      status: "waiting",
      random_mode,
      board_seed,
      host_user: {
        id: user.id,
        player_name: user.player_name,
        faction: user.faction,
        ranking_points: user.ranking_points ?? 0,
        current_rank:
          user.current_rank ??
          getRankFromPoints(user.ranking_points ?? 0, user.faction)
      },
      guest_user: null,
      live_progress: {
        host: { score: 0, stage: 0, updated_at: Date.now() },
        guest: { score: 0, stage: 0, updated_at: null },
        host_last_active: Date.now(),
        guest_last_active: null
      },
      submitted_results: {
        host: null,
        guest: null
      },
      created_at: Date.now()
    };

    store.set(room_code, room);

    return res.status(201).json({
      message: `${roomMatchModeConfig[mode].label} room created successfully`,
      room: sanitizeRoomMatch(room)
    });
  });
}

function joinRoomMatch(mode, req, res) {
  const user_id = req.userId;
  const { room_code } = req.body;

  if (!user_id || !room_code) {
    return res.status(400).json({
      message: "Missing user_id or room_code"
    });
  }

  const store = getRoomMatchStore(mode);
  const room = store?.get(String(room_code).toUpperCase());

  if (!room) {
    return res.status(404).json({
      message: "Room not found"
    });
  }

  if (room.guest_user) {
    return res.status(409).json({
      message: "Room is already full"
    });
  }

  if (room.host_user.id === Number(user_id)) {
    return res.status(409).json({
      message: "Host cannot join their own room as guest"
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
        message: "Failed to fetch guest user information",
        error: err.message
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    const user = results[0];

    room.guest_user = {
      id: user.id,
      player_name: user.player_name,
      faction: user.faction,
      ranking_points: user.ranking_points ?? 0,
      current_rank:
        user.current_rank ??
        getRankFromPoints(user.ranking_points ?? 0, user.faction)
    };

    room.live_progress.guest_last_active = Date.now();
    room.status = "ready";

    return res.status(200).json({
      message: `Joined ${mode} room successfully`,
      room: sanitizeRoomMatch(room)
    });
  });
}

function getRoomMatch(mode, req, res) {
  const store = getRoomMatchStore(mode);
  const roomCode = String(req.params.roomCode || "").toUpperCase();
  const room = store?.get(roomCode);

  if (!room) {
    return res.status(404).json({
      message: "Room not found"
    });
  }

  return res.json({
    room: sanitizeRoomMatch(room),
    final_result: room.final_result || null
  });
}

function updateRoomMatchProgress(mode, req, res) {
  const user_id = req.userId;
  const { room_code, score, stage } = req.body;

  if (!room_code || !user_id || score == null || stage == null) {
    return res.status(400).json({
      message: "Missing room live progress data"
    });
  }

  const store = getRoomMatchStore(mode);
  const room = store?.get(String(room_code).toUpperCase());

  if (!room) {
    return res.status(404).json({
      message: "Room not found"
    });
  }

  const numericUserId = Number(user_id);

  if (room.host_user?.id === numericUserId) {
    room.live_progress.host = { score, stage, updated_at: Date.now() };
    room.live_progress.host_last_active = Date.now();
  } else if (room.guest_user?.id === numericUserId) {
    room.live_progress.guest = { score, stage, updated_at: Date.now() };
    room.live_progress.guest_last_active = Date.now();
  }
  else {
    return res.status(403).json({
      message: "User is not part of this room"
    });
  }

  return res.json({
    message: "Room live progress updated",
    room: sanitizeRoomMatch(room)
  });
}

function leaveRoomMatch(mode, req, res) {
  const user_id = req.userId;
  const { room_code } = req.body;

  if (!user_id || !room_code) {
    return res.status(400).json({
      message: "Missing user_id or room_code"
    });
  }

  const store = getRoomMatchStore(mode);
  const room = store?.get(String(room_code).toUpperCase());

  if (!room) {
    return res.status(404).json({
      message: "Room not found"
    });
  }

  const numericUserId = Number(user_id);

  if (room.host_user?.id === numericUserId) {
    store.delete(room.room_code);
    return res.json({
      message: "Host left the room. Room deleted."
    });
  }

  if (room.guest_user?.id === numericUserId) {
    room.guest_user = null;
    room.status = "waiting";
    room.live_progress.guest = {
      score: 0,
      stage: 0,
      updated_at: null
    };
    room.submitted_results.guest = null;

    return res.json({
      message: "Guest left the room",
      room: sanitizeRoomMatch(room)
    });
  }

  return res.status(404).json({
    message: "User is not part of this room"
  });
}

function submitRoomMatchResult(mode, req, res) {
  const { room_code, score, stage, time_seconds } = req.body;
  const user_id = req.userId;

  if (!room_code || !user_id || score == null || stage == null || time_seconds == null) {
    return res.status(400).json({ message: "Missing room match result data" });
  }

  const store = getRoomMatchStore(mode);
  const room = store?.get(String(room_code).toUpperCase());
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  if (!room.host_user || !room.guest_user) {
    return res.status(409).json({ message: "Room is not ready" });
  }

  const numericUserId = Number(user_id);
  let playerSlot = null;
  if (room.host_user.id === numericUserId) playerSlot = "host";
  else if (room.guest_user.id === numericUserId) playerSlot = "guest";

  if (!playerSlot) {
    return res.status(403).json({ message: "User is not part of this room" });
  }

  room.submitted_results[playerSlot] = {
    user_id: numericUserId,
    score,
    stage,
    time_seconds
  };

  let hostResult = room.submitted_results.host;
  let guestResult = room.submitted_results.guest;

  const otherSlot = playerSlot === "host" ? "guest" : "host";
  const otherLastActive = room.live_progress[otherSlot + "_last_active"];

  if (!hostResult || !guestResult) {
    const now = Date.now();
    const INACTIVE_TIMEOUT = 5 * 1000; 

    if (!otherLastActive || now - otherLastActive > INACTIVE_TIMEOUT) {
      const otherUserId = otherSlot === "host" ? room.host_user.id : room.guest_user.id;
      room.submitted_results[otherSlot] = {
        user_id: otherUserId,
        score: 0,
        stage: 0,
        time_seconds: getMaxTimeForMode(room.random_mode)
      };
      hostResult = room.submitted_results.host;
      guestResult = room.submitted_results.guest;
    }
  }

  if (hostResult && guestResult) {
    const payload = {
      player1_id: room.host_user.id,
      player2_id: room.guest_user.id,
      random_mode: room.random_mode,
      player1_score: hostResult.score,
      player2_score: guestResult.score,
      player1_stage: hostResult.stage,
      player2_stage: guestResult.stage,
      player1_time_seconds: hostResult.time_seconds,
      player2_time_seconds: guestResult.time_seconds
    };

    roomMatchModeConfig[mode].saveMatch(payload, (saveErr, saveData) => {
      if (saveErr) {
        return res.status(500).json({
          message: `Failed to save ${mode} room match`,
          error: saveErr.message
        });
      }

      room.status = "finished";
      room.final_result = saveData;

      return res.status(200).json({
        message: `${roomMatchModeConfig[mode].label} match finished successfully`,
        saved_match: saveData
      });
    });
  } else {
    return res.status(200).json({
      message: "Result submitted. Waiting for opponent.",
      status: "waiting_for_opponent"
    });
  }
}

function createFriendlyRoomForUser(userId, callback) {
  const mode = "friendly";
  const store = getRoomMatchStore(mode);

  if (!store) {
    return callback(new Error("Invalid room mode"));
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

  db.query(getUserSql, [userId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(new Error("User not found"));

    const user = results[0];
    const room_code = generateRoomCodeForStore(store);

    const randomModes = ["easy", "hard", "insane", "impossible"];
    const random_mode =
      randomModes[Math.floor(Math.random() * randomModes.length)];

    const board_seed = generateBoardSeed();

    const room = {
      room_code,
      status: "waiting",
      random_mode,
      board_seed,
      host_user: {
        id: user.id,
        player_name: user.player_name,
        faction: user.faction,
        ranking_points: user.ranking_points ?? 0,
        current_rank:
          user.current_rank ??
          getRankFromPoints(user.ranking_points ?? 0, user.faction)
      },
      guest_user: null,
      live_progress: {
        host: { score: 0, stage: 0, updated_at: Date.now() },
        guest: { score: 0, stage: 0, updated_at: null },
        host_last_active: Date.now(),
        guest_last_active: null
      },
      submitted_results: {
        host: null,
        guest: null
      },
      created_at: Date.now()
    };

    store.set(room_code, room);
    callback(null, sanitizeRoomMatch(room));
  });
}

function createRankedRoomForUser(userId, callback) {
  const mode = "ranked";
  const store = getRoomMatchStore(mode);

  if (!store) {
    return callback(new Error("Invalid room mode"));
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

  db.query(getUserSql, [userId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(new Error("User not found"));

    const user = results[0];
    const room_code = generateRoomCodeForStore(store);

    const randomModes = ["hard", "insane", "impossible"];
    const random_mode =
      randomModes[Math.floor(Math.random() * randomModes.length)];

    const board_seed = generateBoardSeed();

    const room = {
      room_code,
      status: "waiting",
      random_mode,
      board_seed,
      host_user: {
        id: user.id,
        player_name: user.player_name,
        faction: user.faction,
        ranking_points: user.ranking_points ?? 0,
        current_rank:
          user.current_rank ??
          getRankFromPoints(user.ranking_points ?? 0, user.faction)
      },
      guest_user: null,
      live_progress: {
        host: { score: 0, stage: 0, updated_at: Date.now() },
        guest: { score: 0, stage: 0, updated_at: null },
        host_last_active: Date.now(),
        guest_last_active: null
      },
      submitted_results: {
        host: null,
        guest: null
      },
      created_at: Date.now()
    };

    store.set(room_code, room);
    callback(null, sanitizeRoomMatch(room));
  });
}

function joinFriendlyRoomByCode(userId, roomCode, callback) {
  const mode = "friendly";
  const store = getRoomMatchStore(mode);
  const room = store?.get(String(roomCode).toUpperCase());

  if (!room) return callback(new Error("Room not found"));
  if (room.guest_user) return callback(new Error("Room is already full"));
  if (room.host_user.id === Number(userId)) {
    return callback(new Error("Host cannot join their own room as guest"));
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

  db.query(getUserSql, [userId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(new Error("User not found"));

    const user = results[0];

    room.guest_user = {
      id: user.id,
      player_name: user.player_name,
      faction: user.faction,
      ranking_points: user.ranking_points ?? 0,
      current_rank:
        user.current_rank ??
        getRankFromPoints(user.ranking_points ?? 0, user.faction)
    };

    room.live_progress.guest_last_active = Date.now();
    room.status = "ready";
    callback(null, sanitizeRoomMatch(room));
  });
}

function joinRankedRoomByCode(userId, roomCode, callback) {
  const mode = "ranked";
  const store = getRoomMatchStore(mode);
  const room = store?.get(String(roomCode).toUpperCase());

  if (!room) return callback(new Error("Room not found"));
  if (room.guest_user) return callback(new Error("Room is already full"));
  if (room.host_user.id === Number(userId)) {
    return callback(new Error("Host cannot join their own room as guest"));
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

  db.query(getUserSql, [userId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(new Error("User not found"));

    const user = results[0];

    room.guest_user = {
      id: user.id,
      player_name: user.player_name,
      faction: user.faction,
      ranking_points: user.ranking_points ?? 0,
      current_rank:
        user.current_rank ??
        getRankFromPoints(user.ranking_points ?? 0, user.faction)
    };

    room.live_progress.guest_last_active = Date.now();
    room.status = "ready";
    callback(null, sanitizeRoomMatch(room));
  });
}

function forceQuitRoomMatch(mode, req, res) {
  const { room_code, token } = req.body;
  if (!room_code || !token) {
    return res.status(400).json({ message: "Missing room_code or token" });
  }

  let userId;
  try {
    const decoded = require('../utils/token').verifyToken(token);
    userId = decoded.userId;
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }

  const store = getRoomMatchStore(mode);
  const room = store?.get(String(room_code).toUpperCase());
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  let quitterSlot = null;
  if (room.host_user?.id === userId) quitterSlot = "host";
  else if (room.guest_user?.id === userId) quitterSlot = "guest";
  if (!quitterSlot) {
    return res.status(403).json({ message: "User not in this room" });
  }

  const otherSlot = quitterSlot === "host" ? "guest" : "host";

  const forfeitResult = {
    user_id: userId,
    score: 0,
    stage: 0,
    time_seconds: getMaxTimeForMode(room.random_mode)
  };

  let otherResult = room.submitted_results[otherSlot];
  if (!otherResult) {
    const otherProgress = room.live_progress[otherSlot];
    otherResult = {
      user_id: otherSlot === "host" ? room.host_user.id : room.guest_user.id,
      score: otherProgress?.score ?? 0,
      stage: otherProgress?.stage ?? 0,
      time_seconds: 0 
    };
  }

  room.submitted_results[quitterSlot] = forfeitResult;
  room.submitted_results[otherSlot] = otherResult;

  const payload = {
    player1_id: room.host_user.id,
    player2_id: room.guest_user.id,
    random_mode: room.random_mode,
    player1_score: room.submitted_results.host.score,
    player2_score: room.submitted_results.guest.score,
    player1_stage: room.submitted_results.host.stage,
    player2_stage: room.submitted_results.guest.stage,
    player1_time_seconds: room.submitted_results.host.time_seconds,
    player2_time_seconds: room.submitted_results.guest.time_seconds
  };

  roomMatchModeConfig[mode].saveMatch(payload, (err, savedData) => {
    if (err) {
      return res.status(500).json({ message: "Failed to save match", error: err.message });
    }

    room.status = "finished";
    room.final_result = savedData;

    return res.json({ message: "Match resolved", saved_match: savedData });
  });
}

function getMaxTimeForMode(randomMode) {
  const times = {
    easy: 900,
    hard: 720,
    insane: 600,
    impossible: 600
  };
  return times[randomMode] || 600;
}

module.exports = {
  createRoomMatch,
  joinRoomMatch,
  getRoomMatch,
  updateRoomMatchProgress,
  leaveRoomMatch,
  submitRoomMatchResult,
  createFriendlyRoomForUser,
  joinFriendlyRoomByCode,
  createRankedRoomForUser,
  joinRankedRoomByCode,
  forceQuitRoomMatch
};
