const router = require("express").Router();
const friendsService = require("../services/friends.service");

router.post("/request", friendsService.sendFriendRequest);

router.get("/:userId/list", friendsService.getFriendsList);
router.get("/:userId/requests", friendsService.getIncomingFriendRequests);

router.post("/request/:requestId/accept", friendsService.acceptFriendRequest);
router.post("/request/:requestId/reject", friendsService.rejectFriendRequest);

module.exports = router;