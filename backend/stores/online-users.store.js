const onlineUsers = new Map();

const ONLINE_TIMEOUT = 10 * 1000;

function updateUserActivity(userId) {
  onlineUsers.set(Number(userId), Date.now());
}

function isUserOnline(userId) {
  const lastActive = onlineUsers.get(Number(userId));
  return lastActive && (Date.now() - lastActive < ONLINE_TIMEOUT);
}

function removeUser(userId) {
  onlineUsers.delete(Number(userId));
}

function getOnlineStatus(userIds) {
  const result = {};
  userIds.forEach(id => {
    result[id] = isUserOnline(id);
  });
  return result;
}

setInterval(() => {
  const now = Date.now();
  for (const [userId, lastActive] of onlineUsers.entries()) {
    if (now - lastActive > ONLINE_TIMEOUT) {
      onlineUsers.delete(userId);
    }
  }
}, 60_000);

module.exports = {
  updateUserActivity,
  isUserOnline,
  removeUser,
  getOnlineStatus
};