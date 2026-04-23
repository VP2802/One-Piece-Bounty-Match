import { state } from "../state.js";
import { dom } from "../dom.js";
import {
  fetchUserProfile,
  fetchUserPvpHistory,
  updateUserPvpHistoryVisibility
} from "../api.js";
import { notify } from "../ui.js";

export function closeProfileHistoryModal() {
  dom.profileHistoryModal?.classList.add("hidden");
}

function renderProfileStats(profile, history = []) {
  const totalPvpMatches = history.length;
  const totalPvpWins = history.filter((match) => match.result === "Win").length;
  const winRate =
    totalPvpMatches > 0
      ? Math.round((totalPvpWins / totalPvpMatches) * 100)
      : 0;

  dom.profileHistoryStats.innerHTML = `
    <div class="rank-preview">
      <h3>PvP Stats</h3>
      <p>Total PvP Matches: ${totalPvpMatches}</p>
      <p>Total PvP Wins: ${totalPvpWins}</p>
      <p>Win Rate: ${winRate}%</p>
      <p>Highest Score: ${profile.highest_score}</p>
    </div>
  `;
}

function renderProfileHistory(history) {
  if (!history.length) {
    dom.profileHistoryList.innerHTML = `
      <div class="rank-preview">
        <p>No PvP match history yet.</p>
      </div>
    `;
    return;
  }

  dom.profileHistoryList.innerHTML = history
    .map((match) => {
      const rankChangeText =
        match.rank_change > 0
          ? `+${match.rank_change}`
          : `${match.rank_change}`;

      return `
        <div class="rank-preview">
          <h3>${match.result} • ${String(match.random_mode).toUpperCase()}</h3>
          <p>Opponent: ${match.opponent_name}</p>
          <p>Score: ${match.my_score} - ${match.opponent_score}</p>
          <p>Stage: ${match.my_stage} - ${match.opponent_stage}</p>
          <p>Time: ${match.my_time_seconds}s - ${match.opponent_time_seconds}s</p>
          <p>RP Change: ${rankChangeText}</p>
        </div>
      `;
    })
    .join("");
}

export async function openProfileHistoryModal(userId) {
  if (!state.currentUser) return;

  dom.profileHistoryModal?.classList.remove("hidden");
  dom.profileHistoryTitle.textContent = "Loading...";
  dom.profileHistoryMeta.textContent = "";
  dom.profileHistoryStats.innerHTML = "";
  dom.profileHistoryList.innerHTML = "";

  try {
    const profileData = await fetchUserProfile(userId);
    const profile = profileData.profile;
    const isOwner = Number(profile.id) === Number(state.currentUser.id);

    dom.profileHistoryTitle.textContent = profile.player_name;
    dom.profileHistoryMeta.textContent =
      `${profile.faction} • ${profile.current_rank} • ${profile.ranking_points} RP`;

    if (isOwner) {
      dom.profileHistoryPrivacyWrap?.classList.remove("hidden");

      if (dom.profileHistoryVisibilityToggle) {
        dom.profileHistoryVisibilityToggle.checked = !!profile.show_pvp_history;
        dom.profileHistoryVisibilityToggle.onchange = async (event) => {
          try {
            await updateUserPvpHistoryVisibility(
              profile.id,
              event.target.checked
            );

            notify("PvP history visibility updated.", "success", 1800);
          } catch (error) {
            event.target.checked = !event.target.checked;
            notify(
              error.message || "Failed to update PvP history visibility.",
              "error"
            );
          }
        };
      }
    } else {
      dom.profileHistoryPrivacyWrap?.classList.add("hidden");
    }

    if (!isOwner && !profile.show_pvp_history) {
      dom.profileHistoryStats.innerHTML = "";
      dom.profileHistoryList.innerHTML = `
        <div class="rank-preview">
          <p>This player has hidden their PvP history.</p>
        </div>
      `;
      return;
    }

    try {
      const historyData = await fetchUserPvpHistory(
        profile.id,
        state.currentUser.id
      );

      const history = historyData.history || [];
      renderProfileStats(profile, history);
      renderProfileHistory(history);
    } catch (error) {
      renderProfileStats(profile, []);
      dom.profileHistoryList.innerHTML = `
        <div class="rank-preview">
          <p>${error.message}</p>
        </div>
      `;
    }
  } catch (error) {
    dom.profileHistoryTitle.textContent = "Profile Error";
    dom.profileHistoryMeta.textContent = "";
    dom.profileHistoryStats.innerHTML = "";
    dom.profileHistoryList.innerHTML = `
      <div class="rank-preview">
        <p>${error.message || "Failed to load player profile."}</p>
      </div>
    `;
  }
}