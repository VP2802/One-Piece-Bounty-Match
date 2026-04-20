/* DOM REFERENCES */

const boardElement = document.getElementById("board");
const scoreElement = document.getElementById("score");
const restartBtn = document.getElementById("restartBtn");
const gameContainer = document.getElementById("gameContainer");
const canvas = document.getElementById("lineCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const endScreen = document.getElementById("endScreen");
const endMessage = document.getElementById("endMessage");
const bonusMessage = document.getElementById("bonusMessage");
const modeBonusMessage = document.getElementById("modeBonusMessage");
const totalScoreMessage = document.getElementById("totalScoreMessage");
const leaderboardRankMessage = document.getElementById("leaderboardRankMessage");

const hintBtn = document.getElementById("hintBtn");
const homeBtn = document.getElementById("homeBtn");
const soundBtn = document.getElementById("soundBtn");
const reshuffleBtn = document.getElementById("reshuffleBtn");
const pauseBtn = document.getElementById("pauseBtn");
const endRunBtn = document.getElementById("endRunBtn");

const timeBar = document.getElementById("timeBar");
const timeBarValue = document.getElementById("timeBarValue");
const leaderboardBody = document.getElementById("leaderboardBody");
const pauseOverlay = document.getElementById("pauseOverlay");
const boardWrapper = document.querySelector(".board-wrapper");

const playTypeDescription = document.getElementById("playTypeDescription");
const singleRunBtn = document.getElementById("singleRunBtn");
const continuousRunBtn = document.getElementById("continuousRunBtn");

const toastContainer = document.getElementById("toastContainer");
const volumeSlider = document.getElementById("volumeSlider");

/* STORAGE KEYS / CONSTANTS */

const LEADERBOARD_KEY = "onepiece_leaderboard";
const SOUND_SETTINGS_KEY = "onepiece_sound_settings";
const DEFAULT_MASTER_VOLUME = 0.25;

const BOARD_SYMBOLS = [
    "image1.png", "image2.png", "image3.png", "image4.png", "image5.png",
    "image6.png", "image7.png", "image8.png", "image9.png", "image10.png",
    "image11.png", "image12.png", "image13.png", "image14.png", "image15.png",
    "image16.png", "image17.png", "image18.png", "image19.png", "image20.png",
    "image21.png", "image22.png", "image23.png", "image24.png", "image25.png",
    "image26.png", "image27.png", "image28.png", "image29.png", "image30.png"
];

const gameModes = {
    easy: { timeLeft: 900, hintsLeft: 3, reshufflesLeft: 5, rows: 9, cols: 10, cellSize: 60 },
    hard: { timeLeft: 720, hintsLeft: 0, reshufflesLeft: 3, rows: 10, cols: 15, cellSize: 50 },
    insane: { timeLeft: 600, hintsLeft: 0, reshufflesLeft: 1, rows: 12, cols: 15, cellSize: 45 },
    impossible: { timeLeft: 480, hintsLeft: 0, reshufflesLeft: 0, rows: 15, cols: 16, cellSize: 35 }
};

/* AUDIO */

const matchSound = new Audio("sound/match.mp3");
const wrongSound = new Audio("sound/wrong.mp3");
const winSound = new Audio("sound/win.mp3");
const loseSound = new Audio("sound/lose.mp3");

const normalBgmTracks = [
    "sound/bgm/normal/bgm_01_happy_lofi_poor_b.mp3",
    "sound/bgm/normal/bgm_02_happy_lofi_blue_s.mp3",
    "sound/bgm/normal/bgm_03_happy_lofi_clouds.mp3",
    "sound/bgm/normal/bgm_04_happy_lofi_happy.mp3",
    "sound/bgm/normal/bgm_05_happy_lofi_new_s.mp3",
    "sound/bgm/normal/bgm_06_lofi_a_first_s.mp3",
    "sound/bgm/normal/bgm_07_lofi_a_snow.mp3",
    "sound/bgm/normal/bgm_08_lofi_a_2_hours.mp3",
    "sound/bgm/normal/bgm_09_lofi_b_morning.mp3",
    "sound/bgm/normal/bgm_10_lofi_b_a_little.mp3",
    "sound/bgm/normal/bgm_11_lofi_b_whatever.mp3",
    "sound/bgm/normal/bgm_12_lofi_c_waves.mp3",
    "sound/bgm/normal/bgm_13_lofi_c_foggy.mp3",
    "sound/bgm/normal/bgm_14_lofi_c_pretty.mp3",
    "sound/bgm/normal/bgm_15_quiet_village_01.mp3",
    "sound/bgm/normal/bgm_16_quiet_village_03.mp3",
    "sound/bgm/normal/bgm_17_relaxing_night.mp3",
    "sound/bgm/normal/bgm_18_relaxing_lost_in.mp3",
    "sound/bgm/normal/bgm_19_relaxing_you_lo.mp3"
];

const dangerBgmTracks = [
    "sound/bgm/danger/danger_01_dark_cinematic_tension.mp3",
    "sound/bgm/danger/danger_02_retro_arcade_game_music.mp3",
    "sound/bgm/danger/danger_03_retro_game_arcade.mp3",
    "sound/bgm/danger/danger_04_retro_game_music.mp3",
    "sound/bgm/danger/danger_05_8bit_retro_game_music.mp3"
];

const bgmAudio = new Audio();
bgmAudio.loop = false;

/* GAME STATE */

let board = [];
let firstSelected = null;
let secondSelected = null;

let score = 0;
let combo = 0;

let timeLeft = 0;
let timeInterval = null;
let isGameOver = false;
let isPaused = false;
let isBoardBusy = false;

let hintsLeft = 0;
let reshufflesLeft = 0;

let rows = 0;
let cols = 0;
let cellSize = 0;

let currentMode = null;
let currentModeName = null;
let insaneShiftDirection = null;

let hintCells = [];
let wrongCells = [];
let matchedCells = [];

let comboTimeOut = null;
let matchResolveTimeout = null;
let wrongResolveTimeout = null;
let hintClearTimeout = null;
let nextStageTimeout = null;

let currentPlayType = "single";
let runTotalScore = 0;
let currentStage = 1;
let stagesCleared = 0;
let runUsedSeconds = 0;

let isSoundOn = true;
let masterVolume = DEFAULT_MASTER_VOLUME;
let currentBgmMode = "normal";
let currentBgmList = [];
let currentBgmIndex = -1;
let hasSwitchedToDangerBgm = false;

const activeToastKeys = new Set();

/* GENERIC HELPERS */

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function shuffleArray(array) {
    const arr = [...array];
    shuffle(arr);
    return arr;
}

function clampVolume(value) {
    return Math.max(0, Math.min(1, value));
}

function formatTime(seconds) {
    const minute = Math.floor(seconds / 60);
    const second = seconds % 60;
    return `${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

function clearPendingActions() {
    clearTimeout(matchResolveTimeout);
    clearTimeout(wrongResolveTimeout);
    clearTimeout(hintClearTimeout);

    matchResolveTimeout = null;
    wrongResolveTimeout = null;
    hintClearTimeout = null;

    isBoardBusy = false;
}

function clearNextStageTimeout() {
    clearTimeout(nextStageTimeout);
    nextStageTimeout = null;
}

function resetCombo() {
    combo = 0;
    clearTimeout(comboTimeOut);
    comboTimeOut = null;
}

function resetRunProgress() {
    runTotalScore = 0;
    currentStage = 1;
    stagesCleared = 0;
    runUsedSeconds = 0;
}

function resetBoardSelections() {
    firstSelected = null;
    secondSelected = null;
    hintCells = [];
    wrongCells = [];
    matchedCells = [];
}

/* TOAST NOTIFICATIONS */

function notify(message, type = "info", duration = 2500) {
    if (!toastContainer) return;

    const normalizedType = String(type).toLowerCase();
    const key = `${normalizedType}:${message}`;

    if (activeToastKeys.has(key)) return;
    activeToastKeys.add(key);

    const toast = document.createElement("div");
    toast.className = `toast toast-${normalizedType}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        toast.addEventListener("animationend", () => {
            activeToastKeys.delete(key);
            toast.remove();
        }, { once: true });
    }, duration);
}

