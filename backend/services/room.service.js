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
  const { user_id } = req.body;

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
        guest: { score: 0, stage: 0, updated_at: null }
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
  const { user_id, room_code } = req.body;

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
    room: sanitizeRoomMatch(room)
  });
}

function updateRoomMatchProgress(mode, req, res) {
  const { room_code, user_id, score, stage } = req.body;

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
    room.live_progress.host = {
      score,
      stage,
      updated_at: Date.now()
    };
  } else if (room.guest_user?.id === numericUserId) {
    room.live_progress.guest = {
      score,
      stage,
      updated_at: Date.now()
    };
  } else {
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
  const { user_id, room_code } = req.body;

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
  const { room_code, user_id, score, stage, time_seconds } = req.body;

  if (
    !room_code ||
    !user_id ||
    score == null ||
    stage == null ||
    time_seconds == null
  ) {
    return res.status(400).json({
      message: "Missing room match result data"
    });
  }

  const store = getRoomMatchStore(mode);
  const room = store?.get(String(room_code).toUpperCase());

  if (!room) {
    return res.status(404).json({
      message: "Room not found"
    });
  }

  if (!room.host_user || !room.guest_user) {
    return res.status(409).json({
      message: "Room is not ready"
    });
  }

  const numericUserId = Number(user_id);
  let playerSlot = null;

  if (room.host_user.id === numericUserId) playerSlot = "host";
  if (room.guest_user.id === numericUserId) playerSlot = "guest";

  if (!playerSlot) {
    return res.status(403).json({
      message: "User is not part of this room"
    });
  }

  room.status = "playing";
  room.submitted_results[playerSlot] = {
    user_id: numericUserId,
    score,
    stage,
    time_seconds
  };

  const hostResult = room.submitted_results.host;
  const guestResult = room.submitted_results.guest;

  if (!hostResult || !guestResult) {
    return res.status(200).json({
      message: "Result submitted. Waiting for opponent.",
      status: "waiting_for_opponent"
    });
  }

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
    store.delete(room.room_code);

    return res.status(200).json({
      message: `${roomMatchModeConfig[mode].label} match finished successfully`,
      saved_match: saveData
    });
  });
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
        guest: { score: 0, stage: 0, updated_at: null }
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
        guest: { score: 0, stage: 0, updated_at: null }
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

    room.status = "ready";
    callback(null, sanitizeRoomMatch(room));
  });
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
  joinRankedRoomByCode
};
