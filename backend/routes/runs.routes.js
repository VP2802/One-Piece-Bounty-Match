const router = require("express").Router();
const runsService = require("../services/runs.service");

router.post("/save", runsService.saveRun);

module.exports = router;