/* SOUND / MUSIC */

function playMatchSound() {
    matchSound.currentTime = 0;
    matchSound.play().catch(() => {});
}

function playWrongSound() {
    wrongSound.currentTime = 0;
    wrongSound.play().catch(() => {});
}

function applySoundSettings() {
    const sfxVolume = isSoundOn ? masterVolume : 0;
    const bgmVolume = isSoundOn ? masterVolume * 0.75 : 0;

    matchSound.volume = sfxVolume;
    wrongSound.volume = sfxVolume;
    winSound.volume = sfxVolume;
    loseSound.volume = sfxVolume;
    bgmAudio.volume = bgmVolume;

    if (soundBtn) {
        soundBtn.textContent = isSoundOn ? "🔊 Sound" : "🔇 Sound";
    }

    if (volumeSlider) {
        volumeSlider.value = String(Math.round(masterVolume * 100));
    }
}

function turnOnSound() {
    if (masterVolume <= 0) {
        masterVolume = DEFAULT_MASTER_VOLUME;
    }
    isSoundOn = true;
    applySoundSettings();
    saveSoundSettings();
}

function turnOffSound() {
    isSoundOn = false;
    applySoundSettings();
    saveSoundSettings();
}

function saveSoundSettings() {
    localStorage.setItem(SOUND_SETTINGS_KEY, JSON.stringify({
        isSoundOn,
        masterVolume
    }));
}

function loadSoundSettings() {
    const raw = localStorage.getItem(SOUND_SETTINGS_KEY);
    if (!raw) return;

    try {
        const saved = JSON.parse(raw);
        isSoundOn = Boolean(saved.isSoundOn);
        masterVolume = clampVolume(Number(saved.masterVolume ?? DEFAULT_MASTER_VOLUME));
    } catch (error) {
        isSoundOn = true;
        masterVolume = DEFAULT_MASTER_VOLUME;
    }
}

function startBgmPlaylist(mode = "normal") {
    currentBgmMode = mode;
    currentBgmList = shuffleArray(mode === "danger" ? dangerBgmTracks : normalBgmTracks);
    currentBgmIndex = 0;

    if (currentBgmList.length === 0) return;

    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    bgmAudio.src = currentBgmList[currentBgmIndex];
    bgmAudio.play().catch(() => {});
}

