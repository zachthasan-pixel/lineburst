import { COLOR_COUNT, type Piece } from "./types";

type Family = "small" | "line" | "square" | "ell" | "tee" | "skew" | "odd";

type Template = { weight: number; family: Family; m: number[][] };

const FAMILIES: Family[] = ["small", "line", "square", "ell", "tee", "skew", "odd"];

const T: Template[] = [
  { weight: 1, family: "small", m: [[1]] },
  { weight: 3, family: "small", m: [[1, 1]] },
  { weight: 3, family: "small", m: [[1], [1]] },
  { weight: 5, family: "line", m: [[1, 1, 1]] },
  { weight: 5, family: "line", m: [[1], [1], [1]] },
  { weight: 6, family: "line", m: [[1, 1, 1, 1]] },
  { weight: 6, family: "line", m: [[1], [1], [1], [1]] },
  { weight: 4, family: "line", m: [[1, 1, 1, 1, 1]] },
  { weight: 4, family: "line", m: [[1], [1], [1], [1], [1]] },
  { weight: 5, family: "square", m: [[1, 1], [1, 1]] },
  { weight: 3, family: "square", m: [[1, 1, 1], [1, 1, 1], [1, 1, 1]] },
  { weight: 4, family: "square", m: [[1, 1, 1], [1, 1, 1]] },
  { weight: 4, family: "square", m: [[1, 1], [1, 1], [1, 1]] },
  { weight: 5, family: "ell", m: [[1, 0], [1, 1]] },
  { weight: 5, family: "ell", m: [[0, 1], [1, 1]] },
  { weight: 5, family: "ell", m: [[1, 1], [1, 0]] },
  { weight: 5, family: "ell", m: [[1, 1], [0, 1]] },
  { weight: 6, family: "ell", m: [[1, 0], [1, 0], [1, 1]] },
  { weight: 6, family: "ell", m: [[0, 1], [0, 1], [1, 1]] },
  { weight: 6, family: "ell", m: [[1, 1], [1, 0], [1, 0]] },
  { weight: 6, family: "ell", m: [[1, 1], [0, 1], [0, 1]] },
  { weight: 5, family: "ell", m: [[1, 1, 1], [1, 0, 0]] },
  { weight: 5, family: "ell", m: [[1, 1, 1], [0, 0, 1]] },
  { weight: 5, family: "ell", m: [[1, 0, 0], [1, 1, 1]] },
  { weight: 5, family: "ell", m: [[0, 0, 1], [1, 1, 1]] },
  { weight: 4, family: "ell", m: [[1, 0, 0], [1, 0, 0], [1, 1, 1]] },
  { weight: 4, family: "ell", m: [[1, 1, 1], [1, 0, 0], [1, 0, 0]] },
  { weight: 4, family: "ell", m: [[1, 1, 1], [0, 0, 1], [0, 0, 1]] },
  { weight: 4, family: "ell", m: [[0, 0, 1], [0, 0, 1], [1, 1, 1]] },
  { weight: 6, family: "tee", m: [[1, 1, 1], [0, 1, 0]] },
  { weight: 6, family: "tee", m: [[0, 1, 0], [1, 1, 1]] },
  { weight: 6, family: "tee", m: [[1, 0], [1, 1], [1, 0]] },
  { weight: 6, family: "tee", m: [[0, 1], [1, 1], [0, 1]] },
  { weight: 5, family: "skew", m: [[0, 1, 1], [1, 1, 0]] },
  { weight: 5, family: "skew", m: [[1, 1, 0], [0, 1, 1]] },
  { weight: 5, family: "skew", m: [[1, 0], [1, 1], [0, 1]] },
  { weight: 5, family: "skew", m: [[0, 1], [1, 1], [1, 0]] },
  { weight: 3, family: "odd", m: [[0, 1, 0], [1, 1, 1], [0, 1, 0]] },
  { weight: 3, family: "odd", m: [[1, 0, 1], [1, 1, 1]] },
  { weight: 3, family: "odd", m: [[1, 1, 1], [1, 0, 1]] },
  { weight: 3, family: "odd", m: [[1, 1], [1, 0], [1, 1]] },
  { weight: 3, family: "odd", m: [[1, 1], [0, 1], [1, 1]] },
];

type Shape = {
  cells: { r: number; c: number }[];
  w: number;
  h: number;
  n: number;
  weight: number;
  family: Family;
};

