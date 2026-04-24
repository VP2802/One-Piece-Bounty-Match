import { constants, state } from "./state.js";
import { notify, showModeSelectScreen } from "./ui.js";

export async function apiRequest(path, method = "GET", body = null) {
  const token = sessionStorage.getItem('authToken');
  const headers = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${constants.API_BASE_URL}${path}`, options);

  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    if (data.message && data.message.includes('đăng nhập ở nơi khác')) {
      sessionStorage.removeItem('authToken');
      state.currentUser = null;
      notify('Tài khoản của bạn vừa được đăng nhập ở thiết bị khác. Vui lòng đăng nhập lại.', 'error', 6000);
      showModeSelectScreen();
      throw new Error('Session expired');
    }
    
    sessionStorage.removeItem('authToken');
    state.currentUser = null;
    notify('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.', 'warning', 3000);
    showModeSelectScreen();
    throw new Error(data.message || 'Unauthorized');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'API request failed');
  return data;
}

export async function signUpUser(playerName, faction, password) {
  return apiRequest("/auth/signup", "POST", {
    player_name: playerName,
    faction,
    password,
    confirm_password: password  
  });
}

export async function signInUser(playerName, faction, password) {
  return apiRequest("/auth/signin", "POST", {
    player_name: playerName,
    faction,
    password
  });
}

export async function fetchTop10Leaderboard() {
  return apiRequest("/leaderboard/top10", "GET");
}

export async function createBotPracticeMatch(userId) {
  return apiRequest("/bot/create-match", "POST", {
    user_id: userId
  });
}

export async function submitBotPracticeMatch(payload) {
  return apiRequest("/bot/submit-match", "POST", payload);
}

export async function fetchBotPracticeHistory(userId) {
  return apiRequest(`/bot/history/${userId}`, "GET");
}

export async function createRoomMatch(mode, userId) {
  return apiRequest(`/${mode}/create-room`, "POST", {
    user_id: userId
  });
}

export async function joinRoomMatch(mode, userId, roomCode) {
  return apiRequest(`/${mode}/join-room`, "POST", {
    user_id: userId,
    room_code: roomCode
  });
}

export async function fetchRoomMatch(mode, roomCode) {
  return apiRequest(`/${mode}/room/${roomCode}`, "GET");
}

export async function updateRoomMatchProgress(mode, payload) {
  return apiRequest(`/${mode}/update-progress`, "POST", payload);
}

export async function submitRoomMatchResult(mode, payload) {
  return apiRequest(`/${mode}/submit-result`, "POST", payload);
}

export async function fetchUserProfile(userId) {
  return apiRequest(`/users/${userId}/profile`, "GET");
}

export async function fetchUserPvpHistory(userId, viewerId) {
  return apiRequest(`/users/${userId}/pvp-history?viewer_id=${viewerId}`, "GET");
}

export async function updateUserPvpHistoryVisibility(userId, showPvpHistory) {
  return apiRequest(`/users/${userId}/pvp-history-visibility`, "PATCH", {
    show_pvp_history: showPvpHistory
  });
}

export async function searchUsers(query) {
  return apiRequest(`/users/search?q=${encodeURIComponent(query)}`, "GET");
}

export async function sendFriendRequest(senderUserId, receiverUserId) {
  return apiRequest("/friends/request", "POST", {
    sender_user_id: senderUserId,
    receiver_user_id: receiverUserId
  });
}

export async function fetchFriendsList(userId) {
  return apiRequest(`/friends/${userId}/list`, "GET");
}

export async function fetchIncomingFriendRequests(userId) {
  return apiRequest(`/friends/${userId}/requests`, "GET");
}

export async function acceptFriendRequest(requestId, userId) {
  return apiRequest(`/friends/request/${requestId}/accept`, "POST", {
    user_id: userId
  });
}

export async function rejectFriendRequest(requestId, userId) {
  return apiRequest(`/friends/request/${requestId}/reject`, "POST", {
    user_id: userId
  });
}

export async function sendMatchInvite(senderUserId, receiverUserId) {
  return apiRequest("/invites/match", "POST", {
    sender_user_id: senderUserId,
    receiver_user_id: receiverUserId
  });
}

export async function fetchIncomingMatchInvites(userId) {
  return apiRequest(`/invites/${userId}`, "GET");
}

export async function acceptMatchInvite(inviteId, userId) {
  return apiRequest(`/invites/match/${inviteId}/accept`, "POST", {
    user_id: userId
  });
}

export async function rejectMatchInvite(inviteId, userId) {
  return apiRequest(`/invites/match/${inviteId}/reject`, "POST", {
    user_id: userId
  });
}

export async function joinFriendlyQueue(userId) {
  return apiRequest("/friendly/queue/join", "POST", {
    user_id: userId
  });
}

export async function leaveFriendlyQueue(userId) {
  return apiRequest("/friendly/queue/leave", "POST", {
    user_id: userId
  });
}

export async function fetchFriendlyQueueStatus(userId) {
  return apiRequest(`/friendly/queue/status/${userId}`, "GET");
}

export async function joinRankedQueue(userId) {
  return apiRequest("/ranked/queue/join", "POST", {
    user_id: userId
  });
}

export async function leaveRankedQueue(userId) {
  return apiRequest("/ranked/queue/leave", "POST", {
    user_id: userId
  });
}

export async function fetchRankedQueueStatus(userId) {
  return apiRequest(`/ranked/queue/status/${userId}`, "GET");
}

export async function fetchFriendsOnlineStatus(userIds) {
  return apiRequest("/friends/online-status", "POST", { userIds });
}

export async function unfriend(friendUserId) {
  return apiRequest("/friends/unfriend", "DELETE", {
    friend_user_id: friendUserId,
  });
}