function playNextBgmTrack() {
    if (currentBgmList.length === 0) return;

    currentBgmIndex++;

    if (currentBgmIndex >= currentBgmList.length) {
        currentBgmList = shuffleArray(currentBgmMode === "danger" ? dangerBgmTracks : normalBgmTracks);
        currentBgmIndex = 0;
    }

    bgmAudio.src = currentBgmList[currentBgmIndex];
    bgmAudio.play().catch(() => {});
}

function stopBgm() {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    bgmAudio.src = "";
    currentBgmList = [];
    currentBgmIndex = -1;
    currentBgmMode = "normal";
}

function pauseBgm() {
    bgmAudio.pause();
}

function resumeBgm() {
    if (!bgmAudio.src) return;
    bgmAudio.play().catch(() => {});
}

/* UI DISPLAY HELPER */

function setPlayType(type) {
    currentPlayType = type;

    if (singleRunBtn) singleRunBtn.classList.toggle("active", type === "single");
    if (continuousRunBtn) continuousRunBtn.classList.toggle("active", type === "continuous");

    if (playTypeDescription) {
        playTypeDescription.textContent =
            type === "single"
                ? "Play exactly 1 match and get the final result."
                : "Keep playing stage after stage with accumulated score until you press End or lose.";
    }
}

function updateScoreDisplay() {
    if (currentPlayType === "continuous") {
        scoreElement.textContent = `Total: ${runTotalScore} | Stage Score: ${score} | Stage: ${currentStage}`;
    } else {
        scoreElement.textContent = `Score: ${score}`;
    }
}

function updateHintDisplay() {
    if (!hintBtn) return;

    if (!currentMode || currentModeName !== "easy" || hintsLeft <= 0) {
        hintBtn.classList.add("hidden");
        hintBtn.disabled = true;
        hintBtn.textContent = "💡Hints";
        return;
    }

    hintBtn.classList.remove("hidden");
    hintBtn.disabled = false;
    hintBtn.textContent = `💡Hints: ${hintsLeft}`;
}

function updateReshuffleDisplay() {
    if (!reshuffleBtn) return;

    if (!currentModeName) {
        reshuffleBtn.classList.add("hidden");
        reshuffleBtn.disabled = true;
        reshuffleBtn.textContent = "🔄 Reshuffle";
        return;
    }

    if (currentModeName === "easy") {
        const shouldShow = hintsLeft <= 0;

        if (!shouldShow) {
            reshuffleBtn.classList.add("hidden");
            reshuffleBtn.disabled = true;
            reshuffleBtn.textContent = "🔄 Reshuffle";
            return;
        }

        reshuffleBtn.classList.remove("hidden");
        reshuffleBtn.textContent = `🔄 Reshuffle: ${reshufflesLeft}`;
        reshuffleBtn.disabled = reshufflesLeft <= 0;
        return;
    }

    const manualModes = ["hard", "insane"];
    if (!manualModes.includes(currentModeName)) {
        reshuffleBtn.classList.add("hidden");
        reshuffleBtn.disabled = true;
        reshuffleBtn.textContent = "🔄 Reshuffle";
        return;
    }

    reshuffleBtn.classList.remove("hidden");
    reshuffleBtn.textContent = `🔄 Reshuffle: ${reshufflesLeft}`;
    reshuffleBtn.disabled = reshufflesLeft <= 0;
}

function updateEndRunButton() {
    if (!endRunBtn) return;

    if (currentPlayType === "continuous" && currentModeName) {
        endRunBtn.classList.remove("hidden");
        endRunBtn.disabled = false;
    } else {
        endRunBtn.classList.add("hidden");
        endRunBtn.disabled = true;
    }
}

function updateTimeColumnDisplay() {
    if (!timeBar || !timeBarValue) return;

    if (!currentMode) {
        timeBar.style.height = "0%";
        timeBar.classList.remove("warning", "danger");
        timeBarValue.textContent = "00:00";
        return;
    }

    const ratio = Math.max(0, Math.min(1, timeLeft / currentMode.timeLeft));
    const percent = ratio * 100;

    timeBar.style.height = `${percent}%`;
    timeBar.classList.remove("warning", "danger");

    if (ratio <= 0.2) {
        timeBar.classList.add("danger");
    } else if (ratio <= 0.5) {
        timeBar.classList.add("warning");
    }

    timeBarValue.textContent = formatTime(Math.max(0, timeLeft));
}

function updateBoardBackground() {
    if (!boardElement) return;

    const backgroundMap = {
        easy: "image/board_easy.jpg",
        hard: "image/board_hard.jpg",
        insane: "image/board_insane.jpg",
        impossible: "image/board_impossible.jpg"
    };

    const background = backgroundMap[currentModeName];
    boardElement.style.backgroundImage = background ? `url("${background}")` : "none";
}

/* SCREEN FLOW */

function showStartScreen() {
    clearInterval(timeInterval);
    clearNextStageTimeout();
    clearPendingActions();
    stopBgm();

    startScreen.classList.remove("hidden");
    gameContainer.classList.add("hidden");
    endScreen.classList.add("hidden");
    pauseOverlay.classList.add("hidden");
    boardWrapper.classList.remove("paused");

    resetBoardSelections();
    resetCombo();
    resetRunProgress();

    bonusMessage.textContent = "";
    modeBonusMessage.textContent = "";
    totalScoreMessage.textContent = "";
    leaderboardRankMessage.textContent = "";

    pauseBtn.textContent = "⏸ Pause";
    isPaused = false;
    isGameOver = false;

    currentMode = null;
    currentModeName = null;
    reshufflesLeft = 0;
    insaneShiftDirection = null;
    hasSwitchedToDangerBgm = false;
    score = 0;

    clearPath();
    updateReshuffleDisplay();
    updateTimeColumnDisplay();
    renderLeaderboard();
}

