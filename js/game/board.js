import { state, BOARD_SYMBOLS } from "../state.js";
import { dom } from "../dom.js";
import { handleCellClick } from "./scoring.js";

function assetUrl(relativePath) {
  return new URL(relativePath, import.meta.url).href;
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function shuffleArray(array) {
  const arr = [...array];
  shuffle(arr);
  return arr;
}

export function createSeededRandom(seed) {
  let hash = 2166136261;

  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return function () {
    hash += 0x6D2B79F5;
    let t = hash;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleWithSeed(array, seed) {
  const arr = [...array];
  const random = createSeededRandom(seed);

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

export function createBoard() {
  const values = [];
  const totalCells = state.rows * state.cols;

  for (let i = 0; i < totalCells / 2; i++) {
    const value = BOARD_SYMBOLS[i % BOARD_SYMBOLS.length];
    values.push(value, value);
  }

  const shuffledValues = state.currentBoardSeed
    ? shuffleWithSeed(values, state.currentBoardSeed)
    : shuffleArray(values);

  state.board = [];
  let index = 0;

  for (let row = 0; row < state.rows + 2; row++) {
    const newRow = [];

    for (let col = 0; col < state.cols + 2; col++) {
      if (
        row === 0 ||
        row === state.rows + 1 ||
        col === 0 ||
        col === state.cols + 1
      ) {
        newRow.push(0);
      } else {
        newRow.push(shuffledValues[index]);
        index++;
      }
    }

    state.board.push(newRow);
  }
}

export function renderBoard() {
  if (!dom.boardElement) return;

  dom.boardElement.innerHTML = "";

  for (let row = 1; row <= state.rows; row++) {
    for (let col = 1; col <= state.cols; col++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.style.width = `${state.cellSize}px`;
      cell.style.height = `${state.cellSize}px`;

      if (state.board[row][col] === 0) {
        cell.classList.add("removed");
      } else {
        const img = document.createElement("img");
        img.src = assetUrl(`../../image/${state.board[row][col]}`);
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "contain";
        cell.appendChild(img);
      }

      if (
        state.firstSelected &&
        state.firstSelected.row === row &&
        state.firstSelected.col === col
      ) {
        cell.classList.add("selected");
      }

      if (state.hintCells.some((item) => item.row === row && item.col === col)) {
        cell.classList.add("hint");
      }

      if (state.wrongCells.some((item) => item.row === row && item.col === col)) {
        cell.classList.add("wrong");
      }

      if (state.matchedCells.some((item) => item.row === row && item.col === col)) {
        cell.classList.add("matched");
      }

      cell.addEventListener("click", () => handleCellClick(row, col));
      dom.boardElement.appendChild(cell);
    }
  }
}

export function getCellCenter(row, col) {
  const index = (row - 1) * state.cols + (col - 1);
  const cell = dom.boardElement?.children[index];
  if (!cell || !dom.boardElement?.parentElement) return { x: 0, y: 0 };

  const wrapperRect = dom.boardElement.parentElement.getBoundingClientRect();
  const cellRect = cell.getBoundingClientRect();

  return {
    x: cellRect.left - wrapperRect.left + cellRect.width / 2,
    y: cellRect.top - wrapperRect.top + cellRect.height / 2
  };
}

export function getCanvasPoint(row, col) {
  const firstCell = getCellCenter(1, 1);
  const secondCell = getCellCenter(1, 2);
  const belowCell = getCellCenter(2, 1);

  const stepX = secondCell.x - firstCell.x;
  const stepY = belowCell.y - firstCell.y;

  let x;
  let y;

  if (col >= 1 && col <= state.cols) x = getCellCenter(1, col).x + stepX;
  if (col === 0) x = firstCell.x;
  if (col === state.cols + 1) x = getCellCenter(1, state.cols).x + stepX * 2;

  if (row >= 1 && row <= state.rows) y = getCellCenter(row, 1).y + stepY;
  if (row === 0) y = firstCell.y;
  if (row === state.rows + 1) y = getCellCenter(state.rows, 1).y + stepY * 2;

  return { x, y };
}

export function resizeCanvas() {
  if (!dom.canvas || !dom.boardElement) return;

  const firstCell = getCanvasPoint(1, 1);
  const secondCell = getCanvasPoint(1, 2);
  const belowCell = getCanvasPoint(2, 1);

  const stepX = secondCell.x - firstCell.x;
  const stepY = belowCell.y - firstCell.y;

  dom.canvas.width = dom.boardElement.offsetWidth + stepX * 2;
  dom.canvas.height = dom.boardElement.offsetHeight + stepY * 2;
  dom.canvas.style.left = `${-stepX}px`;
  dom.canvas.style.top = `${-stepY}px`;
}

export function clearPath() {
  dom.ctx?.clearRect(0, 0, dom.canvas.width, dom.canvas.height);
}

export function drawPath(path) {
  if (!dom.ctx) return;

  clearPath();

  dom.ctx.beginPath();
  dom.ctx.lineWidth = 10;
  dom.ctx.strokeStyle = "blue";
  dom.ctx.lineJoin = "round";
  dom.ctx.lineCap = "round";

  const start = getCanvasPoint(path[0].row, path[0].col);
  dom.ctx.moveTo(start.x, start.y);

  for (let i = 1; i < path.length; i++) {
    const point = getCanvasPoint(path[i].row, path[i].col);
    dom.ctx.lineTo(point.x, point.y);
  }

  dom.ctx.stroke();
}