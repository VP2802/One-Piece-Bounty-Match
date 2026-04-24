import { state } from "../state.js";
import {
  createBotPracticeMatch,
  submitBotPracticeMatch
} from "../api.js";
import { stopBgm } from "../audio.js";
import {
  notify,
  updateScoreDisplay,
  showEndScreen,
  formatTime,
  setPlayType
} from "../ui.js";
import { renderPvpTop10 } from "./leaderboard.js";
import { startGame } from "../game/offline.js";
import { clearPath, renderBoard } from "../game/board.js";
import {
  clearNextStageTimeout,
  clearPendingActions,
  getTimeBonus,
  getModeBonus
} from "../game/scoring.js";
import { hidePvpRoomCard } from "./room.js";

export function stopOpponentScoreTracking() {
  clearInterval(state.opponentScoreInterval);
  state.opponentScoreInterval = null;
}

export function startBotOpponentScoreTracking() {
  stopOpponentScoreTracking();

  if (
    state.currentPvpMode !== "bot_practice" ||
    !state.currentBotMatch?.bot_profile ||
    !state.currentMode
  ) {
    state.opponentLiveScore = 0;
    state.opponentLiveStage = 0;
    return;
  }

  state.opponentLiveScore = 0;
  state.opponentLiveStage = 0;

  const targetScore = state.currentBotMatch.bot_profile.final_score ?? 0;
  const targetStage = state.currentBotMatch.bot_profile.final_stage ?? 0;
  const targetTime =
    state.currentBotMatch.bot_profile.final_time_seconds ?? state.currentMode.timeLeft;

  state.opponentScoreInterval = setInterval(() => {
    const elapsed = Math.max(0, state.currentMode.timeLeft - state.timeLeft);
    const progress = Math.max(0, Math.min(1, elapsed / Math.max(1, targetTime)));

    state.opponentLiveScore = Math.floor(targetScore * progress);
    state.opponentLiveStage = progress >= 1 ? targetStage : 0;

    updateScoreDisplay();

    if (progress >= 1 || state.isGameOver) {
      stopOpponentScoreTracking();
    }
  }, 1000);
}

export async function handleStartBotPracticeMatch() {
  if (!state.currentUser) {
    notify("Please sign in first.", "warning");
    return;
  }

  try {
    const result = await createBotPracticeMatch(state.currentUser.id);
    state.currentBotMatch = result.match;

    notify(
      `Match found! Mode: ${state.currentBotMatch.random_mode.toUpperCase()} vs ${state.currentBotMatch.opponent_preview.player_name}`,
      "success",
      2600
    );

    startBotPracticeMatch(state.currentBotMatch);
  } catch (error) {
    notify(error.message || "Failed to create PvP match.", "error");
  }
}

export async function handlePracticeBotMatch() {
  state.currentPvpMode = "bot_practice";
  hidePvpRoomCard();
  await handleStartBotPracticeMatch();
}

export function startBotPracticeMatch(match) {
  if (!match || !match.random_mode) {
    notify("Invalid PvP match config.", "error");
    return;
  }

  state.currentGameContext = "pvp";
  state.currentEntryMode = "pvp";
  state.currentPlayType = "single";
  state.currentBoardSeed = null;
  state.currentPvpRoomCode = null;

  setPlayType("single");
  startGame(match.random_mode);
  startBotOpponentScoreTracking();

  notify(
    `PvP Started • You vs ${match.opponent_preview.player_name} • ${match.random_mode.toUpperCase()}`,
    "info",
    2800
  );
}

export async function finishBotPracticeMatch(didClearBoard) {
  if (!state.currentUser || !state.currentBotMatch || !state.currentMode) return;

  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();
  stopBgm();
  stopOpponentScoreTracking();

  state.isGameOver = true;
  state.firstSelected = null;
  state.secondSelected = null;

  clearPath();
  renderBoard();

  const timeUsedSeconds = Math.max(0, state.currentMode.timeLeft - state.timeLeft);
  const timeBonus = didClearBoard ? state.timeLeft * getTimeBonus() : 0;
  const modeBonus = didClearBoard ? getModeBonus() : 0;
  const finalPlayerScore = didClearBoard
    ? state.score + timeBonus + modeBonus
    : state.score;
  const playerStage = didClearBoard ? 1 : 0;

  try {
    const result = await submitBotPracticeMatch({
      user_id: state.currentUser.id,
      match_id: state.currentBotMatch.match_id,
      random_mode: state.currentBotMatch.random_mode,
      player_score: finalPlayerScore,
      player_stage: playerStage,
      player_time_seconds: timeUsedSeconds,
      bot_name: state.currentBotMatch.opponent_preview.player_name,
      bot_faction: state.currentBotMatch.opponent_preview.faction,
      bot_score: state.currentBotMatch.bot_profile.final_score,
      bot_stage: state.currentBotMatch.bot_profile.final_stage,
      bot_time_seconds: state.currentBotMatch.bot_profile.final_time_seconds
    });

    state.currentUser = {
      ...state.currentUser,
      ...result.player
    };

    try {
      await renderPvpTop10();
    } catch {}

    const bot = result.bot;

    let title = "DRAW!";
    if (result.result === "player1_win") title = "VICTORY!";
    if (result.result === "player2_win") title = "DEFEAT!";

    showEndScreen(
      title,
      `🤖 Bot Score: ${bot.score} • Time: ${formatTime(bot.time_seconds)}`,
      `🎯 Your Score: ${finalPlayerScore} • Time: ${formatTime(timeUsedSeconds)}`,
      "",
      ""
    );

    state.currentBotMatch = null;
    state.currentPvpMode = null;
    state.currentBoardSeed = null;
  } catch (error) {
    showEndScreen(
      didClearBoard ? "MATCH FINISHED" : "TIME'S UP!",
      "PvP result could not be submitted.",
      error.message || "Server error",
      `🏆 Your Score: ${finalPlayerScore}`,
      ""
    );

    state.currentBotMatch = null;
    state.currentPvpMode = null;
    state.currentBoardSeed = null;
  }
}