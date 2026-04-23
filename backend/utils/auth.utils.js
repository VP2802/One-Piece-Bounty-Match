function normalizeAuthBody(req, res) {
  let { player_name, faction, password, confirm_password } = req.body;

  if (!player_name || !password) {
    res.status(400).json({
      message: "Missing player_name, or password"
    });
    return null;
  }

  player_name = String(player_name).trim();
  faction = String(faction).trim().toLowerCase();
  password = String(password);

  if (!player_name) {
    res.status(400).json({ message: "player_name cannot be empty" });
    return null;
  }

  if (player_name.length < 3) {
    res.status(400).json({ message: "Player name must be at least 3 characters" });
    return null;
  }

  if (player_name.length > 30) {
    res.status(400).json({ message: "Player name must be at most 30 characters" });
    return null;
  }

  if (password.length < 8) {
    res.status(400).json({ message: "Password must be at least 8 characters" });
    return null;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);

  if (!hasUpper || !hasLower || !hasDigit) {
    res.status(400).json({
      message: "Password must include at least one uppercase letter, one lowercase letter, and one number"
    });
    return null;
  }

  const bannedPasswords = [
    "password", "password1", "12345678", "123456789",
    "qwerty123", "abc12345", "11111111", "admin123"
  ];
  if (bannedPasswords.includes(password.toLowerCase())) {
    res.status(400).json({ message: "That password is too common. Please choose a stronger one." });
    return null;
  }

  if (!["pirate", "marine"].includes(faction)) {
    res.status(400).json({ message: "Faction must be pirate or marine" });
    return null;
  }

  return { 
    player_name, 
    faction, 
    password, 
    confirm_password: confirm_password ? String(confirm_password) : undefined 
  };
}

module.exports = { normalizeAuthBody };