const router = require("express").Router();
const usersService = require("../services/users.service");

router.get("/search", usersService.searchUsers);

router.get("/:userId/profile", usersService.getUserProfile);
router.get("/:userId/pvp-history", usersService.getUserPvpHistory);
router.patch(
  "/:userId/pvp-history-visibility",
  usersService.updateUserPvpHistoryVisibility
);

module.exports = router;