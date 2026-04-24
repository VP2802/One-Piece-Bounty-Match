const router = require("express").Router();
const friendsService = require("../services/friends.service");
const onlineUsersStore = require('../stores/online-users.store');

router.post("/request", friendsService.sendFriendRequest);

router.get("/:userId/list", friendsService.getFriendsList);
router.get("/:userId/requests", friendsService.getIncomingFriendRequests);

router.post("/request/:requestId/accept", friendsService.acceptFriendRequest);
router.post("/request/:requestId/reject", friendsService.rejectFriendRequest);

router.post('/online-status', (req, res) => {
  const { userIds } = req.body;
  if (!Array.isArray(userIds)) {
    return res.status(400).json({ message: 'userIds must be an array' });
  }
  const status = onlineUsersStore.getOnlineStatus(userIds);
  return res.json({ status });
});

router.delete("/unfriend", friendsService.unfriend);

module.exports = router;