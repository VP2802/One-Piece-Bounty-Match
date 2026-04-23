import { state } from "../state.js";

export function checkLineX(row, col1, col2) {
  const min = Math.min(col1, col2);
  const max = Math.max(col1, col2);

  for (let i = min + 1; i < max; i++) {
    if (state.board[row][i] !== 0) return false;
  }

  return true;
}

export function checkLineY(col, row1, row2) {
  const min = Math.min(row1, row2);
  const max = Math.max(row1, row2);

  for (let i = min + 1; i < max; i++) {
    if (state.board[i][col] !== 0) return false;
  }

  return true;
}

export function checkStraight(p1, p2) {
  if (p1.row === p2.row && checkLineX(p1.row, p1.col, p2.col)) {
    return [p1, p2];
  }

  if (p1.col === p2.col && checkLineY(p1.col, p1.row, p2.row)) {
    return [p1, p2];
  }

  return null;
}

export function checkOneTurn(p1, p2) {
  const corner1 = { row: p1.row, col: p2.col };
  const corner2 = { row: p2.row, col: p1.col };

  if (
    state.board[corner1.row][corner1.col] === 0 &&
    checkLineX(corner1.row, p1.col, p2.col) &&
    checkLineY(corner1.col, p1.row, p2.row)
  ) {
    return [p1, corner1, p2];
  }

  if (
    state.board[corner2.row][corner2.col] === 0 &&
    checkLineX(corner2.row, p1.col, p2.col) &&
    checkLineY(corner2.col, p1.row, p2.row)
  ) {
    return [p1, corner2, p2];
  }

  return null;
}

export function checkTwoTurns(p1, p2) {
  for (let col = p1.col + 1; col < state.cols + 2; col++) {
    if (state.board[p1.row][col] !== 0) break;
    const mid = { row: p1.row, col };
    const subPath = checkOneTurn(mid, p2);
    if (subPath) return [p1, ...subPath];
  }

  for (let col = p1.col - 1; col >= 0; col--) {
    if (state.board[p1.row][col] !== 0) break;
    const mid = { row: p1.row, col };
    const subPath = checkOneTurn(mid, p2);
    if (subPath) return [p1, ...subPath];
  }

  for (let row = p1.row - 1; row >= 0; row--) {
    if (state.board[row][p1.col] !== 0) break;
    const mid = { row, col: p1.col };
    const subPath = checkOneTurn(mid, p2);
    if (subPath) return [p1, ...subPath];
  }

  for (let row = p1.row + 1; row < state.rows + 2; row++) {
    if (state.board[row][p1.col] !== 0) break;
    const mid = { row, col: p1.col };
    const subPath = checkOneTurn(mid, p2);
    if (subPath) return [p1, ...subPath];
  }

  return null;
}

export function canConnect(p1, p2) {
  return checkStraight(p1, p2) || checkOneTurn(p1, p2) || checkTwoTurns(p1, p2);
}

export function findValidMove() {
  for (let row1 = 1; row1 <= state.rows; row1++) {
    for (let col1 = 1; col1 <= state.cols; col1++) {
      if (state.board[row1][col1] === 0) continue;

      for (let row2 = 1; row2 <= state.rows; row2++) {
        for (let col2 = 1; col2 <= state.cols; col2++) {
          if (state.board[row2][col2] === 0) continue;
          if (row1 === row2 && col1 === col2) continue;
          if (state.board[row1][col1] !== state.board[row2][col2]) continue;

          const p1 = { row: row1, col: col1 };
          const p2 = { row: row2, col: col2 };

          if (canConnect(p1, p2)) return [p1, p2];
        }
      }
    }
  }

  return null;
}

export function hasValidMove() {
  return findValidMove() !== null;
}