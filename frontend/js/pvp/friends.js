import { dom } from "../dom.js";
import { state } from "../state.js";
import {
  fetchFriendsList,
  fetchIncomingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  sendMatchInvite,
  fetchIncomingMatchInvites,
  acceptMatchInvite,
  rejectMatchInvite
} from "../api.js";
import { formatFactionLabel, notify } from "../ui.js";
import { openProfileHistoryModal } from "./profile.js";
import {
  startRoomMatchPolling,
  showPvpRoomCard,
  updatePvpRoomStatus
} from "./room.js";

export async function renderFriendsList() {
  if (!dom.friendsListWrap || !state.currentUser) return;

  try {
    const data = await fetchFriendsList(state.currentUser.id);
    const friends = data.friends || [];

    if (!friends.length) {
      dom.friendsListWrap.innerHTML = `<p class="panel-note">No friends yet.</p>`;
      return;
    }

    dom.friendsListWrap.innerHTML = friends
      .map(
        (friend) => `
          <div class="rank-preview">
            <h3>${friend.player_name}</h3>
            <p>${formatFactionLabel(friend.faction)} • ${friend.current_rank}</p>
            <p>RP: ${friend.ranking_points} • High Score: ${friend.highest_score}</p>
            <div class="player-search-actions">
              <button class="ghost-btn friend-view-btn" data-user-id="${friend.id}">
                View
              </button>
              <button class="secondary-btn friend-invite-btn" data-user-id="${friend.id}">
                Invite
              </button>
            </div>
          </div>
        `
      )
      .join("");

    dom.friendsListWrap.querySelectorAll(".friend-view-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = Number(button.dataset.userId);
        await openProfileHistoryModal(userId);
      });
    });

    dom.friendsListWrap.querySelectorAll(".friend-invite-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const receiverUserId = Number(button.dataset.userId);

        try {
          const result = await sendMatchInvite(state.currentUser.id, receiverUserId);

          notify("Friendly match invite sent.", "success", 1800);

          state.currentRoomMatch = result.room;
          state.currentPvpMode = "friendly";

          showPvpRoomCard();
          updatePvpRoomStatus(
            `Friendly invite sent. Room ${result.room.room_code} is waiting for your friend...`
          );

          startRoomMatchPolling("friendly");
        } catch (error) {
          notify(error.message || "Failed to send match invite.", "error");
        }
      });
    });
  } catch (error) {
    dom.friendsListWrap.innerHTML = `
      <p class="panel-note">${error.message || "Failed to load friends list."}</p>
    `;
  }

}

export async function renderIncomingFriendRequests() {
  if (!dom.friendRequestsWrap || !state.currentUser) return;

  try {
    const data = await fetchIncomingFriendRequests(state.currentUser.id);
    const requests = data.requests || [];

    if (!requests.length) {
      dom.friendRequestsWrap.innerHTML = `<p class="panel-note">No incoming requests.</p>`;
      return;
    }

    dom.friendRequestsWrap.innerHTML = requests
      .map(
        (request) => `
          <div class="rank-preview">
            <h3>${request.player_name}</h3>
            <p>${formatFactionLabel(request.faction)} • ${request.current_rank}</p>
            <p>RP: ${request.ranking_points} • High Score: ${request.highest_score}</p>
            <div class="player-search-actions">
              <button class="primary-btn friend-accept-btn" data-request-id="${request.id}">
                Accept
              </button>
              <button class="ghost-btn friend-reject-btn" data-request-id="${request.id}">
                Reject
              </button>
              <button class="ghost-btn friend-view-btn" data-user-id="${request.sender_user_id}">
                View
              </button>
            </div>
          </div>
        `
      )
      .join("");

    dom.friendRequestsWrap
      .querySelectorAll(".friend-accept-btn")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const requestId = Number(button.dataset.requestId);

          try {
            await acceptFriendRequest(requestId, state.currentUser.id);
            notify("Friend request accepted.", "success", 1800);
            await renderIncomingFriendRequests();
            await renderFriendsList();
          } catch (error) {
            notify(error.message || "Failed to accept request.", "error");
          }
        });
      });

    dom.friendRequestsWrap
      .querySelectorAll(".friend-reject-btn")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const requestId = Number(button.dataset.requestId);

          try {
            await rejectFriendRequest(requestId, state.currentUser.id);
            notify("Friend request rejected.", "info", 1800);
            await renderIncomingFriendRequests();
          } catch (error) {
            notify(error.message || "Failed to reject request.", "error");
          }
        });
      });

    dom.friendRequestsWrap.querySelectorAll(".friend-view-btn").forEach((button) => {
      button.addEventListener("click", async () => {
        const userId = Number(button.dataset.userId);
        await openProfileHistoryModal(userId);
      });
    });
  } catch (error) {
    dom.friendRequestsWrap.innerHTML = `
      <p class="panel-note">${error.message || "Failed to load incoming requests."}</p>
    `;
  }
}

export async function renderIncomingMatchInvites() {
  if (!dom.matchInvitesWrap || !state.currentUser) return;

  try {
    const data = await fetchIncomingMatchInvites(state.currentUser.id);
    const invites = data.invites || [];

    if (!invites.length) {
      dom.matchInvitesWrap.innerHTML = `<p class="panel-note">No match invites.</p>`;
      return;
    }

    dom.matchInvitesWrap.innerHTML = invites
      .map(
        (invite) => `
          <div class="rank-preview">
            <h3>${invite.player_name}</h3>
            <p>${formatFactionLabel(invite.faction)} • ${invite.current_rank}</p>
            <p>${String(invite.room_mode).toUpperCase()} • Room ${invite.room_code}</p>
            <div class="player-search-actions">
              <button class="primary-btn match-invite-accept-btn" data-invite-id="${invite.id}">
                Accept
              </button>
              <button class="ghost-btn match-invite-reject-btn" data-invite-id="${invite.id}">
                Reject
              </button>
            </div>
          </div>
        `
      )
      .join("");

    dom.matchInvitesWrap
      .querySelectorAll(".match-invite-accept-btn")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const inviteId = Number(button.dataset.inviteId);

          try {
            const result = await acceptMatchInvite(inviteId, state.currentUser.id);

            notify("Match invite accepted.", "success", 1800);

            state.currentRoomMatch = result.room;
            state.currentPvpMode = "friendly";

            await renderIncomingMatchInvites();
            startRoomMatchPolling("friendly");
          } catch (error) {
            notify(error.message || "Failed to accept match invite.", "error");
          }
        });
      });

    dom.matchInvitesWrap
      .querySelectorAll(".match-invite-reject-btn")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          const inviteId = Number(button.dataset.inviteId);

          try {
            await rejectMatchInvite(inviteId, state.currentUser.id);
            notify("Match invite rejected.", "info", 1800);
            await renderIncomingMatchInvites();
          } catch (error) {
            notify(error.message || "Failed to reject match invite.", "error");
          }
        });
      });
  } catch (error) {
    dom.matchInvitesWrap.innerHTML = `
      <p class="panel-note">${error.message || "Failed to load match invites."}</p>
    `;
  }
}

let socialPollingInterval = null;

export function stopSocialPolling() {
  clearInterval(socialPollingInterval);
  socialPollingInterval = null;
}

export function startSocialPolling() {
  stopSocialPolling();

  socialPollingInterval = setInterval(async () => {
    await renderIncomingFriendRequests();
    await renderIncomingMatchInvites();
  }, 3000);
}

export async function renderFriendsAndRequests() {
  await renderFriendsList();
  await renderIncomingFriendRequests();
  await renderIncomingMatchInvites();
}