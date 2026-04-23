import { state } from "../state.js";
import { notify, updateScoreDisplay, updateHintDisplay, updateReshuffleDisplay, showStageClearOverlay, showEndScreen } from "../ui.js";
import { playMatchSound, playWrongSound, stopBgm, winSound } from "../audio.js";
import { clearPath, drawPath, renderBoard, resizeCanvas } from "./board.js";
import { canConnect, findValidMove, hasValidMove } from "./pathfinding.js";
import { isRoomPvpMode, finishRoomMatch } from "../pvp/room.js";
import { finishBotPracticeMatch } from "../pvp/bot.js";
import { renderLeaderboard, saveLeaderboard } from "./offline.js";

export function clearPendingActions() {
  clearTimeout(state.matchResolveTimeout);
  clearTimeout(state.wrongResolveTimeout);
  clearTimeout(state.hintClearTimeout);

  state.matchResolveTimeout = null;
  state.wrongResolveTimeout = null;
  state.hintClearTimeout = null;

  state.isBoardBusy = false;
}

export function clearNextStageTimeout() {
  clearTimeout(state.nextStageTimeout);
  state.nextStageTimeout = null;
}

export function resetCombo() {
  state.combo = 0;
  clearTimeout(state.comboTimeOut);
  state.comboTimeOut = null;
}

export function resetRunProgress() {
  state.runTotalScore = 0;
  state.currentStage = 1;
  state.stagesCleared = 0;
  state.runUsedSeconds = 0;
}

export function resetBoardSelections() {
  state.firstSelected = null;
  state.secondSelected = null;
  state.hintCells = [];
  state.wrongCells = [];
  state.matchedCells = [];
}

export function getRandomDirection() {
  const directions = ["up", "down", "left", "right"];
  return directions[Math.floor(Math.random() * directions.length)];
}

function compressLine(line) {
  const nonZero = line.filter((value) => value !== 0);
  while (nonZero.length < line.length) {
    nonZero.push(0);
  }
  return nonZero;
}

export function shiftBoard(direction) {
  if (direction === "left") {
    for (let row = 1; row <= state.rows; row++) {
      const line = [];
      for (let col = 1; col <= state.cols; col++) line.push(state.board[row][col]);

      const compressed = compressLine(line);
      for (let col = 1; col <= state.cols; col++) {
        state.board[row][col] = compressed[col - 1];
      }
    }
    return;
  }

  if (direction === "right") {
    for (let row = 1; row <= state.rows; row++) {
      const line = [];
      for (let col = 1; col <= state.cols; col++) line.push(state.board[row][col]);

      line.reverse();
      const compressed = compressLine(line);
      compressed.reverse();

      for (let col = 1; col <= state.cols; col++) {
        state.board[row][col] = compressed[col - 1];
      }
    }
    return;
  }

  if (direction === "up") {
    for (let col = 1; col <= state.cols; col++) {
      const line = [];
      for (let row = 1; row <= state.rows; row++) line.push(state.board[row][col]);

      const compressed = compressLine(line);
      for (let row = 1; row <= state.rows; row++) {
        state.board[row][col] = compressed[row - 1];
      }
    }
    return;
  }

  if (direction === "down") {
    for (let col = 1; col <= state.cols; col++) {
      const line = [];
      for (let row = 1; row <= state.rows; row++) line.push(state.board[row][col]);

      line.reverse();
      const compressed = compressLine(line);
      compressed.reverse();

      for (let row = 1; row <= state.rows; row++) {
        state.board[row][col] = compressed[row - 1];
      }
    }
  }
}

function reshuffleBoard() {
  const remainingValues = [];

  for (let row = 1; row <= state.rows; row++) {
    for (let col = 1; col <= state.cols; col++) {
      if (state.board[row][col] !== 0) {
        remainingValues.push(state.board[row][col]);
      }
    }
  }

  for (let i = remainingValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingValues[i], remainingValues[j]] = [remainingValues[j], remainingValues[i]];
  }

  let index = 0;
  for (let row = 1; row <= state.rows; row++) {
    for (let col = 1; col <= state.cols; col++) {
      if (state.board[row][col] !== 0) {
        state.board[row][col] = remainingValues[index];
        index++;
      }
    }
  }
}

