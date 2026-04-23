const router = require("express").Router();
const pvpService = require("../services/pvp.service");

router.post("/save-match", pvpService.saveLegacyMatch);

module.exports = router;
