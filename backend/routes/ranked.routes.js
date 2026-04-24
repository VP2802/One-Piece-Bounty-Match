const router = require("express").Router();
const roomService = require("../services/room.service");
const rankedQueueService = require("../services/ranked-queue.service");

router.post("/create-room", (req, res) => {
  roomService.createRoomMatch("ranked", req, res);
});

router.post("/join-room", (req, res) => {
  roomService.joinRoomMatch("ranked", req, res);
});

router.get("/room/:roomCode", (req, res) => {
  roomService.getRoomMatch("ranked", req, res);
});

router.post("/update-progress", (req, res) => {
  roomService.updateRoomMatchProgress("ranked", req, res);
});

router.post("/leave-room", (req, res) => {
  roomService.leaveRoomMatch("ranked", req, res);
});

router.post("/submit-result", (req, res) => {
  roomService.submitRoomMatchResult("ranked", req, res);
});

router.post("/queue/join", rankedQueueService.joinRankedQueue);
router.post("/queue/leave", rankedQueueService.leaveRankedQueue);
router.get("/queue/status/:userId", rankedQueueService.getRankedQueueStatus);

router.post("/force-quit", (req, res) => {
  roomService.forceQuitRoomMatch("ranked", req, res);
});

module.exports = router;
