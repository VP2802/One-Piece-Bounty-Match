import { state } from "../state.js";
import { dom } from "../dom.js";
import {
  createRoomMatch,
  joinRoomMatch,
  fetchRoomMatch,
  updateRoomMatchProgress,
  submitRoomMatchResult
} from "../api.js";
import { stopBgm } from "../audio.js";
import {
  notify,
  updateScoreDisplay,
  showEndScreen,
  closeQuitConfirm,
  setPlayType
} from "../ui.js";
import { renderPvpTop10 } from "./leaderboard.js";
import {
  stopOpponentScoreTracking,
  finishBotPracticeMatch
} from "./bot.js";
import { startGame } from "../game/offline.js";
import { clearPath, renderBoard } from "../game/board.js";
import {
  clearNextStageTimeout,
  clearPendingActions,
  getTimeBonus,
  getModeBonus
} from "../game/scoring.js";

export function isRoomPvpMode(mode = state.currentPvpMode) {
  return mode === "friendly" || mode === "ranked";
}

export function getRoomModeLabel(mode) {
  return mode === "ranked" ? "Ranked" : "Friendly";
}

export function stopRoomMatchPolling() {
  clearInterval(state.roomMatchPolling);
  state.roomMatchPolling = null;
}

export function showPvpRoomCard() {
  dom.pvpRoomCard?.classList.remove("hidden");
}

export function hidePvpRoomCard() {
  dom.pvpRoomCard?.classList.add("hidden");
}

export function updatePvpRoomStatus(message) {
  if (dom.roomStatusText) {
    dom.roomStatusText.textContent = message;
  }
}

export function updatePvpRoomCard(mode) {
  const label = getRoomModeLabel(mode);

  if (dom.pvpRoomTitle) {
    dom.pvpRoomTitle.textContent = `${label} Room`;
  }

  updatePvpRoomStatus(`Create a ${mode} room or join with a room code.`);
}

export function stopRoomMatchProgressTracking() {
  clearInterval(state.roomMatchProgressInterval);
  state.roomMatchProgressInterval = null;
}

export function startRoomMatchProgressTracking(mode) {
  stopRoomMatchProgressTracking();

  if (!isRoomPvpMode(mode) || !state.currentRoomMatch || !state.currentUser) return;

  state.roomMatchProgressInterval = setInterval(async () => {
    try {
      await updateRoomMatchProgress(mode, {
        room_code: state.currentRoomMatch.room_code,
        user_id: state.currentUser.id,
        score: state.score,
        stage: 0
      });
    } catch {}
  }, 1000);
}

export async function handleCreateRoomMatch(mode) {
  if (!state.currentUser) {
    notify("Please sign in first.", "warning");
    return;
  }

  try {
    const result = await createRoomMatch(mode, state.currentUser.id);
    state.currentRoomMatch = result.room;
    state.currentPvpMode = mode;

    if (dom.roomCodeInput) {
      dom.roomCodeInput.value = state.currentRoomMatch.room_code;
    }

    showPvpRoomCard();
    updatePvpRoomStatus(
      `${getRoomModeLabel(mode)} room ${state.currentRoomMatch.room_code} created. Waiting for opponent...`
    );
    if (dom.pvpRoomTitle) {
      dom.pvpRoomTitle.textContent = `${getRoomModeLabel(mode)} Room`;
    }

    startRoomMatchPolling(mode);
  } catch (error) {
    notify(error.message || `Failed to create ${mode} room.`, "error");
  }
}

export async function handleJoinRoomMatch(mode) {
  if (!state.currentUser) {
    notify("Please sign in first.", "warning");
    return;
  }

  const roomCode = dom.roomCodeInput?.value.trim().toUpperCase();

  if (!roomCode) {
    notify("Please enter room code.", "warning");
    return;
  }

  try {
    const result = await joinRoomMatch(mode, state.currentUser.id, roomCode);
    state.currentRoomMatch = result.room;
    state.currentPvpMode = mode;

    showPvpRoomCard();
    updatePvpRoomStatus(
      `Joined ${getRoomModeLabel(mode)} room ${state.currentRoomMatch.room_code}. Match is ready!`
    );
    if (dom.pvpRoomTitle) {
      dom.pvpRoomTitle.textContent = `${getRoomModeLabel(mode)} Room`;
    }

    startRoomMatchPolling(mode);
  } catch (error) {
    notify(error.message || `Failed to join ${mode} room.`, "error");
  }
}

export function startRoomMatchPolling(mode) {
  stopRoomMatchPolling();

  if (!state.currentRoomMatch?.room_code) return;

  state.roomMatchPolling = setInterval(async () => {
    try {
      const previousStatus = state.currentRoomMatch?.status;
      const result = await fetchRoomMatch(mode, state.currentRoomMatch.room_code);
      state.currentRoomMatch = result.room;

      if (state.currentRoomMatch?.live_progress && state.currentUser) {
        const isHost = state.currentRoomMatch.host_user?.id === state.currentUser.id;
        const opponentProgress = isHost
          ? state.currentRoomMatch.live_progress.guest
          : state.currentRoomMatch.live_progress.host;

        state.opponentLiveScore = opponentProgress?.score ?? 0;
        state.opponentLiveStage = opponentProgress?.stage ?? 0;
        updateScoreDisplay();
      }

      if (state.currentRoomMatch.status === "waiting") {
        updatePvpRoomStatus(
          `${getRoomModeLabel(mode)} room ${state.currentRoomMatch.room_code} is waiting for opponent...`
        );
        return;
      }

      if (state.currentRoomMatch.status === "ready") {
        const isHost = state.currentRoomMatch.host_user?.id === state.currentUser?.id;
        const guestName = state.currentRoomMatch.guest_user?.player_name;

        if (previousStatus !== "ready" && isHost && guestName) {
          notify(`${guestName} accepted your invite!`, "success", 2200);
        }

        updatePvpRoomStatus(
          `${getRoomModeLabel(mode)} room ${state.currentRoomMatch.room_code} is ready. Starting match...`
        );

        if (state.currentGameContext !== "pvp") {
          startRoomMatch(state.currentRoomMatch, mode);
        }
      }
    } catch (error) {
      stopRoomMatchPolling();
      notify(
        error.message || `${getRoomModeLabel(mode)} room polling failed.`,
        "error"
      );
    }
  }, 2000);
}

