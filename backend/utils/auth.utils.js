function normalizeAuthBody(req, res) {
  let { player_name, faction } = req.body;

  if (!player_name || !faction) {
    res.status(400).json({
      message: "Missing player_name or faction"
    });
    return null;
  }

  player_name = String(player_name).trim();
  faction = String(faction).trim().toLowerCase();

  if (!player_name) {
    res.status(400).json({
      message: "player_name cannot be empty"
    });
    return null;
  }

  if (!["pirate", "marine"].includes(faction)) {
    res.status(400).json({
      message: "Faction must be pirate or marine"
    });
    return null;
  }

  return { player_name, faction };
}

module.exports = {
  normalizeAuthBody
};
