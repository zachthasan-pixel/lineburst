import type { PointerEvent as PE } from "react";
import { cn } from "@/lib/utils";
import { GRID, type Board as BoardData, type CellOffset, type Piece } from "@/lib/game/types";

export type Ghost = {
  piece: Piece;
  row: number;
  col: number;
  valid: boolean;
  clearKeys: string[];
};

type BoardProps = {
  board: BoardData;
  ghost: Ghost | null;
  clearing: CellOffset[] | null;
  popping: CellOffset[] | null;
  onPointerMove?: (e: PE<HTMLDivElement>) => void;
  onPointerUp?: (e: PE<HTMLDivElement>) => void;
  onPointerLeave?: () => void;
  locked?: boolean;
};

function cellKey(r: number, c: number) {
  return `${r}:${c}`;
}

export function Board({
  board,
  ghost,
  clearing,
  popping,
  onPointerMove,
  onPointerUp,
  onPointerLeave,
  locked,
}: BoardProps) {
  const ghostMap = new Map<string, number>();
  if (ghost) {
    for (const cell of ghost.piece.cells) {
      ghostMap.set(cellKey(ghost.row + cell.r, ghost.col + cell.c), ghost.piece.color);
    }
  }
  const clearSet = new Set((clearing ?? []).map((c) => cellKey(c.r, c.c)));
  const popSet = new Set((popping ?? []).map((c) => cellKey(c.r, c.c)));
  const willClear = new Set(ghost?.valid ? ghost.clearKeys : []);

  return (
    <div
      className={cn("board", locked && "pointer-events-none")}
      data-board="true"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
    >
      {Array.from({ length: GRID * GRID }, (_, i) => {
        const r = Math.floor(i / GRID);
        const c = i % GRID;
        const filled = board[r]![c] ?? 0;
        const gColor = ghostMap.get(cellKey(r, c));
        const isGhost = gColor !== undefined;
        const isClear = clearSet.has(cellKey(r, c));
        const isPop = popSet.has(cellKey(r, c));
        const isWillClear = willClear.has(cellKey(r, c));
        const color = filled || (isGhost ? gColor : 0);
        return (
          <div
            key={i}
            className={cn(
              "cell",
              isGhost && "is-ghost",
              isGhost && ghost && !ghost.valid && "is-invalid",
              isWillClear && "is-will-clear",
            )}
            data-row={r}
            data-col={c}
          >
            {color ? (
              <div
                className={cn(
                  "block",
                  `block-${color}`,
                  isGhost && !filled && "is-preview",
                  isGhost && ghost && !ghost.valid && "is-preview-bad",
                  isWillClear && "is-will-clear",
                  isClear && "is-clearing",
                  isPop && "is-pop",
                )}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
