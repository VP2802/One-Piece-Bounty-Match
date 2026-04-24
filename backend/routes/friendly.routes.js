const router = require("express").Router();
const roomService = require("../services/room.service");
const friendlyQueueService = require("../services/friendly-queue.service");

router.post("/create-room", (req, res) => {
  roomService.createRoomMatch("friendly", req, res);
});

router.post("/join-room", (req, res) => {
  roomService.joinRoomMatch("friendly", req, res);
});

router.get("/room/:roomCode", (req, res) => {
  roomService.getRoomMatch("friendly", req, res);
});

router.post("/update-progress", (req, res) => {
  roomService.updateRoomMatchProgress("friendly", req, res);
});

router.post("/leave-room", (req, res) => {
  roomService.leaveRoomMatch("friendly", req, res);
});

router.post("/submit-result", (req, res) => {
  roomService.submitRoomMatchResult("friendly", req, res);
});

router.post("/queue/join", friendlyQueueService.joinFriendlyQueue);
router.post("/queue/leave", friendlyQueueService.leaveFriendlyQueue);
router.get("/queue/status/:userId", friendlyQueueService.getFriendlyQueueStatus);

router.post("/force-quit", (req, res) => {
  roomService.forceQuitRoomMatch("friendly", req, res);
});

module.exports = router;
