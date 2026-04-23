const { saveRankedRoomMatch } = require("./match-save.service");

function saveLegacyMatch(req, res) {
  const {
    player1_id,
    player2_id,
    random_mode,
    player1_score,
    player2_score,
    player1_stage,
    player2_stage,
    player1_time_seconds,
    player2_time_seconds
  } = req.body;

  if (
    !player1_id ||
    !player2_id ||
    !random_mode ||
    player1_score == null ||
    player2_score == null ||
    player1_stage == null ||
    player2_stage == null ||
    player1_time_seconds == null ||
    player2_time_seconds == null
  ) {
    return res.status(400).json({
      message: "Missing PvP match data"
    });
  }

  saveRankedRoomMatch(
    {
      player1_id,
      player2_id,
      random_mode,
      player1_score,
      player2_score,
      player1_stage,
      player2_stage,
      player1_time_seconds,
      player2_time_seconds
    },
    (err, savedData) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to save PvP match",
          error: err.message
        });
      }

      return res.status(201).json(savedData);
    }
  );
}

module.exports = {
  saveLegacyMatch
};