function fromMatrix(m: number[][]) {
  const cells: { r: number; c: number }[] = [];
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r]!.length; c++) {
      if (m[r]![c]) cells.push({ r, c });
    }
  }
  return { cells, w: m[0]!.length, h: m.length };
}

const SHAPES: Shape[] = T.map((t) => {
  const s = fromMatrix(t.m);
  return { ...s, n: s.cells.length, weight: t.weight, family: t.family };
});

function pickColor(avoid: number[]): number {
  const opts: number[] = [];
  for (let i = 1; i <= COLOR_COUNT; i++) {
    if (!avoid.includes(i)) opts.push(i);
  }
  const pool = opts.length ? opts : [1, 2, 3, 4, 5, 6, 7];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

let seq = 1;
let bag: Family[] = [];

function shuffle<T>(items: T[]): T[] {
  const next = items.slice();
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i]!;
    next[i] = next[j]!;
    next[j] = tmp;
  }
  return next;
}

function takeFamily(): Family {
  if (bag.length === 0) bag = shuffle(FAMILIES);
  return bag.pop()!;
}

function pickShape(minN: number, maxN: number, family?: Family): Shape {
  const inRange = SHAPES.filter((s) => s.n >= minN && s.n <= maxN);
  const pool = family ? inRange.filter((s) => s.family === family) : inRange;
  const list = pool.length ? pool : inRange.length ? inRange : SHAPES;
  const total = list.reduce((s, x) => s + x.weight, 0);
  let roll = Math.random() * total;
  for (const s of list) {
    roll -= s.weight;
    if (roll <= 0) return s;
  }
  return list[0]!;
}

function pieceFromShape(shape: Shape, avoidColors: number[] = []): Piece {
  return {
    id: `p${seq++}`,
    color: pickColor(avoidColors),
    cells: shape.cells.map((c) => ({ ...c })),
    w: shape.w,
    h: shape.h,
  };
}

export function resetBag() {
  bag = shuffle(FAMILIES);
}

export function dealPiece(avoidColors: number[] = []): Piece {
  return dealPieceSized(1, 9, avoidColors);
}

export function dealPieceSized(minN: number, maxN: number, avoidColors: number[] = []): Piece {
  return pieceFromShape(pickShape(minN, Math.max(minN, maxN)), avoidColors);
}

export function makePiece(m: number[][], color: number): Piece {
  const shape = fromMatrix(m);
  return {
    id: `p${seq++}`,
    color,
    cells: shape.cells,
    w: shape.w,
    h: shape.h,
  };
}

export function dealOpeningTrio(): [Piece, Piece, Piece] {
  resetBag();
  return [
    makePiece(
      [
        [1, 1],
        [1, 1],
      ],
      4,
    ),
    makePiece([[1, 1, 1, 1]], 2),
    makePiece(
      [
        [1, 0],
        [1, 0],
        [1, 1],
      ],
      5,
    ),
  ];
}

export function dealTrio(): [Piece, Piece, Piece] {
  return dealSizedTrio(2, 7, 20);
}

export function dealSizedTrio(minSmall: number, maxPiece: number, maxCells: number): [Piece, Piece, Piece] {
  const minN = Math.max(2, minSmall);
  for (let i = 0; i < 28; i++) {
    const a = pieceFromShape(pickShape(minN, Math.min(5, maxPiece), takeFamily()));
    const b = pieceFromShape(pickShape(3, maxPiece, takeFamily()), [a.color]);
    const c = pieceFromShape(pickShape(minN, maxPiece, takeFamily()), [a.color, b.color]);
    const cells = a.cells.length + b.cells.length + c.cells.length;
    const bulky = [a, b, c].filter((p) => p.cells.length >= 6).length;
    if (cells <= maxCells && bulky <= 2) {
      const trio: [Piece, Piece, Piece] = [a, b, c];
      return shuffle(trio) as [Piece, Piece, Piece];
    }
  }
  return [
    dealPieceSized(2, 4),
    dealPieceSized(3, Math.min(6, maxPiece)),
    dealPieceSized(3, Math.min(5, maxPiece)),
  ];
}

export function cellPiece(avoidColors: number[] = []): Piece {
  return makePiece([[1]], pickColor(avoidColors));
}

export function clonePiece(piece: Piece): Piece {
  return { ...piece, cells: piece.cells.map((c) => ({ ...c })) };
}

export function resetPieceSeq(n = 1) {
  seq = n;
}
