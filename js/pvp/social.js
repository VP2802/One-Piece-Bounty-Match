import { dom } from "../dom.js";
import { state } from "../state.js";
import { searchUsers, sendFriendRequest } from "../api.js";
import { formatFactionLabel, notify } from "../ui.js";
import { openProfileHistoryModal } from "./profile.js";

export async function handlePlayerSearch() {
  const query = dom.playerSearchInput?.value.trim() || "";

  if (!dom.playerSearchResultsBody || !dom.playerSearchStatus) return;

  if (query.length < 2) {
    dom.playerSearchStatus.textContent = "Enter at least 2 characters.";
    dom.playerSearchResultsBody.innerHTML = `
      <tr>
        <td colspan="6">No search results yet</td>
      </tr>
    `;
    return;
  }

  dom.playerSearchStatus.textContent = "Searching players...";
  dom.playerSearchResultsBody.innerHTML = `
    <tr>
      <td colspan="6">Searching...</td>
    </tr>
  `;

  try {
    const result = await searchUsers(query);
    const users = result.users || [];

    dom.playerSearchStatus.textContent = `Found ${users.length} player(s).`;

    if (!users.length) {
      dom.playerSearchResultsBody.innerHTML = `
        <tr>
          <td colspan="6">No matching players found</td>
        </tr>
      `;
      return;
    }

    dom.playerSearchResultsBody.innerHTML = "";

    users.forEach((user) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.player_name}</td>
        <td>${formatFactionLabel(user.faction)}</td>
        <td>${user.current_rank}</td>
        <td>${user.ranking_points}</td>
        <td>${user.highest_score}</td>
        <td>
            <div class="player-search-actions">
            <button class="ghost-btn search-view-profile-btn" data-user-id="${user.id}">
                View
            </button>
            <button class="secondary-btn search-add-friend-btn" data-user-id="${user.id}">
                Add Friend
            </button>
            </div>
        </td>
        `;
      dom.playerSearchResultsBody.appendChild(row);
    });

    dom.playerSearchResultsBody
      .querySelectorAll(".search-view-profile-btn")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          if (!state.currentUser) return;
          const userId = Number(button.dataset.userId);
          await openProfileHistoryModal(userId);
        });
      });
  } catch (error) {
    dom.playerSearchStatus.textContent = "Search failed.";
    dom.playerSearchResultsBody.innerHTML = `
      <tr>
        <td colspan="6">Failed to search players</td>
      </tr>
    `;
    notify(error.message || "Failed to search players.", "error");
  }

  dom.playerSearchResultsBody
  .querySelectorAll(".search-add-friend-btn")
  .forEach((button) => {
    button.addEventListener("click", async () => {
      if (!state.currentUser) return;

      const receiverUserId = Number(button.dataset.userId);

      try {
        await sendFriendRequest(state.currentUser.id, receiverUserId);
        notify("Friend request sent successfully.", "success", 1800);
        button.disabled = true;
        button.textContent = "Requested";
      } catch (error) {
        notify(error.message || "Failed to send friend request.", "error");
      }
    });
  });
}