function startGame(mode) {
    currentModeName = mode;
    currentMode = gameModes[mode];
    if (!currentMode) return;

    startScreen.classList.add("hidden");
    gameContainer.classList.remove("hidden");
    endScreen.classList.add("hidden");
    pauseOverlay.classList.add("hidden");
    boardWrapper.classList.remove("paused");

    isPaused = false;
    isGameOver = false;
    pauseBtn.textContent = "⏸ Pause";

    timeLeft = currentMode.timeLeft;
    hintsLeft = currentMode.hintsLeft;
    reshufflesLeft = currentMode.reshufflesLeft ?? 0;
    rows = currentMode.rows;
    cols = currentMode.cols;
    cellSize = currentMode.cellSize;

    if (currentModeName === "insane") {
        insaneShiftDirection = getRandomDirection();
    } else {
        insaneShiftDirection = null;
    }

    hasSwitchedToDangerBgm = false;
    updateBoardBackground();
    applySoundSettings();
    startBgmPlaylist("normal");

    updateTimeColumnDisplay();
    updateHintDisplay();
    updateReshuffleDisplay();
    updateEndRunButton();

    initGame();
    startTimer();
}

function initGame() {
    clearInterval(timeInterval);
    clearNextStageTimeout();
    clearPendingActions();

    score = 0;
    resetBoardSelections();
    resetCombo();

    updateScoreDisplay();
    updateTimeColumnDisplay();

    boardElement.style.gridTemplateColumns = `repeat(${cols}, ${cellSize}px)`;

    createBoard();
    renderBoard();
    resizeCanvas();
    clearPath();
}

function restartGame() {
    if (!currentModeName) return;

    clearInterval(timeInterval);
    clearNextStageTimeout();
    clearPendingActions();
    stopBgm();

    resetRunProgress();
    endScreen.classList.add("hidden");

    startGame(currentModeName);
}

function showEndScreen(message, bonusText = "", modeBonusText = "", totalScoreText = "", leaderBoardRankText = "") {
    startScreen.classList.add("hidden");
    gameContainer.classList.add("hidden");
    endScreen.classList.remove("hidden");

    endMessage.textContent = message;
    bonusMessage.textContent = bonusText;
    modeBonusMessage.textContent = modeBonusText;
    totalScoreMessage.textContent = totalScoreText;
    leaderboardRankMessage.textContent = leaderBoardRankText;

    endScreen.classList.remove("win-flash");
    endMessage.classList.remove("win-pop");

    if (message.includes("WIN")) {
        void endScreen.offsetWidth;
        void endMessage.offsetWidth;
        endScreen.classList.add("win-flash");
        endMessage.classList.add("win-pop");
    }
}

function hideEndScreen() {
    gameContainer.classList.remove("hidden");
    endScreen.classList.add("hidden");
    endMessage.textContent = "";
}

function showStageClearOverlay(stageNumber, timeBonus, modeBonus) {
    endMessage.textContent = `STAGE ${stageNumber} CLEARED!`;
    bonusMessage.textContent = `⚡ Time bonus: +${timeBonus}`;
    modeBonusMessage.textContent = `🎯 Mode bonus: +${modeBonus}`;
    totalScoreMessage.textContent = `🏆 Total Score: ${runTotalScore}`;
    leaderboardRankMessage.textContent = "Next stage is starting...";

    startScreen.classList.add("hidden");
    gameContainer.classList.add("hidden");
    endScreen.classList.remove("hidden");

    endScreen.classList.remove("win-flash");
    endMessage.classList.remove("win-pop");
}

/* BOARD / CANVAS RENDERING */

function createBoard() {
    const values = [];
    const totalCells = rows * cols;

    for (let i = 0; i < totalCells / 2; i++) {
        const value = BOARD_SYMBOLS[i % BOARD_SYMBOLS.length];
        values.push(value, value);
    }

    shuffle(values);

    board = [];
    let index = 0;

    for (let row = 0; row < rows + 2; row++) {
        const newRow = [];
        for (let col = 0; col < cols + 2; col++) {
            if (row === 0 || row === rows + 1 || col === 0 || col === cols + 1) {
                newRow.push(0);
            } else {
                newRow.push(values[index]);
                index++;
            }
        }
        board.push(newRow);
    }
}

function renderBoard() {
    boardElement.innerHTML = "";

    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;

            if (board[row][col] === 0) {
                cell.classList.add("removed");
            } else {
                const img = document.createElement("img");
                img.src = `image/${board[row][col]}`;
                img.style.width = "100%";
                img.style.height = "100%";
                img.style.objectFit = "contain";
                cell.appendChild(img);
            }

            if (firstSelected && firstSelected.row === row && firstSelected.col === col) {
                cell.classList.add("selected");
            }

            if (hintCells.some(item => item.row === row && item.col === col)) {
                cell.classList.add("hint");
            }

            if (wrongCells.some(item => item.row === row && item.col === col)) {
                cell.classList.add("wrong");
            }

            if (matchedCells.some(item => item.row === row && item.col === col)) {
                cell.classList.add("matched");
            }

            cell.addEventListener("click", () => handleCellClick(row, col));
            boardElement.appendChild(cell);
        }
    }
}

