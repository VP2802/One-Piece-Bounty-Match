const roomMatchStores = {
  friendly: new Map(),
  ranked: new Map()
};

function getRoomMatchStore(mode) {
  return roomMatchStores[mode];
}

function generateRoomCodeForStore(store, length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }

  if (store.has(code)) {
    return generateRoomCodeForStore(store, length);
  }

  return code;
}

function sanitizeRoomMatch(room) {
  return {
    room_code: room.room_code,
    status: room.status,
    random_mode: room.random_mode,
    board_seed: room.board_seed,
    host_user: room.host_user,
    guest_user: room.guest_user,
    live_progress: room.live_progress,
    submitted_results: {
      host_submitted: Boolean(room.submitted_results.host),
      guest_submitted: Boolean(room.submitted_results.guest)
    },
    created_at: room.created_at
  };
}

module.exports = {
  roomMatchStores,
  getRoomMatchStore,
  generateRoomCodeForStore,
  sanitizeRoomMatch
};
