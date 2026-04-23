import { state } from "./state.js";
import { dom } from "./dom.js";
import { stopBgm, pauseBgm, resumeBgm } from "./audio.js";
import { startTimer } from "./game/timer.js";
import { clearPendingActions, clearNextStageTimeout } from "./game/scoring.js";
import { renderPvpTop10 } from "./pvp/leaderboard.js";
import { stopOpponentScoreTracking } from "./pvp/bot.js";
import {
  stopRoomMatchPolling,
  stopRoomMatchProgressTracking,
  hidePvpRoomCard
} from "./pvp/room.js";
import { prepareAuthScreen } from "./pvp/auth.js";

function assetUrl(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

export function formatTime(seconds) {
  const minute = Math.floor(seconds / 60);
  const second = seconds % 60;
  return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

export function formatFactionLabel(faction) {
  return faction === "marine" ? "Marine" : "Pirate";
}

export function notify(message, type = "info", duration = 2500) {
  if (!dom.toastContainer) return;

  const normalizedType = String(type).toLowerCase();
  const key = `${normalizedType}:${message}`;

  if (!state.activeToastKeys) {
    state.activeToastKeys = new Set();
  }

  if (state.activeToastKeys.has(key)) return;
  state.activeToastKeys.add(key);

  const toast = document.createElement("div");
  toast.className = `toast toast-${normalizedType}`;
  toast.textContent = message;
  dom.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("hide");
    toast.addEventListener(
      "animationend",
      () => {
        state.activeToastKeys.delete(key);
        toast.remove();
      },
      { once: true }
    );
  }, duration);
}

export function setPlayType(type) {
  state.currentPlayType = type;

  if (dom.singleRunBtn) {
    dom.singleRunBtn.classList.toggle("active", type === "single");
  }

  if (dom.continuousRunBtn) {
    dom.continuousRunBtn.classList.toggle("active", type === "continuous");
  }

  if (dom.playTypeDescription) {
    dom.playTypeDescription.textContent =
      type === "single"
        ? "Play exactly 1 match and get the final result."
        : "Keep playing stage after stage with accumulated score until you press End or lose.";
  }
}

export function updateScoreDisplay() {
  if (!dom.scoreElement) return;

  if (state.currentGameContext === "pvp") {
    const modeLabel =
      state.currentBotMatch?.random_mode ||
      state.currentRoomMatch?.random_mode ||
      state.currentModeName ||
      "";

    dom.scoreElement.textContent =
      `You: ${state.score} • Opponent: ${state.opponentLiveScore} • Mode: ${String(modeLabel).toUpperCase()}`;
    return;
  }

  if (state.currentPlayType === "continuous") {
    dom.scoreElement.textContent =
      `Total: ${state.runTotalScore} | Stage Score: ${state.score} | Stage: ${state.currentStage}`;
  } else {
    dom.scoreElement.textContent = `Score: ${state.score}`;
  }
}

export function updateHintDisplay() {
  if (!dom.hintBtn) return;

  if (!state.currentMode || state.currentModeName !== "easy" || state.hintsLeft <= 0) {
    dom.hintBtn.classList.add("hidden");
    dom.hintBtn.disabled = true;
    dom.hintBtn.textContent = "💡Hints";
    return;
  }

  dom.hintBtn.classList.remove("hidden");
  dom.hintBtn.disabled = false;
  dom.hintBtn.textContent = `💡Hints: ${state.hintsLeft}`;
}