function getCellCenter(row, col) {
    const index = (row - 1) * cols + (col - 1);
    const cell = boardElement.children[index];
    if (!cell) return { x: 0, y: 0 };

    const wrapperRect = boardElement.parentElement.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();

    return {
        x: cellRect.left - wrapperRect.left + cellRect.width / 2,
        y: cellRect.top - wrapperRect.top + cellRect.height / 2
    };
}

function getCanvasPoint(row, col) {
    const firstCell = getCellCenter(1, 1);
    const secondCell = getCellCenter(1, 2);
    const belowCell = getCellCenter(2, 1);

    const stepX = secondCell.x - firstCell.x;
    const stepY = belowCell.y - firstCell.y;

    let x;
    let y;

    if (col >= 1 && col <= cols) x = getCellCenter(1, col).x + stepX;
    if (col === 0) x = firstCell.x;
    if (col === cols + 1) x = getCellCenter(1, cols).x + stepX * 2;

    if (row >= 1 && row <= rows) y = getCellCenter(row, 1).y + stepY;
    if (row === 0) y = firstCell.y;
    if (row === rows + 1) y = getCellCenter(rows, 1).y + stepY * 2;

    return { x, y };
}

function resizeCanvas() {
    const firstCell = getCanvasPoint(1, 1);
    const secondCell = getCanvasPoint(1, 2);
    const belowCell = getCanvasPoint(2, 1);

    const stepX = secondCell.x - firstCell.x;
    const stepY = belowCell.y - firstCell.y;

    canvas.width = boardElement.offsetWidth + stepX * 2;
    canvas.height = boardElement.offsetHeight + stepY * 2;
    canvas.style.left = `${-stepX}px`;
    canvas.style.top = `${-stepY}px`;
}

function clearPath() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawPath(path) {
    clearPath();

    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "blue";
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const start = getCanvasPoint(path[0].row, path[0].col);
    ctx.moveTo(start.x, start.y);

    for (let i = 1; i < path.length; i++) {
        const point = getCanvasPoint(path[i].row, path[i].col);
        ctx.lineTo(point.x, point.y);
    }

    ctx.stroke();
}

/* PATH FINDING */

function checkLineX(row, col1, col2) {
    const min = Math.min(col1, col2);
    const max = Math.max(col1, col2);

    for (let i = min + 1; i < max; i++) {
        if (board[row][i] !== 0) return false;
    }
    return true;
}

function checkLineY(col, row1, row2) {
    const min = Math.min(row1, row2);
    const max = Math.max(row1, row2);

    for (let i = min + 1; i < max; i++) {
        if (board[i][col] !== 0) return false;
    }
    return true;
}

function checkStraight(p1, p2) {
    if (p1.row === p2.row && checkLineX(p1.row, p1.col, p2.col)) {
        return [p1, p2];
    }
    if (p1.col === p2.col && checkLineY(p1.col, p1.row, p2.row)) {
        return [p1, p2];
    }
    return null;
}

function checkOneTurn(p1, p2) {
    const corner1 = { row: p1.row, col: p2.col };
    const corner2 = { row: p2.row, col: p1.col };

    if (
        board[corner1.row][corner1.col] === 0 &&
        checkLineX(corner1.row, p1.col, p2.col) &&
        checkLineY(corner1.col, p1.row, p2.row)
    ) {
        return [p1, corner1, p2];
    }

    if (
        board[corner2.row][corner2.col] === 0 &&
        checkLineX(corner2.row, p1.col, p2.col) &&
        checkLineY(corner2.col, p1.row, p2.row)
    ) {
        return [p1, corner2, p2];
    }

    return null;
}

function checkTwoTurns(p1, p2) {
    for (let col = p1.col + 1; col < cols + 2; col++) {
        if (board[p1.row][col] !== 0) break;
        const mid = { row: p1.row, col };
        const subPath = checkOneTurn(mid, p2);
        if (subPath) return [p1, ...subPath];
    }

    for (let col = p1.col - 1; col >= 0; col--) {
        if (board[p1.row][col] !== 0) break;
        const mid = { row: p1.row, col };
        const subPath = checkOneTurn(mid, p2);
        if (subPath) return [p1, ...subPath];
    }

    for (let row = p1.row - 1; row >= 0; row--) {
        if (board[row][p1.col] !== 0) break;
        const mid = { row, col: p1.col };
        const subPath = checkOneTurn(mid, p2);
        if (subPath) return [p1, ...subPath];
    }

    for (let row = p1.row + 1; row < rows + 2; row++) {
        if (board[row][p1.col] !== 0) break;
        const mid = { row, col: p1.col };
        const subPath = checkOneTurn(mid, p2);
        if (subPath) return [p1, ...subPath];
    }

    return null;
}

function canConnect(p1, p2) {
    return checkStraight(p1, p2) || checkOneTurn(p1, p2) || checkTwoTurns(p1, p2);
}

function findValidMove() {
    for (let row1 = 1; row1 <= rows; row1++) {
        for (let col1 = 1; col1 <= cols; col1++) {
            if (board[row1][col1] === 0) continue;

            for (let row2 = 1; row2 <= rows; row2++) {
                for (let col2 = 1; col2 <= cols; col2++) {
                    if (board[row2][col2] === 0) continue;
                    if (row1 === row2 && col1 === col2) continue;
                    if (board[row1][col1] !== board[row2][col2]) continue;

                    const p1 = { row: row1, col: col1 };
                    const p2 = { row: row2, col: col2 };

                    if (canConnect(p1, p2)) {
                        return [p1, p2];
                    }
                }
            }
        }
    }

    return null;
}

