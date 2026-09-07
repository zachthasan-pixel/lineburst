import { Pause, Trophy, Undo2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Hud({
  score,
  best,
  combo,
  b2b,
  undosLeft,
  canUndo,
  onPause,
  onUndo,
}: {
  score: number;
  best: number;
  combo: number;
  b2b: boolean;
  undosLeft: number;
  canUndo: boolean;
  onPause: () => void;
  onUndo: () => void;
}) {
  const prev = useRef(score);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    if (score === prev.current) return;
    prev.current = score;
    setTick(true);
    const t = window.setTimeout(() => setTick(false), 240);
    return () => window.clearTimeout(t);
  }, [score]);

  return (
    <header className="hud">
      <div className="flex items-center gap-2 min-w-0">
        <Button variant="ghost" size="icon" onClick={onPause} aria-label="Pause" className="shrink-0">
          <Pause className="size-5" strokeWidth={1.75} />
        </Button>
        <div className="hidden sm:flex items-center gap-1.5 text-muted min-w-0">
          <Trophy className="size-3.5 shrink-0" strokeWidth={1.75} />
          <span className="text-xs tabular-nums truncate">{best.toLocaleString()}</span>
        </div>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-[0.65rem] font-medium tracking-[0.18em] text-muted uppercase">
          Score
        </span>
        <span
          className={cn(
            "text-2xl font-semibold tabular-nums tracking-tight text-fg leading-none",
            tick && "score-tick",
          )}
        >
          {score.toLocaleString()}
        </span>
        <span
          className={cn(
            "mt-1 h-5 text-[0.7rem] font-medium tracking-wide tabular-nums transition-opacity duration-[var(--motion-quick)]",
            combo >= 1 || b2b ? "opacity-100" : "opacity-0",
            combo >= 3 && "combo-hot",
            b2b ? "text-accent" : "text-accent",
          )}
        >
          {b2b ? "B2B" : ""}
          {b2b && combo >= 1 ? " · " : ""}
          {combo >= 1 ? `Combo x${combo}` : b2b ? "" : `Combo x${Math.max(combo, 1)}`}
        </span>
      </div>
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label={
            undosLeft > 0 ? `Undo, ${undosLeft} remaining` : "Watch to refill undo"
          }
          className="relative"
        >
          <Undo2 className="size-5" strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 text-[0.6rem] tabular-nums text-muted">
            {undosLeft}
          </span>
        </Button>
      </div>
    </header>
  );
}
