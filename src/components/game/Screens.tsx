import { HelpCircle, Play, RotateCcw, Shuffle, Trophy, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DECOR: number[][] = [
  [0, 0, 3, 3, 0, 0, 5, 5],
  [0, 0, 3, 3, 0, 0, 5, 0],
  [1, 1, 1, 0, 4, 4, 4, 0],
  [0, 1, 0, 0, 0, 4, 0, 0],
  [2, 2, 0, 6, 0, 0, 7, 7],
  [2, 2, 0, 6, 6, 6, 7, 7],
  [0, 0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

function MiniBoard({ className }: { className?: string }) {
  return (
    <div className={cn("decor-board", className)} aria-hidden="true">
      {DECOR.flatMap((row, r) =>
        row.map((color, c) => (
          <div key={`${r}-${c}`} className="decor-cell">
            {color ? <div className={cn("block", `block-${color}`)} /> : null}
          </div>
        )),
      )}
    </div>
  );
}

export function StartScreen({
  best,
  hasSession,
  ready,
  onPlay,
  onContinue,
  onHelp,
}: {
  best: number;
  hasSession: boolean;
  ready: boolean;
  onPlay: () => void;
  onContinue: () => void;
  onHelp: () => void;
}) {
  return (
    <div className="overlay-screen">
      <div className="overlay-inner">
        <MiniBoard className="mb-8 opacity-90" />
        <p className="text-xs font-medium tracking-[0.22em] text-muted uppercase">Grid puzzle</p>
        <h1 className="mt-2 font-sans text-5xl font-semibold tracking-display text-fg sm:text-6xl">
          Lineburst
        </h1>
        <p className="mt-3 max-w-xs text-sm leading-snug text-muted">
          Fit the pieces. Burst full rows and columns. Keep the board breathing.
        </p>
        <div className="mt-4 flex items-center gap-2 text-muted">
          <Trophy className="size-4" strokeWidth={1.75} />
          <span className="text-sm">
            Best{" "}
            <span className="tabular-nums text-fg">{best.toLocaleString()}</span>
          </span>
        </div>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
          {ready && hasSession ? (
            <>
              <Button size="lg" onClick={onContinue} className="w-full">
                Continue
              </Button>
              <Button size="lg" variant="secondary" onClick={onPlay} className="w-full">
                New game
              </Button>
            </>
          ) : (
            <Button size="lg" onClick={onPlay} className="w-full">
              <Play className="size-4" strokeWidth={2} />
              Play
            </Button>
          )}
          <Button size="lg" variant="ghost" onClick={onHelp} className="w-full">
            <HelpCircle className="size-4" strokeWidth={1.75} />
            How to play
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PauseScreen({
  sound,
  onResume,
  onHelp,
  onToggleSound,
  onRestart,
  onShuffle,
  shuffling,
  confirming,
  onAskRestart,
}: {
  sound: boolean;
  onResume: () => void;
  onHelp: () => void;
  onToggleSound: () => void;
  onRestart: () => void;
  onShuffle: () => void;
  shuffling: boolean;
  confirming: boolean;
  onAskRestart: () => void;
}) {
  return (
    <div className="overlay-screen overlay-dim">
      <div className="modal-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Paused</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg">Take a breath</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onResume} aria-label="Close pause">
            <X className="size-5" strokeWidth={1.75} />
          </Button>
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={onResume} className="w-full">
            Resume
          </Button>
          <Button size="lg" variant="secondary" onClick={onShuffle} className="w-full" disabled={shuffling}>
            <Shuffle className="size-4" />
            New pieces
          </Button>
          <Button size="lg" variant="secondary" onClick={onToggleSound} className="w-full">
            {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            Sound {sound ? "on" : "off"}
          </Button>
          <Button size="lg" variant="secondary" onClick={onHelp} className="w-full">
            <HelpCircle className="size-4" />
            How to play
          </Button>
          {confirming ? (
            <Button size="lg" variant="danger" onClick={onRestart} className="w-full">
              Confirm restart
            </Button>
          ) : (
            <Button size="lg" variant="ghost" onClick={onAskRestart} className="w-full">
              <RotateCcw className="size-4" />
              New game
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function OverScreen({
  score,
  best,
  lines,
  maxCombo,
  newBest,
  onContinue,
  continuing,
  onAgain,
  onHome,
}: {
  score: number;
  best: number;
  lines: number;
  maxCombo: number;
  newBest: boolean;
  onContinue: () => void;
  continuing: boolean;
  onAgain: () => void;
  onHome: () => void;
}) {
  return (
    <div className="overlay-screen overlay-dim">
      <div className="modal-card">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">
          {newBest ? "New best" : "Board locked"}
        </p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg">Game over</h2>
        <p className="mt-6 font-sans text-5xl font-semibold tabular-nums tracking-tight text-fg">
          {score.toLocaleString()}
        </p>
        <p className="mt-1 text-sm text-muted">Final score</p>
        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-md bg-surface-2 px-2 py-3">
            <dt className="text-xs text-muted">Best</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-fg">{best.toLocaleString()}</dd>
          </div>
          <div className="rounded-md bg-surface-2 px-2 py-3">
            <dt className="text-xs text-muted">Lines</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-fg">{lines}</dd>
          </div>
          <div className="rounded-md bg-surface-2 px-2 py-3">
            <dt className="text-xs text-muted">Max combo</dt>
            <dd className="mt-1 text-sm font-medium tabular-nums text-fg">{maxCombo}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-2">
          <Button size="lg" onClick={onContinue} className="w-full" disabled={continuing}>
            Continue
          </Button>
          <p className="text-center text-xs text-subtle">
            Keep the board. Get pieces that fit.
          </p>
          <Button size="lg" variant="secondary" onClick={onAgain} className="w-full" disabled={continuing}>
            Play again
          </Button>
          <Button size="lg" variant="ghost" onClick={onHome} className="w-full" disabled={continuing}>
            Home
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdBreakScreen() {
  return (
    <div className="overlay-screen overlay-dim ad-break">
      <div className="modal-card text-center">
        <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Rewarded break</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg">Hang tight</h2>
        <p className="mt-3 text-sm text-muted">A short break, then you keep going.</p>
        <div className="mt-6 h-1 overflow-hidden rounded-full bg-surface-2">
          <div className="ad-bar h-full bg-accent" />
        </div>
      </div>
    </div>
  );
}

export function HelpScreen({ onClose }: { onClose: () => void }) {
  return (
    <div className="overlay-screen overlay-dim">
      <div className="modal-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.18em] text-muted uppercase">Rules</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-fg">How to play</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close help">
            <X className="size-5" strokeWidth={1.75} />
          </Button>
        </div>
        <ol className="mt-6 space-y-4 text-sm leading-normal text-muted">
          <li>
            <span className="font-medium text-fg">1. Place three pieces.</span> Drag any of the
            three shapes onto the 8×8 grid. They never rotate — the shape you see is the shape
            you place.
          </li>
          <li>
            <span className="font-medium text-fg">2. Burst lines.</span> Fill a full row or column
            to clear it. Clearing several at once, or on consecutive drops, builds a combo.
          </li>
          <li>
            <span className="font-medium text-fg">3. Stay alive.</span> After you place all three,
            a new set arrives. The run ends when none of the remaining pieces can fit.
          </li>
          <li>
            <span className="font-medium text-fg">4. Hold.</span> Tap a piece, then Hold (or press
            C) to park it. One swap until you place. A held piece can still save a dead tray.
          </li>
          <li>
            <span className="font-medium text-fg">5. Tight / B2B.</span> A boxed-in clear is a tight
            fit. Chain hard clears (tight, 2+ lines, or a perfect) for back-to-back pay.
          </li>
        </ol>
        <p className="mt-5 text-xs leading-normal text-subtle">
          Tap a piece then tap a cell to place from the top-left. Undo gives you three take-backs
          per run.
        </p>
        <Button size="lg" onClick={onClose} className="mt-6 w-full">
          Got it
        </Button>
      </div>
    </div>
  );
}
