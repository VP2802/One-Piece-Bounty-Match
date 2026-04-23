import { state, gameModes, constants } from "../state.js";
import { dom } from "../dom.js";
import { applySoundSettings, startBgmPlaylist, stopBgm } from "../audio.js";
import {
  hideAllMainScreens,
  updateBoardBackground,
  updateTimeColumnDisplay,
  updateHintDisplay,
  updateReshuffleDisplay,
  updateEndRunButton,
  updateScoreDisplay,
  syncTimeColumnHeight,
  showEndScreen,
  notify
} from "../ui.js";
import { stopOpponentScoreTracking } from "../pvp/bot.js";
import {
  stopRoomMatchPolling,
  stopRoomMatchProgressTracking,
  hidePvpRoomCard,
  isRoomPvpMode
} from "../pvp/room.js";
import {
  clearPendingActions,
  clearNextStageTimeout,
  resetBoardSelections,
  resetCombo,
  resetRunProgress,
  getRandomDirection
} from "./scoring.js";
import { createBoard, renderBoard, resizeCanvas, clearPath } from "./board.js";
import { startTimer } from "./timer.js";

export function loadLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem(constants.LEADERBOARD_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveLeaderboard(finalMode = state.currentModeName) {
  if (!finalMode || !state.currentMode) return null;

  const usedSeconds =
    state.currentPlayType === "continuous"
      ? state.runUsedSeconds
      : state.currentMode.timeLeft - state.timeLeft;

  const finalScore =
    state.currentPlayType === "continuous"
      ? state.runTotalScore
      : state.score;

  const stagesPlayed =
    state.currentPlayType === "continuous"
      ? state.stagesCleared
      : 1;

  const newRecord = {
    id: Date.now() + Math.random(),
    score: finalScore,
    usedSeconds,
    time: String(Math.floor(usedSeconds / 60)).padStart(2, "0") +
      ":" +
      String(usedSeconds % 60).padStart(2, "0"),
    mode: String(finalMode).toUpperCase(),
    stagesPlayed
  };

  const leaderboard = loadLeaderboard();
  leaderboard.push(newRecord);

  leaderboard.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if ((b.stagesPlayed ?? 1) !== (a.stagesPlayed ?? 1)) {
      return (b.stagesPlayed ?? 1) - (a.stagesPlayed ?? 1);
    }
    return (a.usedSeconds ?? 0) - (b.usedSeconds ?? 0);
  });

  const trimmed = leaderboard.slice(0, 10);
  const rank = trimmed.findIndex((item) => item.id === newRecord.id) + 1;

  localStorage.setItem(constants.LEADERBOARD_KEY, JSON.stringify(trimmed));

  return rank >= 1 && rank <= 10 ? rank : null;
}