export function updateReshuffleDisplay() {
  if (!dom.reshuffleBtn) return;

  if (!state.currentModeName) {
    dom.reshuffleBtn.classList.add("hidden");
    dom.reshuffleBtn.disabled = true;
    dom.reshuffleBtn.textContent = "🔄 Reshuffle";
    return;
  }

  if (state.currentModeName === "easy") {
    const shouldShow = state.hintsLeft <= 0;

    if (!shouldShow) {
      dom.reshuffleBtn.classList.add("hidden");
      dom.reshuffleBtn.disabled = true;
      dom.reshuffleBtn.textContent = "🔄 Reshuffle";
      return;
    }

    dom.reshuffleBtn.classList.remove("hidden");
    dom.reshuffleBtn.textContent = `🔄 Reshuffle: ${state.reshufflesLeft}`;
    dom.reshuffleBtn.disabled = state.reshufflesLeft <= 0;
    return;
  }

  const manualModes = ["hard", "insane"];
  if (!manualModes.includes(state.currentModeName)) {
    dom.reshuffleBtn.classList.add("hidden");
    dom.reshuffleBtn.disabled = true;
    dom.reshuffleBtn.textContent = "🔄 Reshuffle";
    return;
  }

  dom.reshuffleBtn.classList.remove("hidden");
  dom.reshuffleBtn.textContent = `🔄 Reshuffle: ${state.reshufflesLeft}`;
  dom.reshuffleBtn.disabled = state.reshufflesLeft <= 0;
}

export function updateEndRunButton() {
  if (!dom.endRunBtn) return;

  if (state.currentPlayType === "continuous" && state.currentModeName) {
    dom.endRunBtn.classList.remove("hidden");
    dom.endRunBtn.disabled = false;
  } else {
    dom.endRunBtn.classList.add("hidden");
    dom.endRunBtn.disabled = true;
  }
}

export function updateTimeColumnDisplay() {
  if (!dom.timeBar || !dom.timeBarValue) return;

  if (!state.currentMode) {
    dom.timeBar.style.height = "0%";
    dom.timeBar.classList.remove("warning", "danger");
    dom.timeBarValue.textContent = "00:00";
    return;
  }

  const ratio = Math.max(0, Math.min(1, state.timeLeft / state.currentMode.timeLeft));
  dom.timeBar.style.height = `${ratio * 100}%`;
  dom.timeBar.classList.remove("warning", "danger");

  if (ratio <= 0.2) {
    dom.timeBar.classList.add("danger");
  } else if (ratio <= 0.5) {
    dom.timeBar.classList.add("warning");
  }

  dom.timeBarValue.textContent = formatTime(Math.max(0, state.timeLeft));
}

export function updateBoardBackground() {
  if (!dom.boardElement) return;

  const backgroundMap = {
    easy: assetUrl("../image/board_easy.jpg"),
    hard: assetUrl("../image/board_hard.jpg"),
    insane: assetUrl("../image/board_insane.jpg"),
    impossible: assetUrl("../image/board_impossible.jpg")
  };

  const background = backgroundMap[state.currentModeName];
  dom.boardElement.style.backgroundImage = background ? `url("${background}")` : "none";
}

export function syncTimeColumnHeight() {
  if (!dom.boardWrapper || !dom.timeTrack || !dom.timeColumn) return;

  const boardHeight = dom.boardWrapper.offsetHeight;

  const columnStyle = window.getComputedStyle(dom.timeColumn);
  const gap = parseFloat(columnStyle.rowGap || columnStyle.gap || 0);

  let titleHeight = 0;
  let valueHeight = 0;

  if (dom.timeTitle) titleHeight = dom.timeTitle.offsetHeight;
  if (dom.timeBarValue) valueHeight = dom.timeBarValue.offsetHeight;

  const verticalPadding =
    parseFloat(columnStyle.paddingTop || 0) +
    parseFloat(columnStyle.paddingBottom || 0);

  const trackHeight =
    boardHeight - titleHeight - valueHeight - gap * 2 - verticalPadding;

  if (trackHeight > 120) {
    dom.timeTrack.style.height = `${trackHeight}px`;
  }
}

export function hideAllMainScreens() {
  dom.modeSelectScreen?.classList.add("hidden");
  dom.authScreen?.classList.add("hidden");
  dom.pvpLobbyScreen?.classList.add("hidden");

  dom.startScreen?.classList.add("hidden");
  dom.gameContainer?.classList.add("hidden");
  dom.endScreen?.classList.add("hidden");
  dom.pauseOverlay?.classList.add("hidden");
  dom.boardWrapper?.classList.remove("paused");
}

