import { state } from "../state.js";
import { dom } from "../dom.js";
import { signUpUser, signInUser } from "../api.js";
import { notify, showPvpLobbyScreen } from "../ui.js";
import { renderFriendsAndRequests, startSocialPolling } from "./friends.js";

export function setSelectedFaction(faction) {
  state.selectedFaction = faction;
  dom.pirateFactionBtn?.classList.toggle("active", faction === "pirate");
  dom.marineFactionBtn?.classList.toggle("active", faction === "marine");
}

export async function handleAuth(mode) {
  const playerName = dom.authPlayerNameInput?.value.trim();

  if (!playerName) {
    notify("Please enter player name.", "warning");
    return;
  }

  try {
    const result =
      mode === "signup"
        ? await signUpUser(playerName, state.selectedFaction)
        : await signInUser(playerName, state.selectedFaction);

    state.currentUser = result.user;
    notify(result.message || "Authentication success!", "success");
    await showPvpLobbyScreen();
    await renderFriendsAndRequests();
    startSocialPolling();
  } catch (error) {
    notify(error.message || "Authentication failed.", "error");
  }
}