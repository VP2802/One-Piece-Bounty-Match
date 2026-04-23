const router = require("express").Router();
const invitesService = require("../services/invites.service");

router.post("/match", invitesService.sendMatchInvite);
router.get("/:userId", invitesService.getIncomingMatchInvites);
router.post("/match/:inviteId/accept", invitesService.acceptMatchInvite);
router.post("/match/:inviteId/reject", invitesService.rejectMatchInvite);

module.exports = router;