function rebuildRemainingBoard() {
  const remainingPositions = [];

  for (let row = 1; row <= state.rows; row++) {
    for (let col = 1; col <= state.cols; col++) {
      if (state.board[row][col] !== 0) {
        remainingPositions.push({ row, col });
      }
    }
  }

  const remainingCount = remainingPositions.length;
  if (remainingCount === 0) return;

  const newValues = [];
  const pairCount = Math.floor(remainingCount / 2);

  for (let i = 0; i < pairCount; i++) {
    const value = `image${(i % 30) + 1}.png`;
    newValues.push(value, value);
  }

  for (let i = newValues.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newValues[i], newValues[j]] = [newValues[j], newValues[i]];
  }

  for (let i = 0; i < remainingPositions.length; i++) {
    const { row, col } = remainingPositions[i];
    state.board[row][col] = newValues[i];
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

export function shuffleRemainingBoard() {
  reshuffleUntilValid();
  renderBoard();
  resizeCanvas();
  clearPath();
}

export function useManualReshuffle() {
  if (state.isGameOver || state.isBoardBusy) return;

  const canUseInEasy = state.currentModeName === "easy" && state.hintsLeft <= 0;
  const canUseInOtherModes = ["hard", "insane"].includes(state.currentModeName);

  if (!canUseInEasy && !canUseInOtherModes) return;

  if (state.reshufflesLeft <= 0) {
    notify("YOU HAVE USED ALL RESHUFFLES!", "warning");
    updateReshuffleDisplay();
    return;
  }

  state.reshufflesLeft--;
  state.firstSelected = null;
  state.secondSelected = null;
  state.wrongCells = [];
  state.hintCells = [];

  resetCombo();
  clearPath();
  updateReshuffleDisplay();
  shuffleRemainingBoard();
}

export function useHint() {
  if (state.isGameOver || state.isBoardBusy) return;
  if (state.hintsLeft <= 0) return;

  const move = findValidMove();

  if (!move) {
    notify("No valid moves available. Reshuffling board...", "info");
    shuffleRemainingBoard();
    return;
  }

  state.hintCells = [move[0], move[1]];
  renderBoard();

  state.hintsLeft--;
  state.score = Math.max(0, state.score - 200);

  updateScoreDisplay();
  updateHintDisplay();
  updateReshuffleDisplay();

  if (state.currentModeName === "easy" && state.hintsLeft === 0) {
    notify("All hints used. Reshuffle unlocked!", "warning");
  }

  clearTimeout(state.hintClearTimeout);
  state.hintClearTimeout = setTimeout(() => {
    state.hintCells = [];
    state.hintClearTimeout = null;
    renderBoard();
  }, 5000);
}

export function getComboBonusPerLevel() {
  switch (state.currentModeName) {
    case "easy": return 10;
    case "hard": return 15;
    case "insane": return 25;
    case "impossible": return 35;
    default: return 10;
  }
}

export function getModeBonus() {
  if (state.currentModeName === "hard") return 500;
  if (state.currentModeName === "insane") return 1200;
  if (state.currentModeName === "impossible") return 2500;
  return 0;
}

export function getTimeBonus() {
  if (state.currentModeName === "hard") return 12;
  if (state.currentModeName === "insane") return 16;
  if (state.currentModeName === "impossible") return 20;
  return 8;
}

export function handleCellClick(row, col) {
  if (state.isGameOver || state.isBoardBusy || state.isPaused) return;
  if (state.board[row][col] === 0) return;

  if (state.firstSelected === null) {
    state.firstSelected = { row, col };
    renderBoard();
    return;
  }

  if (state.firstSelected.row === row && state.firstSelected.col === col) {
    playWrongSound();
    resetCombo();

    state.isBoardBusy = true;
    state.wrongCells = [{ ...state.firstSelected }, { ...state.firstSelected }];
    renderBoard();

    clearTimeout(state.wrongResolveTimeout);
    state.wrongResolveTimeout = setTimeout(() => {
      state.firstSelected = null;
      state.secondSelected = null;
      state.wrongCells = [];
      state.isBoardBusy = false;
      state.wrongResolveTimeout = null;
      renderBoard();
      clearPath();
    }, 1000);
    return;
  }

  state.secondSelected = { row, col };

  const value1 = state.board[state.firstSelected.row][state.firstSelected.col];
  const value2 = state.board[state.secondSelected.row][state.secondSelected.col];
  const path = canConnect(state.firstSelected, state.secondSelected);

  if (value1 === value2 && path) {
    playMatchSound();

    const p1 = { ...state.firstSelected };
    const p2 = { ...state.secondSelected };

    drawPath(path);

    clearTimeout(state.comboTimeOut);
    state.combo += 1;

    state.isBoardBusy = true;
    state.matchedCells = [p1, p2];
    renderBoard();

    clearTimeout(state.matchResolveTimeout);
    state.matchResolveTimeout = setTimeout(() => {
      state.board[p1.row][p1.col] = 0;
      state.board[p2.row][p2.col] = 0;
      state.matchedCells = [];

      if (state.currentModeName === "insane") {
        shiftBoard(state.insaneShiftDirection);
      } else if (state.currentModeName === "impossible") {
        shiftBoard(getRandomDirection());
      }

      const comboBonusPerLevel = getComboBonusPerLevel();
      const effectiveCombo = Math.min(state.combo, 5);

      state.score += 100 + (effectiveCombo - 1) * comboBonusPerLevel;
      updateScoreDisplay();

      state.firstSelected = null;
      state.secondSelected = null;
      state.wrongCells = [];

      clearPath();
      renderBoard();
      resizeCanvas();

      state.isBoardBusy = false;
      state.matchResolveTimeout = null;

      state.comboTimeOut = setTimeout(() => {
        resetCombo();
      }, state.currentModeName === "insane" || state.currentModeName === "impossible" ? 5000 : 3000);

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

  state.isBoardBusy = true;
  state.wrongCells = [{ ...state.firstSelected }, { ...state.secondSelected }];
  renderBoard();

  clearTimeout(state.wrongResolveTimeout);
  state.wrongResolveTimeout = setTimeout(() => {
    state.firstSelected = null;
    state.secondSelected = null;
    state.wrongCells = [];
    state.isBoardBusy = false;
    state.wrongResolveTimeout = null;
    renderBoard();
    clearPath();
  }, 1000);
}

export function checkWin() {
  for (let row = 1; row <= state.rows; row++) {
    for (let col = 1; col <= state.cols; col++) {
      if (state.board[row][col] !== 0) return false;
    }
  }

  const timeBonus = state.timeLeft * getTimeBonus();
  const modeBonus = getModeBonus();
  const stageUsedSeconds = state.currentMode.timeLeft - state.timeLeft;
  const stageScore = state.score + timeBonus + modeBonus;

  if (state.currentGameContext === "pvp") {
    clearInterval(state.timeInterval);
    clearPendingActions();
    stopBgm();

    state.isGameOver = true;

    winSound.currentTime = 0;
    winSound.play().catch(() => {});

    if (isRoomPvpMode()) {
      void finishRoomMatch(true, state.currentPvpMode);
    } else {
      void finishBotPracticeMatch(true);
    }

    return true;
  }

  clearInterval(state.timeInterval);
  clearPendingActions();
  stopBgm();

  state.isGameOver = true;

  winSound.currentTime = 0;
  winSound.play().catch(() => {});

  state.runTotalScore += stageScore;
  state.runUsedSeconds += stageUsedSeconds;
  state.stagesCleared += 1;

  if (state.currentPlayType === "continuous") {
    updateScoreDisplay();

    const finishedStage = state.currentStage;
    showStageClearOverlay(finishedStage, timeBonus, modeBonus);

    state.currentStage += 1;
    clearNextStageTimeout();

    state.nextStageTimeout = setTimeout(() => {
      state.nextStageTimeout = null;
      if (typeof window.startGame === "function") {
        window.startGame(state.currentModeName);
      }
    }, 1000);

    return true;
  }

  state.score = stageScore;
  const rank = saveLeaderboard(state.currentModeName);

  renderLeaderboard();

  showEndScreen(
    "CONGRATULATIONS, YOU WIN!",
    `⚡ Time bonus: +${timeBonus}`,
    `🎯 Mode bonus: +${modeBonus}`,
    `🏆 Total Score: ${state.score}`,
    rank ? `🔥 You have reached Top ${rank} on Leaderboard!` : ""
  );

  return true;
}