function hasValidMove() {
    return findValidMove() !== null;
}

/* BOARD MUTATION HELPERS */

function reshuffleBoard() {
    const remainingValues = [];

    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            if (board[row][col] !== 0) {
                remainingValues.push(board[row][col]);
            }
        }
    }

    shuffle(remainingValues);

    let index = 0;
    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            if (board[row][col] !== 0) {
                board[row][col] = remainingValues[index];
                index++;
            }
        }
    }
}

function rebuildRemainingBoard() {
    const remainingPositions = [];

    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            if (board[row][col] !== 0) {
                remainingPositions.push({ row, col });
            }
        }
    }

    const remainingCount = remainingPositions.length;
    if (remainingCount === 0) return;

    const newValues = [];
    const pairCount = Math.floor(remainingCount / 2);

    for (let i = 0; i < pairCount; i++) {
        const value = BOARD_SYMBOLS[i % BOARD_SYMBOLS.length];
        newValues.push(value, value);
    }

    shuffle(newValues);

    for (let i = 0; i < remainingPositions.length; i++) {
        const { row, col } = remainingPositions[i];
        board[row][col] = newValues[i];
    }
}

function reshuffleUntilValid() {
    let attempts = 0;

    do {
        reshuffleBoard();
        attempts++;
    } while (!hasValidMove() && attempts < 100);

    if (hasValidMove()) return;

    rebuildRemainingBoard();

    let fallbackAttempts = 0;
    do {
        reshuffleBoard();
        fallbackAttempts++;
    } while (!hasValidMove() && fallbackAttempts < 20);

    if (!hasValidMove()) {
        notify("Board was regenerated because no valid moves were available.", "warning");
    }
}

function shuffleRemainingBoard() {
    reshuffleUntilValid();
    renderBoard();
    resizeCanvas();
    clearPath();
}

function getRandomDirection() {
    const directions = ["up", "down", "left", "right"];
    return directions[Math.floor(Math.random() * directions.length)];
}

function compressLine(line) {
    const nonZero = line.filter(value => value !== 0);
    while (nonZero.length < line.length) {
        nonZero.push(0);
    }
    return nonZero;
}

function shiftBoard(direction) {
    if (direction === "left") {
        for (let row = 1; row <= rows; row++) {
            const line = [];
            for (let col = 1; col <= cols; col++) line.push(board[row][col]);

            const compressed = compressLine(line);
            for (let col = 1; col <= cols; col++) board[row][col] = compressed[col - 1];
        }
        return;
    }

    if (direction === "right") {
        for (let row = 1; row <= rows; row++) {
            const line = [];
            for (let col = 1; col <= cols; col++) line.push(board[row][col]);

            line.reverse();
            const compressed = compressLine(line);
            compressed.reverse();

            for (let col = 1; col <= cols; col++) board[row][col] = compressed[col - 1];
        }
        return;
    }

    if (direction === "up") {
        for (let col = 1; col <= cols; col++) {
            const line = [];
            for (let row = 1; row <= rows; row++) line.push(board[row][col]);

            const compressed = compressLine(line);
            for (let row = 1; row <= rows; row++) board[row][col] = compressed[row - 1];
        }
        return;
    }

    if (direction === "down") {
        for (let col = 1; col <= cols; col++) {
            const line = [];
            for (let row = 1; row <= rows; row++) line.push(board[row][col]);

            line.reverse();
            const compressed = compressLine(line);
            compressed.reverse();

            for (let row = 1; row <= rows; row++) board[row][col] = compressed[row - 1];
        }
    }
}

/* GAMEPLAY ACTIONS */

function useManualReshuffle() {
    if (isGameOver || isBoardBusy) return;

    const canUseInEasy = currentModeName === "easy" && hintsLeft <= 0;
    const canUseInOtherModes = ["hard", "insane"].includes(currentModeName);

    if (!canUseInEasy && !canUseInOtherModes) return;

    if (reshufflesLeft <= 0) {
        notify("YOU HAVE USED ALL RESHUFFLES!", "warning");
        updateReshuffleDisplay();
        return;
    }

    reshufflesLeft--;
    firstSelected = null;
    secondSelected = null;
    wrongCells = [];
    hintCells = [];

    resetCombo();
    clearPath();
    updateReshuffleDisplay();
    shuffleRemainingBoard();
}

function useHint() {
    if (isGameOver || isBoardBusy) return;
    if (hintsLeft <= 0) return;

    const move = findValidMove();

    if (!move) {
        notify("No valid moves available. Reshuffling board...", "info");
        shuffleRemainingBoard();
        return;
    }

    hintCells = [move[0], move[1]];
    renderBoard();

    hintsLeft--;
    score = Math.max(0, score - 200);

    updateScoreDisplay();
    updateHintDisplay();
    updateReshuffleDisplay();

    if (currentModeName === "easy" && hintsLeft === 0) {
        notify("All hints used. Reshuffle unlocked!", "warning");
    }

    clearTimeout(hintClearTimeout);
    hintClearTimeout = setTimeout(() => {
        hintCells = [];
        hintClearTimeout = null;
        renderBoard();
    }, 5000);
}

