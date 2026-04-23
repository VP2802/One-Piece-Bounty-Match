const router = require("express").Router();
const leaderboardService = require("../services/leaderboard.service");

router.get("/top10", leaderboardService.getTop10);

module.exports = router;
