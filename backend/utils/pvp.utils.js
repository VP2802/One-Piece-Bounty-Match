function resolvePvpResult(player1, player2) {
  if (player1.score > player2.score) return "player1_win";
  if (player2.score > player1.score) return "player2_win";

  if (player1.stage > player2.stage) return "player1_win";
  if (player2.stage > player1.stage) return "player2_win";

  if (player1.time_seconds < player2.time_seconds) return "player1_win";
  if (player2.time_seconds < player1.time_seconds) return "player2_win";

  return "draw";
}

function generateBotPracticeResult(randomMode) {
  const presets = {
    hard: {
      clearChance: 0.58,
      minScore: 4200,
      maxScore: 8200,
      minTime: 260,
      maxTime: 620
    },
    insane: {
      clearChance: 0.46,
      minScore: 5000,
      maxScore: 9800,
      minTime: 240,
      maxTime: 560
    },
    impossible: {
      clearChance: 0.32,
      minScore: 5600,
      maxScore: 11000,
      minTime: 220,
      maxTime: 520
    }
  };

  const config = presets[randomMode] || presets.hard;
  const cleared = Math.random() < config.clearChance;

  const score =
    Math.floor(Math.random() * (config.maxScore - config.minScore + 1)) +
    config.minScore;

  const time_seconds =
    Math.floor(Math.random() * (config.maxTime - config.minTime + 1)) +
    config.minTime;

  return {
    score,
    stage: cleared ? 1 : 0,
    time_seconds
  };
}

function generateBoardSeed() {
  return `seed_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
}

module.exports = {
  resolvePvpResult,
  generateBotPracticeResult,
  generateBoardSeed
};
