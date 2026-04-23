import { state } from "./state.js";
import { dom } from "./dom.js";
import {
  loadSoundSettings,
  applySoundSettings,
  saveSoundSettings,
  turnOnSound,
  turnOffSound,
  playNextBgmTrack,
  bgmAudio,
  pauseBgm,
  resumeBgm
} from "./audio.js";
import {
  notify,
  showModeSelectScreen,
  showOfflineStartScreen,
  showAuthScreen,
  showPvpLobbyScreen,
  closeQuitConfirm,
  openQuitConfirm,
  setPlayType,
  syncTimeColumnHeight
} from "./ui.js";
import { setSelectedFaction, handleAuth } from "./pvp/auth.js";
import { handlePracticeBotMatch } from "./pvp/bot.js";
import {
  handleFriendlyPvpMatch,
  handleRankedPvpMatch,
  handleCreateRoomMatch,
  handleJoinRoomMatch,
  quitCurrentPvpMatch,
  isRoomPvpMode
} from "./pvp/room.js";
import {
  openProfileHistoryModal,
  closeProfileHistoryModal
} from "./pvp/profile.js";
import { handlePlayerSearch } from "./pvp/social.js";
import { renderFriendsAndRequests } from "./pvp/friends.js";
import {
  handleRandomFriendlyMatch,
  handleCancelRandomFriendlyMatch
} from "./pvp/matchmaking.js";
import {
  showStartScreen,
  startGame,
  restartGame,
  renderLeaderboard,
  endContinuousRun
} from "./game/offline.js";
import { useHint, useManualReshuffle } from "./game/scoring.js";
import { startTimer } from "./game/timer.js";
import { resizeCanvas, clearPath } from "./game/board.js";

function handleSoundToggle() {
  if (state.isSoundOn) {
    turnOffSound();
    notify("Sound turned off.", "info", 1800);
  } else {
    turnOnSound();
    notify("Sound turned on.", "success", 1800);
  }
}

function handleVolumeChange(event) {
  const value = Number(event.target.value || 0);
  state.masterVolume = Math.max(0, Math.min(1, value / 100));

  if (state.masterVolume <= 0) {
    state.isSoundOn = false;
  } else if (!state.isSoundOn) {
    state.isSoundOn = true;
  }

  applySoundSettings();
  saveSoundSettings();
}

async function handleHomeClick() {
  if (state.currentGameContext === "pvp" && state.currentMode && !state.isGameOver) {
    openQuitConfirm();
    return;
  }

  if (state.currentEntryMode === "pvp") {
    await openPvpLobbyAndRefreshSocial();
  } else {
    showOfflineStartScreen();
  }
}

function handlePauseToggle() {
  if (isRoomPvpMode()) return;
  if (!state.currentMode || state.isGameOver || state.isBoardBusy) return;

  state.isPaused = !state.isPaused;

  if (state.isPaused) {
    clearInterval(state.timeInterval);
    clearPath();
    pauseBgm();
    dom.pauseOverlay?.classList.remove("hidden");
    dom.boardWrapper?.classList.add("paused");
    if (dom.pauseBtn) dom.pauseBtn.textContent = "▶ Resume";
    return;
  }

  dom.pauseOverlay?.classList.add("hidden");
  dom.boardWrapper?.classList.remove("paused");
  if (dom.pauseBtn) dom.pauseBtn.textContent = "⏸ Pause";
  resumeBgm();
  startTimer();
}

async function openPvpLobbyAndRefreshSocial() {
  await showPvpLobbyScreen();
  await renderFriendsAndRequests();
}

function handleEndRun() {
  if (state.currentGameContext === "pvp") return;
  endContinuousRun();
}

function bindModeSelectEvents() {
  dom.offlineEntryBtn?.addEventListener("click", showOfflineStartScreen);
  dom.pvpEntryBtn?.addEventListener("click", () => showAuthScreen("signin"));
}

function bindAuthEvents() {
  dom.authBackBtn?.addEventListener("click", showModeSelectScreen);

  dom.pirateFactionBtn?.addEventListener("click", () => {
    setSelectedFaction("pirate");
  });

  dom.marineFactionBtn?.addEventListener("click", () => {
    setSelectedFaction("marine");
  });

  dom.signUpBtn?.addEventListener("click", async () => {
    await handleAuth("signup");
  });

  dom.signInBtn?.addEventListener("click", async () => {
    await handleAuth("signin");
  });

  dom.authPlayerNameInput?.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await handleAuth(state.authMode || "signin");
  });
}

