export const GRID = 8;
export const TRAY_SIZE = 3;
export const COLOR_COUNT = 7;
export const UNDOS_PER_RUN = 3;
export const CLEAR_MS = 220;

export type CellOffset = { r: number; c: number };

export type Piece = {
  id: string;
  color: number;
  cells: CellOffset[];
  w: number;
  h: number;
};

export type Board = number[][];

export type PlayState = {
  board: Board;
  pieces: (Piece | null)[];
  hold: Piece | null;
  holdLocked: boolean;
  b2b: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  lines: number;
  undosLeft: number;
  piecesPlaced: number;
};

export type PlaceResult = {
  boardAfterPlace: Board;
  boardAfterClear: Board;
  clearCells: CellOffset[];
  lines: number;
  perfect: boolean;
  tight: boolean;
  hard: boolean;
  b2bHit: boolean;
  b2bAfter: boolean;
  piecesAfter: (Piece | null)[];
  dealt: boolean;
  scoreGain: number;
  comboAfter: number;
  maxCombo: number;
  over: boolean;
  cellsPlaced: number;
};

export type Session = PlayState;

export type PersistV1 = {
  version: 1;
  best: number;
  sound: boolean;
  seenHelp: boolean;
  session: Session | null;
};
