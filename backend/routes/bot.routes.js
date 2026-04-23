const router = require("express").Router();
const botService = require("../services/bot.service");

router.post("/create-match", botService.createMatch);
router.post("/submit-match", botService.submitMatch);
router.get("/history/:userId", botService.getHistory);

module.exports = router;