function handleCellClick(row, col) {
    if (isGameOver || isBoardBusy || isPaused) return;
    if (board[row][col] === 0) return;

    if (firstSelected === null) {
        firstSelected = { row, col };
        renderBoard();
        return;
    }

    if (firstSelected.row === row && firstSelected.col === col) {
        playWrongSound();
        resetCombo();

        isBoardBusy = true;
        wrongCells = [{ ...firstSelected }, { ...firstSelected }];
        renderBoard();

        clearTimeout(wrongResolveTimeout);
        wrongResolveTimeout = setTimeout(() => {
            firstSelected = null;
            secondSelected = null;
            wrongCells = [];
            isBoardBusy = false;
            wrongResolveTimeout = null;
            renderBoard();
            clearPath();
        }, 1000);
        return;
    }

    secondSelected = { row, col };

    const value1 = board[firstSelected.row][firstSelected.col];
    const value2 = board[secondSelected.row][secondSelected.col];
    const path = canConnect(firstSelected, secondSelected);

    if (value1 === value2 && path) {
        playMatchSound();

        const p1 = { ...firstSelected };
        const p2 = { ...secondSelected };

        drawPath(path);

        clearTimeout(comboTimeOut);
        combo += 1;

        isBoardBusy = true;
        matchedCells = [p1, p2];
        renderBoard();

        clearTimeout(matchResolveTimeout);
        matchResolveTimeout = setTimeout(() => {
            board[p1.row][p1.col] = 0;
            board[p2.row][p2.col] = 0;
            matchedCells = [];

            if (currentModeName === "insane") {
                shiftBoard(insaneShiftDirection);
            } else if (currentModeName === "impossible") {
                shiftBoard(getRandomDirection());
            }

            const comboBonusPerLevel = getComboBonusPerLevel();
            const effectiveCombo = Math.min(combo, 5);

            score += 100 + (effectiveCombo - 1) * comboBonusPerLevel;
            updateScoreDisplay();

            firstSelected = null;
            secondSelected = null;
            wrongCells = [];

            clearPath();
            renderBoard();
            resizeCanvas();

            isBoardBusy = false;
            matchResolveTimeout = null;

            comboTimeOut = setTimeout(() => {
                resetCombo();
            }, currentModeName === "insane" || currentModeName === "impossible" ? 5000 : 3000);

            if (checkWin()) return;

            if (!hasValidMove()) {
                notify("There are no choices left! Reshuffle!", "info");
                shuffleRemainingBoard();
            }
        }, 700);

        return;
    }

    playWrongSound();
    resetCombo();

    isBoardBusy = true;
    wrongCells = [{ ...firstSelected }, { ...secondSelected }];
    renderBoard();

    clearTimeout(wrongResolveTimeout);
    wrongResolveTimeout = setTimeout(() => {
        firstSelected = null;
        secondSelected = null;
        wrongCells = [];
        isBoardBusy = false;
        wrongResolveTimeout = null;
        renderBoard();
        clearPath();
    }, 1000);
}

/* SCORE / TIMER / RESULT */

function getComboBonusPerLevel() {
    switch (currentModeName) {
        case "easy":
            return 10;
        case "hard":
            return 15;
        case "insane":
            return 25;
        case "impossible":
            return 35;
        default:
            return 10;
    }
}

function getModeBonus() {
    if (currentModeName === "hard") return 500;
    if (currentModeName === "insane") return 1200;
    if (currentModeName === "impossible") return 2500;
    return 0;
}

function getTimeBonus() {
    if (currentModeName === "hard") return 12;
    if (currentModeName === "insane") return 16;
    if (currentModeName === "impossible") return 20;
    return 8;
}

function startTimer() {
    clearInterval(timeInterval);

    timeInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft < 0) timeLeft = 0;

        updateTimeColumnDisplay();

        if (timeLeft === 60 && !hasSwitchedToDangerBgm) {
            hasSwitchedToDangerBgm = true;
            startBgmPlaylist("danger");
        }

        if (timeLeft === 0) {
            if (isBoardBusy) return;
            handleTimeUp();
        }
    }, 1000);
}

function checkWin() {
    for (let row = 1; row <= rows; row++) {
        for (let col = 1; col <= cols; col++) {
            if (board[row][col] !== 0) return false;
        }
    }

    const timeBonus = timeLeft * getTimeBonus();
    const modeBonus = getModeBonus();
    const stageUsedSeconds = currentMode.timeLeft - timeLeft;
    const stageScore = score + timeBonus + modeBonus;

    clearInterval(timeInterval);
    clearPendingActions();
    stopBgm();

    isGameOver = true;

    winSound.currentTime = 0;
    winSound.play().catch(() => {});

    runTotalScore += stageScore;
    runUsedSeconds += stageUsedSeconds;
    stagesCleared += 1;

    updateScoreDisplay();

    if (currentPlayType === "continuous") {
        const finishedStage = currentStage;
        showStageClearOverlay(finishedStage, timeBonus, modeBonus);

        currentStage += 1;

        clearNextStageTimeout();
        nextStageTimeout = setTimeout(() => {
            nextStageTimeout = null;
            startGame(currentModeName);
        }, 1000);

        return true;
    }

    score = stageScore;
    const rank = saveLeaderboard(currentModeName);

    showEndScreen(
        "CONGRATULATIONS, YOU WIN!",
        `⚡ Time bonus: +${timeBonus}`,
        `🎯 Mode bonus: +${modeBonus}`,
        `🏆 Total Score: ${score}`,
        rank ? `🔥 You have reached Top ${rank} on Leaderboard!` : ""
    );

    return true;
}

