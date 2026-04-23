const { friendlyQueue, matchedFriendlyRooms } = require("../stores/friendly-queue.store");
const {
  createFriendlyRoomForUser,
  joinFriendlyRoomByCode
} = require("./room.service");

function joinFriendlyQueue(req, res) {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "Missing user_id" });
  }

  const numericUserId = Number(user_id);

  if (matchedFriendlyRooms.has(numericUserId)) {
    return res.json({
      status: "matched",
      room: matchedFriendlyRooms.get(numericUserId)
    });
  }

  const alreadyQueued = friendlyQueue.find((entry) => entry.user_id === numericUserId);
  if (alreadyQueued) {
    return res.json({ status: "searching" });
  }

  const opponent = friendlyQueue.find((entry) => entry.user_id !== numericUserId);

  if (!opponent) {
    friendlyQueue.push({
      user_id: numericUserId,
      queued_at: Date.now()
    });

    return res.json({ status: "searching" });
  }

  const opponentIndex = friendlyQueue.findIndex(
    (entry) => entry.user_id === opponent.user_id
  );
  if (opponentIndex >= 0) {
    friendlyQueue.splice(opponentIndex, 1);
  }

  createFriendlyRoomForUser(opponent.user_id, (createErr, room) => {
    if (createErr) {
      return res.status(500).json({
        message: "Failed to create random friendly room",
        error: createErr.message
      });
    }

    joinFriendlyRoomByCode(numericUserId, room.room_code, (joinErr, joinedRoom) => {
      if (joinErr) {
        return res.status(500).json({
          message: "Failed to join random friendly room",
          error: joinErr.message
        });
      }

      matchedFriendlyRooms.set(opponent.user_id, joinedRoom);
      matchedFriendlyRooms.set(numericUserId, joinedRoom);

      return res.json({
        status: "matched",
        room: joinedRoom
      });
    });
  });
}

function leaveFriendlyQueue(req, res) {
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ message: "Missing user_id" });
  }

  const numericUserId = Number(user_id);
  const index = friendlyQueue.findIndex((entry) => entry.user_id === numericUserId);

  if (index >= 0) {
    friendlyQueue.splice(index, 1);
  }

  return res.json({ message: "Left friendly queue successfully" });
}

function getFriendlyQueueStatus(req, res) {
  const numericUserId = Number(req.params.userId);

  if (matchedFriendlyRooms.has(numericUserId)) {
    return res.json({
      status: "matched",
      room: matchedFriendlyRooms.get(numericUserId)
    });
  }

  const isQueued = friendlyQueue.some((entry) => entry.user_id === numericUserId);

  if (isQueued) {
    return res.json({ status: "searching" });
  }

  return res.json({ status: "idle" });
}

module.exports = {
  joinFriendlyQueue,
  leaveFriendlyQueue,
  getFriendlyQueueStatus
};