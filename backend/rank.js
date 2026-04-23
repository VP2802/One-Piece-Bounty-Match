function getRankFromPoints(points, faction) {
  if (faction === "pirate") {
    if (points >= 3500) return "Pirate King (Vua Hải Tặc)";
    if (points >= 2300) return "Yonko (Tứ Hoàng)";
    if (points >= 1500) return "Yonko Commander (Tư Lệnh Tứ Hoàng)";
    if (points >= 900) return "Shichibukai (Thất Vũ Hải)";
    if (points >= 500) return "Super Rookie (Siêu Tân Tinh)";
    if (points >= 250) return "Captain (Thuyền Trưởng)";
    if (points >= 100) return "Crewmate (Thuyền Viên)";
    return "Rookie (Tân Binh)";
  }

  if (faction === "marine") {
    if (points >= 3500) return "Fleet Admiral (Thủy Sư Đô Đốc)";
    if (points >= 2300) return "Admiral (Đô Đốc)";
    if (points >= 1500) return "Vice Admiral (Phó Đô Đốc)";
    if (points >= 900) return "Commodore (Đề Đốc)";
    if (points >= 500) return "Major (Thiếu Tá)";
    if (points >= 250) return "Captain (Đại Úy)";
    if (points >= 100) return "Petty Officer (Hạ Sĩ)";
    return "Recruit (Tân Binh)";
  }

  return "Unranked";
}

function clampRankPoints(points) {
  return Math.max(0, points);
}

module.exports = {
  getRankFromPoints,
  clampRankPoints
};