function handleTimeUp() {
    clearInterval(timeInterval);
    clearNextStageTimeout();
    clearPendingActions();
    stopBgm();

    isGameOver = true;
    firstSelected = null;
    secondSelected = null;

    clearPath();
    renderBoard();

    loseSound.currentTime = 0;
    loseSound.play().catch(() => {});

    runUsedSeconds += currentMode.timeLeft - timeLeft;

    const finalScore = currentPlayType === "continuous" ? runTotalScore : score;
    const rank = saveLeaderboard(currentModeName);

    showEndScreen(
        "TIME'S UP!",
        `🏴‍☠️ Stages cleared: ${stagesCleared}`,
        "",
        `🏆 Total Score: ${finalScore}`,
        rank ? `🔥 You reached Top ${rank} on Leaderboard!` : ""
    );
}

function endContinuousRun() {
    if (isGameOver || !currentMode || currentPlayType !== "continuous") return;

    clearInterval(timeInterval);
    clearNextStageTimeout();
    clearPendingActions();
    stopBgm();

    isGameOver = true;
    firstSelected = null;
    secondSelected = null;

    clearPath();
    renderBoard();

    runUsedSeconds += currentMode.timeLeft - timeLeft;

    const rank = saveLeaderboard(currentModeName);

    showEndScreen(
        "CONTINUOUS RUN ENDED",
        `🏴‍☠️ Stages cleared: ${stagesCleared}`,
        "",
        `🏆 Total Score: ${runTotalScore}`,
        rank ? `🔥 You reached Top ${rank} on Leaderboard!` : ""
    );
}

/* LEADERBOARD */

function saveLeaderboard(finalMode = currentModeName) {
    if (!finalMode || !currentMode) return null;

    const usedSeconds = currentPlayType === "continuous"
        ? runUsedSeconds
        : currentMode.timeLeft - timeLeft;

    const finalScore = currentPlayType === "continuous"
        ? runTotalScore
        : score;

    const stagesPlayed = currentPlayType === "continuous"
        ? stagesCleared
        : 1;

    const newRecord = {
        id: Date.now() + Math.random(),
        score: finalScore,
        usedSeconds,
        time: formatTime(usedSeconds),
        mode: finalMode.toUpperCase(),
        stagesPlayed
    };

    const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    leaderboard.push(newRecord);

    leaderboard.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.stagesPlayed !== a.stagesPlayed) return b.stagesPlayed - a.stagesPlayed;
        return a.usedSeconds - b.usedSeconds;
    });

    const trimmed = leaderboard.slice(0, 10);
    const rank = trimmed.findIndex(item => item.id === newRecord.id) + 1;

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));

    return rank >= 1 && rank <= 10 ? rank : null;
}

function renderLeaderboard() {
    if (!leaderboardBody) return;

    const leaderboard = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || "[]");
    leaderboardBody.innerHTML = "";

    if (leaderboard.length === 0) {
        leaderboardBody.innerHTML = `
            <tr>
                <td colspan="5">No records yet</td>
            </tr>
        `;
        return;
    }

    leaderboard.forEach((item, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${item.score}</td>
            <td>${item.time}</td>
            <td>${item.mode}</td>
            <td>${item.stagesPlayed ?? 1}</td>
        `;
        leaderboardBody.appendChild(row);
    });
}

/* PAUSE */

function togglePause() {
    if (!currentMode || isGameOver || isBoardBusy) return;

    isPaused = !isPaused;

    if (isPaused) {
        clearInterval(timeInterval);
        clearPath();
        pauseBgm();

        pauseOverlay.classList.remove("hidden");
        boardWrapper.classList.add("paused");
        pauseBtn.textContent = "▶ Resume";
        return;
    }

    pauseOverlay.classList.add("hidden");
    boardWrapper.classList.remove("paused");
    pauseBtn.textContent = "⏸ Pause";

    resumeBgm();
    startTimer();
}

/* EVENTS */

bgmAudio.addEventListener("ended", playNextBgmTrack);

soundBtn.addEventListener("click", () => {
    if (isSoundOn) {
        turnOffSound();
    } else {
        turnOnSound();
    }
});

if (volumeSlider) {
    volumeSlider.addEventListener("input", (event) => {
        masterVolume = clampVolume(Number(event.target.value) / 100);
        isSoundOn = masterVolume > 0;
        applySoundSettings();
        saveSoundSettings();
    });
}

homeBtn.addEventListener("click", showStartScreen);
hintBtn.addEventListener("click", useHint);
reshuffleBtn.addEventListener("click", useManualReshuffle);
restartBtn.addEventListener("click", restartGame);
pauseBtn.addEventListener("click", togglePause);
endRunBtn.addEventListener("click", endContinuousRun);

window.addEventListener("resize", () => {
    if (gameContainer.classList.contains("hidden")) return;
    resizeCanvas();
    clearPath();
});

/* BOOTSTRAP */

loadSoundSettings();
applySoundSettings();
setPlayType("single");
renderLeaderboard();
showStartScreen();