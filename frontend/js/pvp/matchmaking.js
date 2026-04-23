import { state } from "../state.js";
import { dom } from "../dom.js";
import {
  joinFriendlyQueue,
  leaveFriendlyQueue,
  fetchFriendlyQueueStatus
} from "../api.js";
import { notify } from "../ui.js";
import {
  showPvpRoomCard,
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

    showPvpRoomCard();

    if (result.status === "matched" && result.room) {
      state.currentRoomMatch = result.room;
      state.currentPvpMode = "ranked";

      notify("Ranked match found!", "success", 1800);
      updatePvpRoomStatus(
        `Ranked room ${result.room.room_code} matched. Starting soon...`
      );

      startRoomMatchPolling("ranked");
      return;
    }

    updatePvpRoomStatus("Searching for a ranked opponent...");
    startRankedQueuePolling();

    dom.findRankedMatchBtn?.classList.add("hidden");
    dom.cancelRankedMatchBtn?.classList.remove("hidden");
  } catch (error) {
    notify(error.message || "Failed to join ranked queue.", "error");
  }
}

export function stopRankedQueuePolling() {
  clearInterval(state.rankedQueuePolling);
  state.rankedQueuePolling = null;
}

export function startRankedQueuePolling() {
  stopRankedQueuePolling();

  state.rankedQueuePolling = setInterval(async () => {
    if (!state.currentUser) return;

    try {
      const result = await fetchRankedQueueStatus(state.currentUser.id);

      if (result.status === "searching") {
        updatePvpRoomStatus("Searching for a ranked opponent near your RP...");
        return;
      }

      if (result.status === "matched" && result.room) {
        stopRankedQueuePolling();

        state.currentRoomMatch = result.room;
        state.currentPvpMode = "ranked";

        notify("Ranked match found!", "success", 1800);
        updatePvpRoomStatus(
          `Ranked room ${result.room.room_code} matched. Starting soon...`
        );

        startRoomMatchPolling("ranked");
      }
    } catch (error) {
      stopRankedQueuePolling();
      notify(error.message || "Ranked matchmaking failed.", "error");
    }
  }, 2000);
}