export function openQuitConfirm() {
  if (state.currentGameContext !== "pvp" || !dom.quitConfirmOverlay) return;

  const isFriendly = state.currentPvpMode === "friendly";
  const isBot = state.currentPvpMode === "bot_practice";
  const isRanked = state.currentPvpMode === "ranked";

  if (dom.quitConfirmText) {
    dom.quitConfirmText.textContent = isFriendly
      ? "If you quit now, you will lose this Friendly match and the result will be saved to match history."
      : isBot
        ? "If you quit now, you will lose this Bot match and the result will be saved to match history."
        : isRanked
          ? "If you quit now, you will lose this Ranked match, the result will be saved, and your rank points will decrease."
          : "If you quit now, you will lose this PvP match and the result will be saved to match history.";
  }

  state.isPaused = true;
  clearInterval(state.timeInterval);
  pauseBgm();

  dom.quitConfirmOverlay.classList.remove("hidden");
  dom.boardWrapper?.classList.add("paused");
}

export function closeQuitConfirm() {
  if (!dom.quitConfirmOverlay) return;

  dom.quitConfirmOverlay.classList.add("hidden");

  if (!state.isGameOver && state.currentMode && state.currentGameContext === "pvp") {
    state.isPaused = false;
    dom.boardWrapper?.classList.remove("paused");
    resumeBgm();
    startTimer();
  }
}

export function showModeSelectScreen() {
  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();
  stopBgm();

  stopOpponentScoreTracking();
  state.opponentLiveScore = 0;
  state.opponentLiveStage = 0;

  state.isPaused = false;
  state.isGameOver = false;
  state.currentMode = null;
  state.currentModeName = null;
  state.score = 0;

  state.currentEntryMode = null;
  state.currentUser = null;
  state.currentBotMatch = null;
  state.currentGameContext = "offline";

  state.currentPvpMode = null;
  state.currentBoardSeed = null;
  state.currentRoomMatch = null;

  stopRoomMatchPolling();
  stopRoomMatchProgressTracking();
  hidePvpRoomCard();

  if (dom.authPlayerNameInput) {
    dom.authPlayerNameInput.value = "";
  }

  if (dom.authPasswordInput) dom.authPasswordInput.value = "";
  if (dom.authConfirmPasswordInput) dom.authConfirmPasswordInput.value = "";

  hideAllMainScreens();
  dom.modeSelectScreen?.classList.remove("hidden");
  dom.quitConfirmOverlay?.classList.add("hidden");
  dom.boardWrapper?.classList.remove("paused");

  if (dom.restartBtn) dom.restartBtn.classList.remove("hidden");
  if (dom.homeBtn) dom.homeBtn.textContent = "🏠 Home";
  if (dom.pauseBtn) dom.pauseBtn.classList.remove("hidden");
}

export function showOfflineStartScreen() {
  state.currentEntryMode = "offline";
  if (typeof window.showStartScreen === "function") {
    window.showStartScreen();
  }
}

export function showAuthScreen(mode = "signin") {
  state.currentEntryMode = "pvp";
  state.authMode = mode;

  hideAllMainScreens();
  dom.authScreen?.classList.remove("hidden");

  if (typeof prepareAuthScreen === "function") {
    prepareAuthScreen(mode);
  }
}

