import { state } from "../state.js";
import { dom } from "../dom.js";
import { signUpUser, signInUser } from "../api.js";
import { notify, showPvpLobbyScreen, showAuthScreen } from "../ui.js";
import { renderFriendsAndRequests, startSocialPolling } from "./friends.js";

export function setSelectedFaction(faction) {
  state.selectedFaction = faction;
  dom.pirateFactionBtn?.classList.toggle("active", faction === "pirate");
  dom.marineFactionBtn?.classList.toggle("active", faction === "marine");
}

export function showAuthTabs() {
  if (dom.authTabSelection) dom.authTabSelection.classList.remove("hidden");
  if (dom.authFormContent) dom.authFormContent.classList.add("hidden");
  if (dom.authTitle) dom.authTitle.textContent = "Choose Your Path";
  if (dom.authBackToTabsBtn) dom.authBackToTabsBtn.classList.add("hidden");
}

export function showAuthForm(mode) {
  if (dom.authTabSelection) dom.authTabSelection.classList.add("hidden");
  if (dom.authFormContent) dom.authFormContent.classList.remove("hidden");
  if (dom.authBackToTabsBtn) dom.authBackToTabsBtn.classList.remove("hidden");
  
  const isSignUp = mode === "signup";
  
  if (dom.confirmPasswordGroup) {
    dom.confirmPasswordGroup.style.display = isSignUp ? "block" : "none";
  }

  if (dom.factionGroup) {
    dom.factionGroup.style.display = isSignUp ? "block" : "none";
  }
  
  if (dom.authTitle) {
    dom.authTitle.textContent = isSignUp ? "PvP Sign Up" : "PvP Sign In";
  }
  
  if (dom.authPlayerNameInfo) {
    dom.authPlayerNameInfo.textContent = isSignUp
      ? "Choose your in-game name. This name will be shown to other players and on leaderboards."
      : "Enter your player name and password to sign in.";
  }
  
  if (dom.authSubmitBtn) {
    dom.authSubmitBtn.textContent = isSignUp ? "Sign Up" : "Sign In";
  }
  
  if (dom.authPasswordInput) dom.authPasswordInput.value = "";
  if (dom.authConfirmPasswordInput) dom.authConfirmPasswordInput.value = "";

  if (dom.passwordRules) {
    dom.passwordRules.style.display = isSignUp ? "block" : "none";
    if (isSignUp) updatePasswordRules();
  }
  
  state.authMode = mode;
  
  setupPasswordToggles();

  if (isSignUp) {
    dom.authPasswordInput?.addEventListener("input", updateConfirmMatchIndicator);
    dom.authConfirmPasswordInput?.addEventListener("input", updateConfirmMatchIndicator);
    
    if (dom.confirmMatchIndicator) {
      dom.confirmMatchIndicator.style.display = "none";
      dom.confirmMatchIndicator.textContent = "";
    }
  } else {
    
    dom.authPasswordInput?.removeEventListener("input", updateConfirmMatchIndicator);
    dom.authConfirmPasswordInput?.removeEventListener("input", updateConfirmMatchIndicator);
    if (dom.confirmMatchIndicator) dom.confirmMatchIndicator.style.display = "none";
  }

  setTimeout(() => {
    dom.authPlayerNameInput?.focus();
  }, 0);
}

export async function handleAuth() {
  const mode = state.authMode || "signin";
  const playerName = dom.authPlayerNameInput?.value.trim();
  const password = dom.authPasswordInput?.value.trim();

  if (!playerName) {
    notify("Please enter a player name.", "warning");
    dom.authPlayerNameInput?.focus();
    return;
  }

  if (playerName.length < 3) {
    notify("Player name must be at least 3 characters.", "warning");
    dom.authPlayerNameInput?.focus();
    return;
  }

  if (!password) {
    notify("Please enter a password.", "warning");
    dom.authPasswordInput?.focus();
    return;
  }

  if (password.length < 6) {
    notify("Password must be at least 6 characters.", "warning");
    dom.authPasswordInput?.focus();
    return;
  }

  if (mode === "signup") {
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    if (password.length < 8 || !hasUpper || !hasLower || !hasDigit) {
      notify("Password does not meet the required rules.", "warning");
      return;
    }
  }

  if (mode === "signup") {
    const confirmPassword = dom.authConfirmPasswordInput?.value.trim();
    
    if (!confirmPassword) {
      notify("Please confirm your password.", "warning");
      dom.authConfirmPasswordInput?.focus();
      return;
    }

    if (password !== confirmPassword) {
      notify("Passwords do not match.", "error");
      dom.authConfirmPasswordInput?.focus();
      return;
    }
  }

  try {
    const result =
      mode === "signup"
        ? await signUpUser(playerName, state.selectedFaction, password)
        : await signInUser(playerName, state.selectedFaction, password);

    if (mode === "signup") {
      notify(
        "Account created successfully! Please sign in with your new account.",
        "success",
        3000
      );
      
      dom.authPlayerNameInput.value = "";
      dom.authPasswordInput.value = "";
      dom.authConfirmPasswordInput.value = "";
      
      showAuthForm("signin");
      return;
    }

    state.currentUser = result.user;
    sessionStorage.setItem('authToken', result.token);
    notify(result.message || "Welcome back!", "success");
    await showPvpLobbyScreen();
    await renderFriendsAndRequests();
    startSocialPolling();
  } catch (error) {
    notify(error.message || "Authentication failed.", "error");
  }
}

export function prepareAuthScreen(mode = "signin") {
  state.currentEntryMode = "pvp";
  state.authMode = mode;
  showAuthTabs();
}


export function updatePasswordRules() {
  const password = dom.authPasswordInput?.value || "";
  const rules = [
    { id: "rule-length", pass: password.length >= 8 },
    { id: "rule-upper", pass: /[A-Z]/.test(password) },
    { id: "rule-lower", pass: /[a-z]/.test(password) },
    { id: "rule-digit", pass: /[0-9]/.test(password) }
  ];
  rules.forEach(r => {
    const el = document.getElementById(r.id);
    if (!el) return;
    el.innerHTML = r.pass ? "✅ " + el.innerHTML.replace(/^[✅❌]\s*/, "") : "❌ " + el.innerHTML.replace(/^[✅❌]\s*/, "");
    el.className = "rule-item " + (r.pass ? "pass" : "fail");
  });
}

export function setupPasswordToggles() {
  document.querySelectorAll(".toggle-password").forEach(btn => {
    if (btn.dataset.toggleBound === "true") return;
    btn.dataset.toggleBound = "true";

    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      btn.textContent = isPassword ? "🙈" : "👁️";
    });
  });
}

export function updateConfirmMatchIndicator() {
  const password = dom.authPasswordInput?.value || "";
  const confirm = dom.authConfirmPasswordInput?.value || "";
  if (!dom.confirmMatchIndicator) return;

  if (confirm.length === 0) {
    dom.confirmMatchIndicator.style.display = "none";
    return;
  }

  dom.confirmMatchIndicator.style.display = "block";
  if (password === confirm) {
    dom.confirmMatchIndicator.textContent = "✅ Passwords match";
    dom.confirmMatchIndicator.className = "confirm-match match";
  } else {
    dom.confirmMatchIndicator.textContent = "❌ Passwords do not match";
    dom.confirmMatchIndicator.className = "confirm-match no-match";
  }
}