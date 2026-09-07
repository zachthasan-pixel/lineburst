import { GRID, TRAY_SIZE, UNDOS_PER_RUN, type Board, type CellOffset, type Piece, type PlaceResult, type PlayState } from "./types";
import { cellPiece, clonePiece, dealOpeningTrio, dealSizedTrio, resetBag } from "./pieces";

export function emptyBoard(): Board {
  return Array.from({ length: GRID }, () => Array<number>(GRID).fill(0));
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

export function emptyCount(board: Board): number {
  let n = 0;
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (board[r]![c] === 0) n += 1;
    }
  }
  return n;
}

export function canPlace(board: Board, piece: Piece, row: number, col: number): boolean {
  for (const cell of piece.cells) {
    const r = row + cell.r;
    const c = col + cell.c;
    if (r < 0 || c < 0 || r >= GRID || c >= GRID) return false;
    if (board[r]![c] !== 0) return false;
  }
  return true;
}

export function placeOnBoard(board: Board, piece: Piece, row: number, col: number): Board {
  const next = cloneBoard(board);
  for (const cell of piece.cells) {
    next[row + cell.r]![col + cell.c] = piece.color;
  }
  return next;
}

export function findClears(board: Board): { rows: number[]; cols: number[]; cells: CellOffset[] } {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < GRID; r++) {
    if (board[r]!.every((v) => v !== 0)) rows.push(r);
  }
  for (let c = 0; c < GRID; c++) {
    let full = true;
    for (let r = 0; r < GRID; r++) {
      if (board[r]![c] === 0) {
        full = false;
        break;
      }
    }
    if (full) cols.push(c);
  }
  const seen = new Set<string>();
  const cells: CellOffset[] = [];
  const add = (r: number, c: number) => {
    const k = `${r}:${c}`;
    if (seen.has(k)) return;
    seen.add(k);
    cells.push({ r, c });
  };
  for (const r of rows) for (let c = 0; c < GRID; c++) add(r, c);
  for (const c of cols) for (let r = 0; r < GRID; r++) add(r, c);
  return { rows, cols, cells };
}

export function previewPlacement(board: Board, piece: Piece, row: number, col: number) {
  const valid = canPlace(board, piece, row, col);
  if (!valid) return { valid: false, clearKeys: [] as string[], lines: 0 };
  const placed = placeOnBoard(board, piece, row, col);
  const found = findClears(placed);
  return {
    valid: true,
    clearKeys: found.cells.map((c) => `${c.r}:${c.c}`),
    lines: found.rows.length + found.cols.length,
  };
}

export function applyClears(board: Board, rows: number[], cols: number[]): Board {
  const next = cloneBoard(board);
  for (const r of rows) for (let c = 0; c < GRID; c++) next[r]![c] = 0;
  for (const c of cols) for (let r = 0; r < GRID; r++) next[r]![c] = 0;
  return next;
}

export function isBoardEmpty(board: Board): boolean {
  return emptyCount(board) === GRID * GRID;
}

export function hasAnyPlacement(board: Board, piece: Piece): boolean {
  const maxR = GRID - piece.h;
  const maxC = GRID - piece.w;
  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      if (canPlace(board, piece, r, c)) return true;
    }
  }
  return false;
}

export function canPlaceAny(board: Board, pieces: (Piece | null)[]): boolean {
  for (const piece of pieces) {
    if (piece && hasAnyPlacement(board, piece)) return true;
  }
  return false;
}

export function scoreMove(
  cells: number,
  lines: number,
  combo: number,
  perfect: boolean,
  tight = false,
  b2bHit = false,
): number {
  let s = cells * 10;
  if (lines > 0) {
    const comboMult = combo <= 1 ? 1 : combo * combo;
    let pay = 110 * lines * comboMult;
    if (lines >= 2) pay += 140 * lines * (lines - 1) * combo;
    if (tight) pay += 280 * combo;
    if (perfect) pay += 1600 * Math.max(combo, 1);
    if (b2bHit) pay = Math.round(pay * 1.5);
    s += pay;
  }
  return s;
}

export function openNeighbors(board: Board, piece: Piece, row: number, col: number): number {
  const occupied = new Set(piece.cells.map((c) => `${row + c.r}:${col + c.c}`));
  const seen = new Set<string>();
  let open = 0;
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
  ];
  for (const cell of piece.cells) {
    for (const [dr, dc] of dirs) {
      const r = row + cell.r + dr;
      const c = col + cell.c + dc;
      const k = `${r}:${c}`;
      if (occupied.has(k) || seen.has(k)) continue;
      seen.add(k);
      if (r < 0 || c < 0 || r >= GRID || c >= GRID) continue;
      if (board[r]![c] === 0) open += 1;
    }
  }
  return open;
}

export function placementCount(board: Board, piece: Piece): number {
  let n = 0;
  const maxR = GRID - piece.h;
  const maxC = GRID - piece.w;
  for (let r = 0; r <= maxR; r++) {
    for (let c = 0; c <= maxC; c++) {
      if (canPlace(board, piece, r, c)) n += 1;
    }
  }
  return n;
}

