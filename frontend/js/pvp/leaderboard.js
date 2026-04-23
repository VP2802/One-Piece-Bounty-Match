import { dom } from "../dom.js";
import { fetchTop10Leaderboard } from "../api.js";
import { formatFactionLabel } from "../ui.js";
import { openProfileHistoryModal } from "./profile.js";
import { state } from "../state.js";

export async function renderPvpTop10() {
  if (!dom.pvpTop10Body) return;

  try {
    const top10 = await fetchTop10Leaderboard();
    dom.pvpTop10Body.innerHTML = "";

    if (!top10.length) {
      dom.pvpTop10Body.innerHTML = `
        <tr>
          <td colspan="7">No PvP records yet</td>
        </tr>
      `;
      return;
    }

    top10.forEach((item, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${item.player_name}</td>
        <td>${formatFactionLabel(item.faction)}</td>
        <td>${item.current_rank}</td>
        <td>${item.ranking_points}</td>
        <td>${item.highest_score}</td>
        <td>
          <button class="ghost-btn view-profile-btn" data-user-id="${item.id}">
            View
          </button>
        </td>
      `;
      dom.pvpTop10Body.appendChild(row);
    });

    dom.pvpTop10Body.querySelectorAll(".view-profile-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!state.currentUser) return;

        const userId = Number(button.dataset.userId);
        await openProfileHistoryModal(userId);
      });
    });
  } catch {
    dom.pvpTop10Body.innerHTML = `
      <tr>
        <td colspan="7">Failed to load Top 10</td>
      </tr>
    `;
  }
}