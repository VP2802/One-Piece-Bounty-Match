import { state, constants } from "./state.js";
import { dom } from "./dom.js";

const matchSound = new Audio(assetUrl("../sound/match.mp3"));
const wrongSound = new Audio(assetUrl("../sound/wrong.mp3"));
const winSound = new Audio(assetUrl("../sound/win.mp3"));
const loseSound = new Audio(assetUrl("../sound/lose.mp3"));

const normalBgmTracks = [
  assetUrl("../sound/bgm/normal/bgm_01_happy_lofi_poor_b.mp3"),
  assetUrl("../sound/bgm/normal/bgm_02_happy_lofi_blue_s.mp3"),
  assetUrl("../sound/bgm/normal/bgm_03_happy_lofi_clouds.mp3"),
  assetUrl("../sound/bgm/normal/bgm_04_happy_lofi_happy.mp3"),
  assetUrl("../sound/bgm/normal/bgm_05_happy_lofi_new_s.mp3"),
  assetUrl("../sound/bgm/normal/bgm_06_lofi_a_first_s.mp3"),
  assetUrl("../sound/bgm/normal/bgm_07_lofi_a_snow.mp3"),
  assetUrl("../sound/bgm/normal/bgm_08_lofi_a_2_hours.mp3"),
  assetUrl("../sound/bgm/normal/bgm_09_lofi_b_morning.mp3"),
  assetUrl("../sound/bgm/normal/bgm_10_lofi_b_a_little.mp3"),
  assetUrl("../sound/bgm/normal/bgm_11_lofi_b_whatever.mp3"),
  assetUrl("../sound/bgm/normal/bgm_12_lofi_c_waves.mp3"),
  assetUrl("../sound/bgm/normal/bgm_13_lofi_c_foggy.mp3"),
  assetUrl("../sound/bgm/normal/bgm_14_lofi_c_pretty.mp3"),
  assetUrl("../sound/bgm/normal/bgm_15_quiet_village_01.mp3"),
  assetUrl("../sound/bgm/normal/bgm_16_quiet_village_03.mp3"),
  assetUrl("../sound/bgm/normal/bgm_17_relaxing_night.mp3"),
  assetUrl("../sound/bgm/normal/bgm_18_relaxing_lost_in.mp3"),
  assetUrl("../sound/bgm/normal/bgm_19_relaxing_you_lo.mp3")
];

const dangerBgmTracks = [
  assetUrl("../sound/bgm/danger/danger_01_dark_cinematic_tension.mp3"),
  assetUrl("../sound/bgm/danger/danger_02_retro_arcade_game_music.mp3"),
  assetUrl("../sound/bgm/danger/danger_03_retro_game_arcade.mp3"),
  assetUrl("../sound/bgm/danger/danger_04_retro_game_music.mp3"),
  assetUrl("../sound/bgm/danger/danger_05_8bit_retro_game_music.mp3")
];

const bgmAudio = new Audio();
bgmAudio.loop = false;

function assetUrl(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function shuffleArray(array) {
  const arr = [...array];
  shuffle(arr);
  return arr;
}

export function clampVolume(value) {
  return Math.max(0, Math.min(1, value));
}

export function applySoundSettings() {
  const bgmVolume = state.isSoundOn ? state.masterVolume : 0;

  matchSound.volume = state.isSoundOn ? state.masterVolume * 0.72 : 0;
  wrongSound.volume = state.isSoundOn ? state.masterVolume * 0.65 : 0;
  winSound.volume = state.isSoundOn ? state.masterVolume * 0.8 : 0;
  loseSound.volume = state.isSoundOn ? state.masterVolume * 0.8 : 0;
  bgmAudio.volume = bgmVolume;

  if (dom.soundBtn) {
    dom.soundBtn.textContent = state.isSoundOn ? "🔊 Sound" : "🔇 Sound";
  }

  if (dom.volumeSlider) {
    dom.volumeSlider.value = String(Math.round(state.masterVolume * 100));
  }
}

export function turnOnSound() {
  if (state.masterVolume <= 0) {
    state.masterVolume = constants.DEFAULT_MASTER_VOLUME;
  }
  state.isSoundOn = true;
  applySoundSettings();
  saveSoundSettings();
}

export function turnOffSound() {
  state.isSoundOn = false;
  applySoundSettings();
  saveSoundSettings();
}

export function saveSoundSettings() {
  localStorage.setItem(
    constants.SOUND_SETTINGS_KEY,
    JSON.stringify({
      isSoundOn: state.isSoundOn,
      masterVolume: state.masterVolume
    })
  );
}

export function loadSoundSettings() {
  const raw = localStorage.getItem(constants.SOUND_SETTINGS_KEY);
  if (!raw) return;

  try {
    const saved = JSON.parse(raw);
    state.isSoundOn = Boolean(saved.isSoundOn);
    state.masterVolume = clampVolume(
      Number(saved.masterVolume ?? constants.DEFAULT_MASTER_VOLUME)
    );
  } catch {
    state.isSoundOn = true;
    state.masterVolume = constants.DEFAULT_MASTER_VOLUME;
  }
}

export function startBgmPlaylist(mode = "normal") {
  state.currentBgmMode = mode;
  state.currentBgmList = shuffleArray(
    mode === "danger" ? dangerBgmTracks : normalBgmTracks
  );
  state.currentBgmIndex = 0;

  if (!state.currentBgmList.length) return;

  bgmAudio.pause();
  bgmAudio.currentTime = 0;
  bgmAudio.src = state.currentBgmList[state.currentBgmIndex];
  bgmAudio.play().catch(() => {});
}

export function playNextBgmTrack() {
  if (!state.currentBgmList.length) return;

  state.currentBgmIndex++;

  if (state.currentBgmIndex >= state.currentBgmList.length) {
    state.currentBgmList = shuffleArray(
      state.currentBgmMode === "danger" ? dangerBgmTracks : normalBgmTracks
    );
    state.currentBgmIndex = 0;
  }

  bgmAudio.src = state.currentBgmList[state.currentBgmIndex];
  bgmAudio.play().catch(() => {});
}

export function stopBgm() {
  bgmAudio.pause();
  bgmAudio.currentTime = 0;
  bgmAudio.src = "";
  state.currentBgmList = [];
  state.currentBgmIndex = -1;
  state.currentBgmMode = "normal";
}

export function pauseBgm() {
  bgmAudio.pause();
}

export function resumeBgm() {
  if (!bgmAudio.src) return;
  bgmAudio.play().catch(() => {});
}

export function playMatchSound() {
  matchSound.currentTime = 0;
  matchSound.play().catch(() => {});
}

export function playWrongSound() {
  wrongSound.currentTime = 0;
  wrongSound.play().catch(() => {});
}

window.bgmAudio = bgmAudio;

export { bgmAudio, winSound, loseSound };