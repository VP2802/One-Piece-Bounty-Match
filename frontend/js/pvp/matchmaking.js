import { state } from "../state.js";
import { dom } from "../dom.js";
import {
  joinFriendlyQueue,
  leaveFriendlyQueue,
  fetchFriendlyQueueStatus,
  joinRankedQueue,           
  leaveRankedQueue,           
  fetchRankedQueueStatus
} from "../api.js";
import { notify } from "../ui.js";
import {
  showPvpRoomCard,
  hidePvpRoomCard,
  updatePvpRoomStatus,
  startRoomMatchPolling
} from "./room.js";

export function stopFriendlyQueuePolling() {
  clearInterval(state.friendlyQueuePolling);
  state.friendlyQueuePolling = null;
}

export function startFriendlyQueuePolling() {
  stopFriendlyQueuePolling();

  state.friendlyQueuePolling = setInterval(async () => {
    if (!state.currentUser) return;

    try {
      const result = await fetchFriendlyQueueStatus(state.currentUser.id);

      if (result.status === "searching") {
        updatePvpRoomStatus("Searching for a random friendly opponent...");
        return;
      }

      if (result.status === "matched" && result.room) {
        stopFriendlyQueuePolling();

        state.currentRoomMatch = result.room;
        state.currentPvpMode = "friendly";

        notify("Random friendly match found!", "success", 1800);
        updatePvpRoomStatus(
          `Friendly room ${result.room.room_code} matched. Starting soon...`
        );

        startRoomMatchPolling("friendly");
      }
    } catch (error) {
      stopFriendlyQueuePolling();
      notify(error.message || "Friendly matchmaking failed.", "error");
    }
  }, 2000);
}

export async function handleRandomFriendlyMatch() {
  if (!state.currentUser) {
    notify("Please sign in first.", "warning");
    return;
  }

  try {
    const result = await joinFriendlyQueue(state.currentUser.id);

    showPvpRoomCard();

    if (result.status === "matched" && result.room) {
      state.currentRoomMatch = result.room;
      state.currentPvpMode = "friendly";

      notify("Random friendly match found!", "success", 1800);
      updatePvpRoomStatus(
        `Friendly room ${result.room.room_code} matched. Starting soon...`
      );

      startRoomMatchPolling("friendly");
      return;
    }

    updatePvpRoomStatus("Searching for a random friendly opponent...");
    startFriendlyQueuePolling();

    dom.randomFriendlyMatchBtn?.classList.add("hidden");
    dom.cancelRandomFriendlyMatchBtn?.classList.remove("hidden");
  } catch (error) {
    notify(error.message || "Failed to join friendly queue.", "error");
  }
}

export async function handleCancelRandomFriendlyMatch() {
  if (!state.currentUser) return;

  try {
    await leaveFriendlyQueue(state.currentUser.id);
    stopFriendlyQueuePolling();

    updatePvpRoomStatus("Random friendly search cancelled.");
    dom.randomFriendlyMatchBtn?.classList.remove("hidden");
    dom.cancelRandomFriendlyMatchBtn?.classList.add("hidden");
  } catch (error) {
    notify(error.message || "Failed to leave friendly queue.", "error");
  }
}

export async function handleRankedMatchmaking() {
  if (!state.currentUser) {
    notify("Please sign in first.", "warning");
    return;
  }

  try {
    const result = await joinRankedQueue(state.currentUser.id);

    hidePvpRoomCard();

    if (result.status === "matched" && result.room) {
      state.currentRoomMatch = result.room;
      state.currentPvpMode = "ranked";

      notify("Ranked match found!", "success", 1800);
      
      if (dom.rankedMatchStatus) {
        dom.rankedMatchStatus.textContent = `Match found! Room: ${result.room.room_code}`;
      }

      startRoomMatchPolling("ranked");
      
      dom.rankedRandomMatchBtn?.classList.remove("hidden");
      dom.cancelRankedMatchBtn?.classList.add("hidden");
      return;
    }

    if (dom.rankedMatchStatus) {
      dom.rankedMatchStatus.textContent = "Searching for a ranked opponent...";
    }
    
    startRankedQueuePolling();

    dom.rankedRandomMatchBtn?.classList.add("hidden");
    dom.cancelRankedMatchBtn?.classList.remove("hidden");
    
  } catch (error) {
    notify(error.message || "Failed to join ranked queue.", "error");
    
    dom.rankedRandomMatchBtn?.classList.remove("hidden");
    dom.cancelRankedMatchBtn?.classList.add("hidden");
    if (dom.rankedMatchStatus) {
      dom.rankedMatchStatus.textContent = "Click to find a ranked opponent automatically.";
    }
  }
}

export async function handleCancelRankedMatchmaking() {
  if (!state.currentUser) return;

  try {
    await leaveRankedQueue(state.currentUser.id);
    stopRankedQueuePolling();
    
    notify("Ranked match search cancelled.", "info", 1800);
    
    dom.rankedRandomMatchBtn?.classList.remove("hidden");
    dom.cancelRankedMatchBtn?.classList.add("hidden");
    
    if (dom.rankedMatchStatus) {
      dom.rankedMatchStatus.textContent = "Click to find a ranked opponent automatically.";
    }
  } catch (error) {
    notify(error.message || "Failed to leave ranked queue.", "error");
  }
}

export function stopRankedQueuePolling() {
  clearInterval(state.rankedQueuePolling);
  state.rankedQueuePolling = null;
}

export function startRankedQueuePolling() {
  stopRankedQueuePolling();

  state.rankedQueuePolling = setInterval(async () => {
    if (!state.currentUser) {
      stopRankedQueuePolling();
      return;
    }

    try {
      const result = await fetchRankedQueueStatus(state.currentUser.id);

      if (result.status === "searching") {
        if (dom.rankedMatchStatus) {
          dom.rankedMatchStatus.textContent = "Searching for a ranked opponent near your RP...";
        }
        return;
      }

      if (result.status === "matched" && result.room) {
        stopRankedQueuePolling();

        state.currentRoomMatch = result.room;
        state.currentPvpMode = "ranked";

        notify("Ranked match found!", "success", 1800);
        
        if (dom.rankedMatchStatus) {
          dom.rankedMatchStatus.textContent = `Match found! Starting soon...`;
        }

        dom.rankedRandomMatchBtn?.classList.remove("hidden");
        dom.cancelRankedMatchBtn?.classList.add("hidden");

        startRoomMatchPolling("ranked");
      }
      
      if (result.status === "idle") {
        stopRankedQueuePolling();
        dom.rankedRandomMatchBtn?.classList.remove("hidden");
        dom.cancelRankedMatchBtn?.classList.add("hidden");
      }
    } catch (error) {
      stopRankedQueuePolling();
      notify(error.message || "Ranked matchmaking failed.", "error");
      
      dom.rankedRandomMatchBtn?.classList.remove("hidden");
      dom.cancelRankedMatchBtn?.classList.add("hidden");
    }
  }, 2000);
}