export function renderLeaderboard() {
  if (!dom.leaderboardBody) return;

  const leaderboard = loadLeaderboard();
  dom.leaderboardBody.innerHTML = "";

  if (!leaderboard.length) {
    dom.leaderboardBody.innerHTML = `
      <tr>
        <td colspan="5">No records yet</td>
      </tr>
    `;
    return;
  }

  leaderboard.forEach((item, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.score}</td>
      <td>${item.time}</td>
      <td>${item.mode}</td>
      <td>${item.stagesPlayed ?? 1}</td>
    `;
    dom.leaderboardBody.appendChild(row);
  });
}

export function showStartScreen() {
  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();
  stopBgm();

  stopOpponentScoreTracking();
  state.opponentLiveScore = 0;
  state.opponentLiveStage = 0;
  state.currentBoardSeed = null;
  state.currentPvpMode = null;

  hideAllMainScreens();
  dom.startScreen?.classList.remove("hidden");
  dom.pauseOverlay?.classList.add("hidden");
  dom.boardWrapper?.classList.remove("paused");
  dom.quitConfirmOverlay?.classList.add("hidden");

  resetBoardSelections();
  resetCombo();
  resetRunProgress();

  if (dom.bonusMessage) dom.bonusMessage.textContent = "";
  if (dom.modeBonusMessage) dom.modeBonusMessage.textContent = "";
  if (dom.totalScoreMessage) dom.totalScoreMessage.textContent = "";
  if (dom.leaderboardRankMessage) dom.leaderboardRankMessage.textContent = "";

  if (dom.restartBtn) dom.restartBtn.classList.remove("hidden");
  if (dom.homeBtn) dom.homeBtn.textContent = "🏠 Home";
  if (dom.pauseBtn) dom.pauseBtn.classList.remove("hidden");
  if (dom.pauseBtn) dom.pauseBtn.textContent = "⏸ Pause";

  state.isPaused = false;
  state.isGameOver = false;

  state.currentMode = null;
  state.currentModeName = null;
  state.currentBotMatch = null;
  state.currentGameContext = "offline";

  state.currentRoomMatch = null;
  stopRoomMatchPolling();
  stopRoomMatchProgressTracking();
  hidePvpRoomCard();

  state.reshufflesLeft = 0;
  state.insaneShiftDirection = null;
  state.hasSwitchedToDangerBgm = false;
  state.score = 0;

  clearPath();
  updateReshuffleDisplay();
  updateTimeColumnDisplay();
  renderLeaderboard();
}

export function initGame() {
  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();

  state.score = 0;
  resetBoardSelections();
  resetCombo();

  updateScoreDisplay();
  updateTimeColumnDisplay();

  if (dom.boardElement) {
    dom.boardElement.style.gridTemplateColumns =
      `repeat(${state.cols}, ${state.cellSize}px)`;
  }

  createBoard();
  renderBoard();
  resizeCanvas();
  syncTimeColumnHeight();
  clearPath();
}

export function startGame(mode) {
  state.currentModeName = mode;
  state.currentMode = gameModes[mode];
  if (!state.currentMode) return;

  hideAllMainScreens();
  dom.gameContainer?.classList.remove("hidden");
  dom.pauseOverlay?.classList.add("hidden");
  dom.boardWrapper?.classList.remove("paused");

  state.isPaused = false;
  state.isGameOver = false;
  if (dom.pauseBtn) dom.pauseBtn.textContent = "⏸ Pause";

  if (state.currentGameContext === "pvp") {
    dom.restartBtn?.classList.add("hidden");
    if (dom.homeBtn) dom.homeBtn.textContent = "🚪 Quit";

    if (isRoomPvpMode()) {
      dom.pauseBtn?.classList.add("hidden");
    } else {
      dom.pauseBtn?.classList.remove("hidden");
    }
  } else {
    dom.restartBtn?.classList.remove("hidden");
    if (dom.homeBtn) dom.homeBtn.textContent = "🏠 Home";
    dom.pauseBtn?.classList.remove("hidden");
  }

  state.timeLeft = state.currentMode.timeLeft;
  state.hintsLeft = state.currentMode.hintsLeft;
  state.reshufflesLeft = state.currentMode.reshufflesLeft ?? 0;
  state.rows = state.currentMode.rows;
  state.cols = state.currentMode.cols;
  state.cellSize = state.currentMode.cellSize;

  state.insaneShiftDirection =
    state.currentModeName === "insane" ? getRandomDirection() : null;
  state.hasSwitchedToDangerBgm = false;

  updateBoardBackground();
  applySoundSettings();
  startBgmPlaylist("normal");

  updateTimeColumnDisplay();
  updateHintDisplay();
  updateReshuffleDisplay();
  updateEndRunButton();

  initGame();
  startTimer();
}

export function restartGame() {
  if (!state.currentModeName) return;

  stopOpponentScoreTracking();
  state.opponentLiveScore = 0;
  state.opponentLiveStage = 0;

  if (state.currentGameContext === "pvp") {
    notify("Return to PvP Lobby to start a new PvP match.", "info");
    return;
  }

  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();
  stopBgm();

  resetRunProgress();
  dom.endScreen?.classList.add("hidden");

  startGame(state.currentModeName);
}

export function endContinuousRun() {
  if (state.isGameOver || !state.currentMode || state.currentPlayType !== "continuous") {
    return;
  }

  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();
  stopBgm();

  state.isGameOver = true;
  state.firstSelected = null;
  state.secondSelected = null;

  clearPath();
  renderBoard();

  state.runUsedSeconds += state.currentMode.timeLeft - state.timeLeft;

  const rank = saveLeaderboard(state.currentModeName);

  showEndScreen(
    "CONTINUOUS RUN ENDED",
    `🏴‍☠️ Stages cleared: ${state.stagesCleared}`,
    "",
    `🏆 Total Score: ${state.runTotalScore}`,
    rank ? `🔥 You reached Top ${rank} on Leaderboard!` : ""
  );
}

window.showStartScreen = showStartScreen;
window.startGame = startGame;
window.restartGame = restartGame;