export async function showPvpLobbyScreen() {
  hideAllMainScreens();
  dom.pvpLobbyScreen?.classList.remove("hidden");

  if (dom.pvpWelcomeText && state.currentUser) {
    dom.pvpWelcomeText.textContent =
      `${state.currentUser.player_name} • ${formatFactionLabel(state.currentUser.faction)}`;
  }

  if (dom.pvpProfileText && state.currentUser) {
    const parts = [
      state.currentUser.current_rank ?? "Unranked",
      `${state.currentUser.ranking_points ?? 0} RP`,
      `High Score: ${state.currentUser.highest_score ?? 0}`,
      `Best Stage: ${state.currentUser.highest_stage ?? 1}`,
      `Best Time: ${formatTime(state.currentUser.best_run_time_seconds ?? 0)}`
    ];
    dom.pvpProfileText.textContent = parts.join(" • ");
  }

  await renderPvpTop10();

  const rankedRoomDiv = document.querySelector(".ranked-room");
  if (rankedRoomDiv) {
    rankedRoomDiv.classList.add("hidden");
  }

  hidePvpRoomCard();
  stopRoomMatchPolling();
  stopRoomMatchProgressTracking();
  stopOpponentScoreTracking();

  if (dom.rankedRandomMatchBtn) {
    dom.rankedRandomMatchBtn.classList.remove("hidden");
  }
  if (dom.cancelRankedMatchBtn) {
    dom.cancelRankedMatchBtn.classList.add("hidden");
  }
  if (dom.rankedMatchStatus) {
    dom.rankedMatchStatus.textContent = "Click to find a ranked opponent automatically.";
  }

  if (state.rankedQueuePolling) {
    clearInterval(state.rankedQueuePolling);
    state.rankedQueuePolling = null;
  }

  state.currentBoardSeed = null;
  state.currentPvpMode = null;
  state.currentBotMatch = null;
  state.opponentLiveScore = 0;
  state.opponentLiveStage = 0;
  state.currentRoomMatch = null;
}

export function showEndScreen(
  message,
  bonusText = "",
  modeBonusText = "",
  totalScoreText = "",
  leaderBoardRankText = ""
) {
  dom.startScreen?.classList.add("hidden");
  dom.gameContainer?.classList.add("hidden");
  dom.endScreen?.classList.remove("hidden");

  if (dom.endMessage) dom.endMessage.textContent = message;
  if (dom.bonusMessage) dom.bonusMessage.textContent = bonusText;
  if (dom.modeBonusMessage) dom.modeBonusMessage.textContent = modeBonusText;
  if (dom.totalScoreMessage) dom.totalScoreMessage.textContent = totalScoreText;
  if (dom.leaderboardRankMessage) dom.leaderboardRankMessage.textContent = leaderBoardRankText;

  dom.endScreen?.classList.remove("win-flash");
  dom.endMessage?.classList.remove("win-pop");

  if (dom.backToPvpLobbyBtn) {
    const shouldShowPvpBack = state.currentGameContext === "pvp";
    dom.backToPvpLobbyBtn.classList.toggle("hidden", !shouldShowPvpBack);
  }

  if (dom.backToOfflineScreenBtn) {
    const shouldShowOfflineBack =
      state.currentGameContext !== "pvp" && state.currentEntryMode === "offline";
    dom.backToOfflineScreenBtn.classList.toggle("hidden", !shouldShowOfflineBack);
  }

  if (message.includes("WIN")) {
    void dom.endScreen?.offsetWidth;
    void dom.endMessage?.offsetWidth;
    dom.endScreen?.classList.add("win-flash");
    dom.endMessage?.classList.add("win-pop");
  }
}

export function showStageClearOverlay(stageNumber, timeBonus, modeBonus) {
  if (dom.endMessage) dom.endMessage.textContent = `STAGE ${stageNumber} CLEARED!`;
  if (dom.bonusMessage) dom.bonusMessage.textContent = `⚡ Time bonus: +${timeBonus}`;
  if (dom.modeBonusMessage) dom.modeBonusMessage.textContent = `🎯 Mode bonus: +${modeBonus}`;
  if (dom.totalScoreMessage) dom.totalScoreMessage.textContent = `🏆 Total Score: ${state.runTotalScore}`;
  if (dom.leaderboardRankMessage) {
    dom.leaderboardRankMessage.textContent = "Next stage is starting...";
  }

  dom.startScreen?.classList.add("hidden");
  dom.gameContainer?.classList.add("hidden");
  dom.endScreen?.classList.remove("hidden");

  dom.endScreen?.classList.remove("win-flash");
  dom.endMessage?.classList.remove("win-pop");
}