export function freshPlay(): PlayState {
  resetBag();
  const pieces = dealOpeningTrio();
  return {
    board: emptyBoard(),
    pieces: [pieces[0], pieces[1], pieces[2]],
    hold: null,
    holdLocked: false,
    b2b: false,
    score: 0,
    combo: 0,
    maxCombo: 0,
    lines: 0,
    undosLeft: UNDOS_PER_RUN,
    piecesPlaced: 0,
  };
}

export function dealForBoard(board: Board, piecesPlaced: number, forceFit = false): [Piece, Piece, Piece] {
  const empty = emptyCount(board);
  const fill = 1 - empty / (GRID * GRID);
  const maxPiece = fill < 0.22 ? 9 : fill < 0.42 ? 7 : fill < 0.62 ? 6 : 5;
  const minSmall = fill > 0.7 ? 1 : 2;
  const maxCells = Math.min(fill < 0.3 ? 22 : fill < 0.5 ? 18 : 15, empty + 6);
  const mercy = forceFit || piecesPlaced < 6;

  for (let i = 0; i < 40; i++) {
    const next = dealSizedTrio(minSmall, maxPiece, maxCells);
    if (canPlaceAny(board, next)) return next;
    if (!mercy && i > 6) return next;
  }
  if (forceFit) {
    const a = cellPiece();
    const b = cellPiece([a.color]);
    const c = cellPiece([a.color, b.color]);
    return [a, b, c];
  }
  const fallback = dealSizedTrio(minSmall, maxPiece, maxCells);
  return fallback;
}

export function dealFittingTrio(board: Board): [Piece, Piece, Piece] {
  return dealForBoard(board, 99, true);
}

export function swapHold(state: PlayState, index: number): PlayState | null {
  if (state.holdLocked) return null;
  if (index < 0 || index >= TRAY_SIZE) return null;
  const piece = state.pieces[index];
  if (!piece && !state.hold) return null;
  let pieces: (Piece | null)[] = state.pieces.map((p, i) =>
    i === index ? (state.hold ? clonePiece(state.hold) : null) : p,
  );
  if (pieces.every((p) => p === null)) {
    const next = dealForBoard(state.board, state.piecesPlaced);
    pieces = [next[0], next[1], next[2]];
  }
  return {
    ...state,
    pieces,
    hold: piece ? clonePiece(piece) : null,
    holdLocked: true,
  };
}

function hasLife(board: Board, pieces: (Piece | null)[], hold: Piece | null, holdLocked: boolean): boolean {
  if (canPlaceAny(board, pieces)) return true;
  if (!holdLocked && hold && hasAnyPlacement(board, hold)) return true;
  return false;
}

export function tryPlace(state: PlayState, index: number, row: number, col: number): PlaceResult | null {
  if (index < 0 || index >= TRAY_SIZE) return null;
  const piece = state.pieces[index];
  if (!piece) return null;
  if (!canPlace(state.board, piece, row, col)) return null;

  const boardAfterPlace = placeOnBoard(state.board, piece, row, col);
  const { rows, cols, cells: clearCells } = findClears(boardAfterPlace);
  const lines = rows.length + cols.length;
  const boardAfterClear = lines ? applyClears(boardAfterPlace, rows, cols) : boardAfterPlace;
  const perfect = lines > 0 && isBoardEmpty(boardAfterClear);
  const comboAfter = lines > 0 ? state.combo + 1 : 0;
  const comboForScore = Math.max(comboAfter, 1);
  const tight =
    lines > 0 && (openNeighbors(boardAfterPlace, piece, row, col) <= 2 || placementCount(state.board, piece) <= 2);
  const hard = tight || lines >= 2 || perfect;
  const b2bHit = hard && state.b2b;
  const b2bAfter = lines === 0 ? state.b2b : hard;
  const scoreGain = scoreMove(piece.cells.length, lines, comboForScore, perfect, tight, b2bHit);

  let piecesAfter: (Piece | null)[] = state.pieces.map((p, i) => (i === index ? null : p));
  let dealt = false;
  if (piecesAfter.every((p) => p === null)) {
    const next = dealForBoard(boardAfterClear, state.piecesPlaced + 1);
    piecesAfter = [next[0], next[1], next[2]];
    dealt = true;
  }

  const over = !hasLife(boardAfterClear, piecesAfter, state.hold, false);

  return {
    boardAfterPlace,
    boardAfterClear,
    clearCells,
    lines,
    perfect,
    tight,
    hard,
    b2bHit,
    b2bAfter,
    piecesAfter,
    dealt,
    scoreGain,
    comboAfter,
    maxCombo: Math.max(state.maxCombo, comboAfter),
    over,
    cellsPlaced: piece.cells.length,
  };
}

export function snapshot(state: PlayState): PlayState {
  return {
    board: cloneBoard(state.board),
    pieces: state.pieces.map((p) => (p ? clonePiece(p) : null)),
    hold: state.hold ? clonePiece(state.hold) : null,
    holdLocked: state.holdLocked,
    b2b: state.b2b,
    score: state.score,
    combo: state.combo,
    maxCombo: state.maxCombo,
    lines: state.lines,
    undosLeft: state.undosLeft,
    piecesPlaced: state.piecesPlaced,
  };
}