function bindLobbyEvents() {
  dom.pvpLobbyBackBtn?.addEventListener("click", showModeSelectScreen);

  dom.practiceBotBtn?.addEventListener("click", async () => {
    await handlePracticeBotMatch();
  });

  dom.friendlyPvpBtn?.addEventListener("click", async () => {
    await handleFriendlyPvpMatch();
  });

  dom.rankedPvpBtn?.addEventListener("click", async () => {
    await handleRankedPvpMatch();
  });

  dom.createRoomBtn?.addEventListener("click", async () => {
    if (state.currentPvpMode === "ranked") {
      await handleCreateRoomMatch("ranked");
      return;
    }

    await handleCreateRoomMatch("friendly");
  });

  dom.joinRoomBtn?.addEventListener("click", async () => {
    if (state.currentPvpMode === "ranked") {
      await handleJoinRoomMatch("ranked");
      return;
    }

    await handleJoinRoomMatch("friendly");
  });

  dom.roomCodeInput?.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    if (state.currentPvpMode === "ranked") {
      await handleJoinRoomMatch("ranked");
      return;
    }

    await handleJoinRoomMatch("friendly");
  });

  dom.randomFriendlyMatchBtn?.addEventListener("click", async () => {
    await handleRandomFriendlyMatch();
  });

  dom.cancelRandomFriendlyMatchBtn?.addEventListener("click", async () => {
    await handleCancelRandomFriendlyMatch();
  });

  dom.rankedRandomMatchBtn?.addEventListener("click", async () => {
    await handleRankedMatchmaking();  
  });
}

function bindOfflineScreenEvents() {
  dom.offlineBackToModeSelectBtn?.addEventListener("click", showModeSelectScreen);

  dom.singleRunBtn?.addEventListener("click", () => {
    setPlayType("single");
  });

  dom.continuousRunBtn?.addEventListener("click", () => {
    setPlayType("continuous");
  });
}

function bindGameTopbarEvents() {
  dom.homeBtn?.addEventListener("click", handleHomeClick);
  dom.restartBtn?.addEventListener("click", restartGame);
  dom.pauseBtn?.addEventListener("click", handlePauseToggle);
  dom.hintBtn?.addEventListener("click", useHint);
  dom.reshuffleBtn?.addEventListener("click", useManualReshuffle);
  dom.endRunBtn?.addEventListener("click", handleEndRun);

  dom.soundBtn?.addEventListener("click", handleSoundToggle);
  dom.volumeSlider?.addEventListener("input", handleVolumeChange);
}

function bindQuitConfirmEvents() {
  dom.confirmQuitBtn?.addEventListener("click", async () => {
    await quitCurrentPvpMatch();
  });

  dom.cancelQuitBtn?.addEventListener("click", () => {
    closeQuitConfirm();
  });

  document.addEventListener("keydown", async (event) => {
    if (dom.quitConfirmOverlay?.classList.contains("hidden")) return;

    if (event.key === "Enter") {
      event.preventDefault();
      await quitCurrentPvpMatch();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeQuitConfirm();
    }
  });
}

function bindEndScreenEvents() {
  dom.backToPvpLobbyBtn?.addEventListener("click", async () => {
    await openPvpLobbyAndRefreshSocial();
  });

  dom.backToOfflineScreenBtn?.addEventListener("click", () => {
    showOfflineStartScreen();
  });

  const restartFromEndBtn = document.getElementById("restartFromEndBtn");
  restartFromEndBtn?.addEventListener("click", restartGame);
}

function bindAudioAutoNextTrack() {
  if (!state._bgmBound) {
    bgmAudio.addEventListener("ended", playNextBgmTrack);
    state._bgmBound = true;
  }
}

function bindWindowEvents() {
  window.addEventListener("resize", () => {
    if (dom.gameContainer?.classList.contains("hidden")) return;
    resizeCanvas();
    syncTimeColumnHeight();
    clearPath();
  });
}

function bindProfileHistoryEvents() {
  dom.myProfileHistoryBtn?.addEventListener("click", async () => {
    if (!state.currentUser) return;
    await openProfileHistoryModal(state.currentUser.id);
  });

  dom.closeProfileHistoryBtn?.addEventListener("click", () => {
    closeProfileHistoryModal();
  });
}

function bindPlayerSearchEvents() {
  dom.playerSearchBtn?.addEventListener("click", async () => {
    await handlePlayerSearch();
  });

  dom.playerSearchInput?.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    await handlePlayerSearch();
  });
}

function bindAllEvents() {
  bindModeSelectEvents();
  bindAuthEvents();
  bindLobbyEvents();
  bindOfflineScreenEvents();
  bindGameTopbarEvents();
  bindQuitConfirmEvents();
  bindEndScreenEvents();
  bindWindowEvents();
  bindAudioAutoNextTrack();
  bindProfileHistoryEvents();
  bindPlayerSearchEvents();
}

function initGlobals() {
  state.authMode = "signin";
  state.selectedFaction = "pirate";

  if (dom.volumeSlider) {
    dom.volumeSlider.value = String(Math.round((state.masterVolume ?? 0.25) * 100));
  }

  window.state = state;
  window.startGame = startGame;
  window.restartGame = restartGame;
  window.showStartScreen = showStartScreen;
  window.showModeSelectScreen = showModeSelectScreen;
  window.showPvpLobbyScreen = showPvpLobbyScreen;
}

function init() {
  loadSoundSettings();
  applySoundSettings();
  initGlobals();
  setSelectedFaction("pirate");
  setPlayType("single");
  renderLeaderboard();
  bindAllEvents();
  showModeSelectScreen();
}

init();