import { cn } from "@/lib/utils";
import type { Piece } from "@/lib/game/types";

type PieceViewProps = {
  piece: Piece;
  cell: number;
  gap: number;
  className?: string;
  dimmed?: boolean;
};

export function PieceView({ piece, cell, gap, className, dimmed }: PieceViewProps) {
  const width = piece.w * cell + (piece.w - 1) * gap;
  const height = piece.h * cell + (piece.h - 1) * gap;
  const occupied = new Set(piece.cells.map((c) => `${c.r}:${c.c}`));

  return (
    <div
      className={cn("relative", dimmed && "opacity-35", className)}
      style={{
        width,
        height,
        display: "grid",
        gridTemplateColumns: `repeat(${piece.w}, ${cell}px)`,
        gridTemplateRows: `repeat(${piece.h}, ${cell}px)`,
        gap,
      }}
    >
      {Array.from({ length: piece.h * piece.w }, (_, i) => {
        const r = Math.floor(i / piece.w);
        const c = i % piece.w;
        const filled = occupied.has(`${r}:${c}`);
        return (
          <div key={i} className="relative">
            {filled ? <div className={cn("block", `block-${piece.color}`)} /> : null}
          </div>
        );
      })}
    </div>
  );
}