export function startRoomMatch(room, mode) {
  if (!room || !room.random_mode || !room.board_seed) {
    notify(`Invalid ${mode} room config.`, "error");
    return;
  }

  state.currentPvpMode = mode;
  state.currentGameContext = "pvp";
  state.currentEntryMode = "pvp";
  state.currentPlayType = "single";
  state.currentBoardSeed = room.board_seed;

  setPlayType("single");
  startGame(room.random_mode);
  startRoomMatchProgressTracking(mode);

  notify(
    `${getRoomModeLabel(mode)} Match • Room ${room.room_code} • ${room.random_mode.toUpperCase()}`,
    "info",
    3000
  );
}

export async function finishRoomMatch(didClearBoard, mode) {
  if (!state.currentUser || !state.currentRoomMatch || !state.currentMode) return;

  clearInterval(state.timeInterval);
  clearNextStageTimeout();
  clearPendingActions();
  stopBgm();
  stopRoomMatchProgressTracking();
  stopOpponentScoreTracking();
  stopRoomMatchPolling();

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
    const result = await submitRoomMatchResult(mode, {
      room_code: state.currentRoomMatch.room_code,
      user_id: state.currentUser.id,
      score: finalPlayerScore,
      stage: playerStage,
      time_seconds: timeUsedSeconds
    });

    if (result.status === "waiting_for_opponent") {
      showEndScreen(
        "WAITING FOR OPPONENT",
        `Your ${mode} result has been submitted.`,
        "",
        `🏆 Your Score: ${finalPlayerScore}`,
        "The final result will be available after your opponent finishes."
      );
      return;
    }

    const saved = result.saved_match;
    const isHost = state.currentRoomMatch.host_user?.id === state.currentUser.id;
    const myPlayer = isHost ? saved.player1 : saved.player2;
    const opponentPlayer = isHost ? saved.player2 : saved.player1;

    state.currentUser = {
      ...state.currentUser,
      ranking_points: myPlayer.ranking_points,
      current_rank: myPlayer.current_rank
    };

    let title = "DRAW!";
    if (
      (isHost && saved.result === "player1_win") ||
      (!isHost && saved.result === "player2_win")
    ) {
      title = "VICTORY!";
    } else if (saved.result !== "draw") {
      title = "DEFEAT!";
    }

    if (mode === "ranked") {
      const rpText =
        myPlayer.rank_change > 0
          ? `+${myPlayer.rank_change} RP`
          : `${myPlayer.rank_change} RP`;

      showEndScreen(
        title,
        `⚔️ Ranked Match Result • ${saved.result}`,
        `📈 RP Change: ${rpText}`,
        `🏆 New Rank: ${myPlayer.current_rank}`,
        `⚓ Your RP: ${myPlayer.ranking_points} • Opponent RP: ${opponentPlayer.ranking_points}`
      );
    } else {
      showEndScreen(
        title,
        `⚔️ Friendly Match Result • ${saved.result}`,
        `🤝 Friendly mode does not change rank points.`,
        `🏆 Your Rank: ${myPlayer.current_rank}`,
        `⚓ Your RP: ${myPlayer.ranking_points} • Opponent RP: ${opponentPlayer.ranking_points}`
      );
    }

    state.currentRoomMatch = null;
    state.currentBoardSeed = null;
    state.currentPvpMode = null;

    try {
      await renderPvpTop10();
    } catch {}
  } catch (error) {
    showEndScreen(
      "MATCH ERROR",
      `Failed to submit ${mode} result.`,
      error.message || "",
      `🏆 Your Score: ${finalPlayerScore}`,
      ""
    );
  }
}

export async function handleFriendlyPvpMatch() {
  state.currentPvpMode = "friendly";

  const rankedRoomDiv = document.querySelector(".ranked-room");
  if (rankedRoomDiv) {
    rankedRoomDiv.classList.add("hidden");
  }

  showPvpRoomCard();
  updatePvpRoomCard("friendly");
}

export async function handleRankedPvpMatch() {
  state.currentPvpMode = "ranked";
  
  hidePvpRoomCard();
  
  const rankedRoomDiv = document.querySelector(".ranked-room");
  if (rankedRoomDiv) {
    rankedRoomDiv.classList.remove("hidden");
  }
  
  if (dom.rankedMatchStatus) {
    dom.rankedMatchStatus.textContent = "Click 'Random Match' to find an opponent";
  }
  
  if (dom.rankedRandomMatchBtn) {
    dom.rankedRandomMatchBtn.classList.remove("hidden");
  }
  
  if (dom.cancelRankedMatchBtn) {
    dom.cancelRankedMatchBtn.classList.add("hidden");
  }
}

export async function quitCurrentPvpMatch() {
  if (state.currentGameContext !== "pvp" || !state.currentMode) return;

  closeQuitConfirm();

  state.timeLeft = 0;
  state.isGameOver = true;

  state.score = 0;
  updateScoreDisplay();

  if (isRoomPvpMode()) {
    await finishRoomMatch(false, state.currentPvpMode);
  } else {
    await finishBotPracticeMatch(false);
  }
}