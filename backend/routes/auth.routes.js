const router = require("express").Router();
const authService = require("../services/auth.service");

router.post("/signup", authService.signUp);
router.post("/signin", authService.signIn);

module.exports = router;