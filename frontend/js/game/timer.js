import { state } from "../state.js";
import { loseSound, startBgmPlaylist, stopBgm } from "../audio.js";
import { updateTimeColumnDisplay, showEndScreen } from "../ui.js";
import { saveLeaderboard } from "./offline.js";
import { isRoomPvpMode, finishRoomMatch } from "../pvp/room.js";
import { finishBotPracticeMatch } from "../pvp/bot.js";
import { clearPendingActions } from "./scoring.js";
import { clearPath, renderBoard } from "./board.js";
import { clearNextStageTimeout } from "./scoring.js";

export function startTimer() {
  clearInterval(state.timeInterval);

  state.timeInterval = setInterval(() => {
    state.timeLeft--;
    if (state.timeLeft < 0) state.timeLeft = 0;

    updateTimeColumnDisplay();

    if (state.timeLeft === 60 && !state.hasSwitchedToDangerBgm) {
      state.hasSwitchedToDangerBgm = true;
      startBgmPlaylist("danger");
    }

    if (state.timeLeft === 0) {
      if (state.isBoardBusy) return;
      handleTimeUp();
    }
  }, 1000);
}

export function handleTimeUp() {
  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();
  stopBgm();

  state.isGameOver = true;
  state.firstSelected = null;
  state.secondSelected = null;

  clearPath();
  renderBoard();

  loseSound.currentTime = 0;
  loseSound.play().catch(() => {});

  if (state.currentMode) {
    state.runUsedSeconds += state.currentMode.timeLeft - state.timeLeft;
  }

  if (state.currentGameContext === "pvp") {
    if (isRoomPvpMode()) {
      void finishRoomMatch(false, state.currentPvpMode);
    } else {
      void finishBotPracticeMatch(false);
    }
    return;
  }

  const finalScore =
    state.currentPlayType === "continuous"
      ? state.runTotalScore
      : state.score;

  const rank = saveLeaderboard(state.currentModeName);

  showEndScreen(
    "TIME'S UP!",
    `🏴‍☠️ Stages cleared: ${state.stagesCleared}`,
    "",
    `🏆 Total Score: ${finalScore}`,
    rank ? `🔥 You reached Top ${rank} on Leaderboard!` : ""
  );
}