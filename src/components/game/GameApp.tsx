import { useCallback, useEffect, useRef, useState, type PointerEvent as PE } from "react";
import { Board, type Ghost } from "@/components/game/Board";
import { FxCanvas, type BoardGeom, type FxHandle } from "@/components/game/FxCanvas";
import { Hud } from "@/components/game/Hud";
import { PieceView } from "@/components/game/PieceView";
import { HelpScreen, OverScreen, PauseScreen, StartScreen, AdBreakScreen } from "@/components/game/Screens";
import {
  playClear,
  playCombo,
  playDeal,
  playInvalid,
  playOver,
  playPerfect,
  playPlace,
  playSelect,
  playUndo,
  playHold,
  playB2B,
  resumeAudioIfNeeded,
  setSoundEnabled,
  unlockAudio,
} from "@/lib/game/audio";
import { canPlace, dealFittingTrio, freshPlay, hasAnyPlacement, previewPlacement, snapshot, swapHold, tryPlace } from "@/lib/game/logic";
import {
  commercialBreak,
  gameplayStart,
  gameplayStop,
  happyTime,
  initPortal,
  rewardedBreak,
} from "@/lib/game/portal";
import { loadPersist, persistPatch } from "@/lib/game/save";
import { CLEAR_MS, GRID, UNDOS_PER_RUN, type CellOffset, type PlayState } from "@/lib/game/types";
import { cn } from "@/lib/utils";

type Screen = "start" | "play" | "paused" | "over";

type DragState = {
  index: number;
  pointerId: number;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  moved: boolean;
};

function readGeom(el: HTMLElement): BoardGeom {
  const styles = getComputedStyle(el);
  const pad = parseFloat(styles.paddingLeft) || 10;
  const gap = parseFloat(styles.gap) || 5;
  const inner = el.getBoundingClientRect().width - pad * 2;
  const cell = (inner - gap * (GRID - 1)) / GRID;
  return { pad, gap, cell };
}

function clientToTopLeft(x: number, y: number, el: HTMLElement, geom: BoardGeom) {
  const rect = el.getBoundingClientRect();
  const col = Math.round((x - rect.left - geom.pad) / (geom.cell + geom.gap));
  const row = Math.round((y - rect.top - geom.pad) / (geom.cell + geom.gap));
  return { row, col };
}

function clientToCell(x: number, y: number, el: HTMLElement, geom: BoardGeom) {
  const rect = el.getBoundingClientRect();
  const col = Math.floor((x - rect.left - geom.pad) / (geom.cell + geom.gap));
  const row = Math.floor((y - rect.top - geom.pad) / (geom.cell + geom.gap));
  return { row, col };
}

function blockCssColor(id: number) {
  if (typeof document === "undefined") return "#888";
  const v = getComputedStyle(document.documentElement).getPropertyValue(`--color-block-${id}`).trim();
  return v || "#888";
}

function vibrate(pattern: number | number[]) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* ignore */
  }
}

function makeGhost(board: PlayState["board"], piece: NonNullable<PlayState["pieces"][number]>, row: number, col: number): Ghost {
  const preview = previewPlacement(board, piece, row, col);
  return {
    piece,
    row,
    col,
    valid: preview.valid,
    clearKeys: preview.clearKeys,
  };
}

function centroid(cells: CellOffset[], geom: BoardGeom) {
  let x = 0;
  let y = 0;
  for (const cell of cells) {
    x += geom.pad + cell.c * (geom.cell + geom.gap) + geom.cell / 2;
    y += geom.pad + cell.r * (geom.cell + geom.gap) + geom.cell / 2;
  }
  const n = Math.max(cells.length, 1);
  return { x: x / n, y: y / n };
}

export function GameApp() {
  const [screen, setScreen] = useState<Screen>("start");
  const [help, setHelp] = useState(false);
  const [pendingStart, setPendingStart] = useState(false);
  const [ready, setReady] = useState(false);
  const [best, setBest] = useState(0);
  const [sound, setSound] = useState(true);
  const [seenHelp, setSeenHelp] = useState(false);
  const [savedSession, setSavedSession] = useState<PlayState | null>(null);
  const [play, setPlay] = useState<PlayState>(() => freshPlay());
  const [clearing, setClearing] = useState<CellOffset[] | null>(null);
  const [popping, setPopping] = useState<CellOffset[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [ghost, setGhost] = useState<Ghost | null>(null);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [newBest, setNewBest] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const [invalidIndex, setInvalidIndex] = useState<number | null>(null);
  const [adBreak, setAdBreak] = useState(false);
  const [adBusy, setAdBusy] = useState(false);
  const [dealPulse, setDealPulse] = useState(0);

  const boardRef = useRef<HTMLDivElement>(null);
  const boardElRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<FxHandle>(null);
  const historyRef = useRef<PlayState[]>([]);
  const playRef = useRef(play);
  const clearTimer = useRef<number | null>(null);
  const popTimer = useRef<number | null>(null);
  const bannerTimer = useRef<number | null>(null);
  const shakeTimer = useRef<number | null>(null);
  const invalidTimer = useRef<number | null>(null);
  const [geom, setGeom] = useState<BoardGeom>({ pad: 10, gap: 5, cell: 36 });
  const reducedRef = useRef(false);

  playRef.current = play;

  const persistSession = useCallback((state: PlayState | null, nextBest?: number) => {
    persistPatch({
      session: state,
      best: nextBest ?? loadPersist().best,
    });
    setSavedSession(state);
  }, []);

  useEffect(() => {
    const p = loadPersist();
    setBest(p.best);
    setSound(p.sound);
    setSeenHelp(p.seenHelp);
    setSavedSession(p.session);
    setSoundEnabled(p.sound);
    setReady(true);
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    initPortal();
  }, []);

  useEffect(() => {
    const onVis = () => resumeAudioIfNeeded();
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  useEffect(() => {
    const stage = boardRef.current;
    if (!stage) return;
    const measure = () => {
      const el = stage.querySelector<HTMLDivElement>("[data-board='true']");
      if (!el) return;
      boardElRef.current = el;
      setGeom(readGeom(el));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [screen]);

  useEffect(() => {
    return () => {
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      if (popTimer.current) window.clearTimeout(popTimer.current);
      if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
      if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
      if (invalidTimer.current) window.clearTimeout(invalidTimer.current);
    };
  }, []);

  const undo = useCallback(() => {
    if (screen !== "play" || clearing) return;
    const prev = historyRef.current.pop();
    if (!prev || playRef.current.undosLeft <= 0) return;
    const restored = { ...prev, undosLeft: playRef.current.undosLeft - 1 };
    setPlay(restored);
    setSelected(null);
    setGhost(null);
    setClearing(null);
    persistSession(restored);
    playUndo();
  }, [screen, clearing, persistSession]);

  const doHold = useCallback(() => {
    if (screen !== "play" || clearing || selected === null) return;
    const next = swapHold(playRef.current, selected);
    if (!next) {
      playInvalid();
      return;
    }
    setPlay(next);
    persistSession(next);
    setSelected(null);
    setGhost(null);
    playHold();
  }, [screen, clearing, selected, persistSession]);

  const runRewarded = async () => {
    if (adBusy) return false;
    setAdBusy(true);
    setAdBreak(true);
    setSoundEnabled(false);
    const ok = await rewardedBreak();
    setAdBreak(false);
    setSoundEnabled(sound);
    setAdBusy(false);
    return ok;
  };

  const continueRun = async () => {
    const ok = await runRewarded();
    if (!ok) return;
    const current = playRef.current;
    const pieces = dealFittingTrio(current.board);
    const next = { ...current, pieces, undosLeft: Math.min(UNDOS_PER_RUN, current.undosLeft + 1) };
    setPlay(next);
    persistSession(next, applyBest(next.score));
    setDealPulse((n) => n + 1);
    setScreen("play");
    playDeal();
    gameplayStart();
  };

  const shufflePieces = async () => {
    const ok = await runRewarded();
    if (!ok) return;
    const current = playRef.current;
    const pieces = dealFittingTrio(current.board);
    const next = { ...current, pieces };
    setPlay(next);
    persistSession(next);
    setConfirmRestart(false);
    setDealPulse((n) => n + 1);
    setScreen("play");
    playDeal();
    gameplayStart();
  };

  const playAgain = async () => {
    setAdBusy(true);
    await commercialBreak();
    setAdBusy(false);
    beginRun(null);
  };

  const resumePlay = async () => {
    setConfirmRestart(false);
    setAdBusy(true);
    await commercialBreak();
    setAdBusy(false);
    setScreen("play");
    gameplayStart();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (help) {
        if (e.code === "Escape") setHelp(false);
        return;
      }
      if (screen === "paused" && e.code === "Escape") {
        setScreen("play");
        setConfirmRestart(false);
        return;
      }
      if (screen !== "play" || clearing) return;
      if (e.code === "Escape") {
        setScreen("paused");
        return;
      }
      if (e.code === "KeyZ" || e.code === "KeyU") {
        e.preventDefault();
        undo();
        return;
      }
      const num = e.code === "Digit1" ? 0 : e.code === "Digit2" ? 1 : e.code === "Digit3" ? 2 : -1;
      if (num >= 0 && playRef.current.pieces[num]) {
        setSelected(num);
        playSelect();
      }
      if (e.code === "KeyC" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        e.preventDefault();
        doHold();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [screen, help, clearing, undo, doHold, selected]);

  const showBanner = (text: string) => {
    setBanner(text);
    if (bannerTimer.current) window.clearTimeout(bannerTimer.current);
    bannerTimer.current = window.setTimeout(() => setBanner(null), 700);
  };

  const pulseShake = (ms = 220) => {
    if (reducedRef.current) return;
    setShaking(true);
    if (shakeTimer.current) window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShaking(false), ms);
  };

  const applyBest = (score: number) => {
    if (score > best) {
      setBest(score);
      setNewBest(true);
      return score;
    }
    return best;
  };

  const beginRun = (from: PlayState | null) => {
    unlockAudio();
    if (clearTimer.current) window.clearTimeout(clearTimer.current);
    const next = from ? snapshot(from) : freshPlay();
    setPlay(next);
    historyRef.current = [];
    setClearing(null);
    setPopping(null);
    setSelected(null);
    setDrag(null);
    setGhost(null);
    setNewBest(false);
    setConfirmRestart(false);
    setBanner(null);
    setPendingStart(false);
    setHelp(false);
    setScreen("play");
    persistSession(next);
    playDeal();
    setDealPulse((n) => n + 1);
    gameplayStart();
  };

  const finishOver = (state: PlayState) => {
    const b = applyBest(state.score);
    persistPatch({ session: null, best: b });
    setSavedSession(null);
    playOver();
    gameplayStop();
    window.setTimeout(() => setScreen("over"), 420);
  };

  const commitResult = (
    pre: PlayState,
    result: NonNullable<ReturnType<typeof tryPlace>>,
    board: PlayState["board"],
  ) => {
    historyRef.current = [...historyRef.current.slice(-12), snapshot(pre)];
    const next: PlayState = {
      board,
      pieces: result.piecesAfter,
      hold: pre.hold,
      holdLocked: false,
      b2b: result.b2bAfter,
      score: pre.score + result.scoreGain,
      combo: result.comboAfter,
      maxCombo: result.maxCombo,
      lines: pre.lines + result.lines,
      undosLeft: pre.undosLeft,
      piecesPlaced: pre.piecesPlaced + 1,
    };
    setPlay(next);
    setSelected(null);
    setGhost(null);
    setDrag(null);
    const b = applyBest(next.score);
    persistSession(next, b);
    if (result.dealt) {
      playDeal();
      setDealPulse((n) => n + 1);
    }
    if (result.over) finishOver(next);
  };

  const placeAt = (index: number, row: number, col: number) => {
    if (clearing) return;
    const pre = playRef.current;
    const result = tryPlace(pre, index, row, col);
    if (!result) {
      playInvalid();
      setInvalidIndex(index);
      if (invalidTimer.current) window.clearTimeout(invalidTimer.current);
      invalidTimer.current = window.setTimeout(() => setInvalidIndex(null), 280);
      return;
    }

    playPlace();
    vibrate(8);
    const placed: CellOffset[] = pre.pieces[index]!.cells.map((c) => ({
      r: row + c.r,
      c: col + c.c,
    }));
    setPopping(placed);
    if (popTimer.current) window.clearTimeout(popTimer.current);
    popTimer.current = window.setTimeout(() => setPopping(null), 200);

    const boardEl = boardElRef.current;
    const g = boardEl ? readGeom(boardEl) : geom;
    if (result.scoreGain) {
      const pos =
        result.clearCells.length > 0
          ? centroid(result.clearCells, g)
          : { x: (boardEl?.clientWidth ?? 180) / 2, y: 28 };
      fxRef.current?.floatText(pos.x, pos.y, `+${result.scoreGain}`, {
        size: result.comboAfter >= 3 ? 26 : 20,
      });
      if (result.comboAfter >= 2) {
        fxRef.current?.floatText(pos.x, pos.y + 22, `x${result.comboAfter}`, {
          size: 16 + Math.min(result.comboAfter, 6) * 2,
          color: getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "#5eead4",
        });
      }
    }

    if (result.lines > 0) {
      setPlay({
        ...pre,
        board: result.boardAfterPlace,
        pieces: pre.pieces.map((p, i) => (i === index ? null : p)),
        holdLocked: false,
        b2b: result.b2bAfter,
        score: pre.score + result.scoreGain,
        combo: result.comboAfter,
        maxCombo: result.maxCombo,
        lines: pre.lines + result.lines,
        piecesPlaced: pre.piecesPlaced + 1,
      });
      setClearing(result.clearCells);
      setSelected(null);
      setDrag(null);
      setGhost(null);
      playClear(result.lines);
      if (result.comboAfter >= 2) playCombo(result.comboAfter);
      if (result.b2bHit) playB2B();
      if (result.perfect) {
        playPerfect();
        showBanner("Perfect clear");
      } else if (result.b2bHit && result.tight) {
        showBanner("B2B tight");
      } else if (result.b2bHit) {
        showBanner("Back to back");
      } else if (result.tight) {
        showBanner("Tight fit");
      } else if (result.comboAfter >= 3) {
        showBanner(`Combo x${result.comboAfter}`);
      } else if (result.lines >= 2) {
        showBanner(`${result.lines} lines`);
      } else if (result.comboAfter >= 2) {
        showBanner(`Combo x${result.comboAfter}`);
      }
      pulseShake(result.comboAfter >= 4 || result.lines >= 3 ? 320 : 220);
      vibrate(result.comboAfter >= 3 || result.lines >= 2 ? [10, 30, 16, 20, 12] : 12);
      const colors = result.clearCells.map((cell) =>
        blockCssColor(result.boardAfterPlace[cell.r]![cell.c] || 1),
      );
      const intensity =
        (result.perfect ? 1.8 : 1) *
        (1 + Math.max(0, result.comboAfter - 1) * 0.22) *
        (result.lines >= 2 ? 1.25 : 1);
      fxRef.current?.burst(result.clearCells, g, colors, intensity);
      if (result.comboAfter >= 3 || result.perfect || result.lines >= 2) happyTime();
      const wait = reducedRef.current ? 60 : CLEAR_MS;
      if (clearTimer.current) window.clearTimeout(clearTimer.current);
      clearTimer.current = window.setTimeout(() => {
        setClearing(null);
        commitResult(pre, result, result.boardAfterClear);
      }, wait);
    } else {
      commitResult(pre, result, result.boardAfterClear);
    }
  };

  const onTrayPointerDown = (index: number, e: PE<HTMLButtonElement>) => {
    if (screen !== "play" || clearing) return;
    const piece = play.pieces[index];
    if (!piece) return;
    if (!hasAnyPlacement(play.board, piece)) {
      playInvalid();
      setInvalidIndex(index);
      if (invalidTimer.current) window.clearTimeout(invalidTimer.current);
      invalidTimer.current = window.setTimeout(() => setInvalidIndex(null), 280);
      return;
    }
    unlockAudio();
    e.currentTarget.setPointerCapture(e.pointerId);
    const isTouch = e.pointerType === "touch";
    const floatW = piece.w * geom.cell + (piece.w - 1) * geom.gap;
    const floatH = piece.h * geom.cell + (piece.h - 1) * geom.gap;
    setSelected(index);
    playSelect();
    setDrag({
      index,
      pointerId: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      offsetX: -floatW / 2,
      offsetY: isTouch ? -floatH - 40 : -floatH / 2,
      moved: false,
    });
  };

  const onPointerMove = (e: PE<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) {
      if (selected !== null && screen === "play" && !drag && !clearing) {
        const el = boardElRef.current;
        const piece = play.pieces[selected];
        if (!el || !piece) return;
        const rect = el.getBoundingClientRect();
        if (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        ) {
          setGhost(null);
          return;
        }
        const g = readGeom(el);
        const { row, col } = clientToCell(e.clientX, e.clientY, el, g);
        if (row < 0 || col < 0 || row >= GRID || col >= GRID) {
          setGhost(null);
          return;
        }
        setGhost(makeGhost(play.board, piece, row, col));
      }
      return;
    }
    const dx = e.clientX - drag.x;
    const dy = e.clientY - drag.y;
    const moved = drag.moved || dx * dx + dy * dy > 64;
    const next = { ...drag, x: e.clientX, y: e.clientY, moved };
    setDrag(next);
    const piece = play.pieces[drag.index];
    const el = boardElRef.current;
    if (!piece || !el) return;
    const g = readGeom(el);
    const px = next.x + next.offsetX;
    const py = next.y + next.offsetY;
    const { row, col } = clientToTopLeft(px, py, el, g);
    const overBoard = row > -piece.h && col > -piece.w && row < GRID && col < GRID;
    if (!overBoard) {
      setGhost(null);
      return;
    }
    setGhost(makeGhost(play.board, piece, row, col));
  };

  const endDrag = (e: PE<HTMLDivElement>) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const ontoHold = e.target instanceof Element && Boolean(e.target.closest(".hold-slot"));
    const moved = drag.moved;
    const g = ghost;
    setDrag(null);
    if (ontoHold) {
      setGhost(null);
      return;
    }
    if (!moved) {
      setSelected(drag.index);
      return;
    }
    if (g && g.valid) {
      placeAt(drag.index, g.row, g.col);
      return;
    }
    playInvalid();
    setGhost(null);
  };

  const onBoardPointerUp = (e: PE<HTMLDivElement>) => {
    if (drag) return;
    if (selected === null || clearing || screen !== "play") return;
    const piece = play.pieces[selected];
    const el = boardElRef.current;
    if (!piece || !el) return;
    const g = readGeom(el);
    const { row, col } = clientToCell(e.clientX, e.clientY, el, g);
    if (canPlace(play.board, piece, row, col)) {
      placeAt(selected, row, col);
    } else {
      playInvalid();
    }
  };

  const toggleSound = () => {
    const next = !sound;
    setSound(next);
    setSoundEnabled(next);
    persistPatch({ sound: next });
    if (next) {
      unlockAudio();
      playSelect();
    }
  };

  const onPlayClick = () => {
    unlockAudio();
    if (!seenHelp) {
      setPendingStart(true);
      setHelp(true);
      setSeenHelp(true);
      persistPatch({ seenHelp: true });
      return;
    }
    beginRun(null);
  };

  const closeHelp = () => {
    setHelp(false);
    if (pendingStart) beginRun(null);
  };

  const trayCell = Math.min(geom.cell * 0.55, 26);
  const trayGap = Math.max(3, geom.gap * 0.7);
  const draggingPiece = drag ? play.pieces[drag.index] : null;
  const locked = Boolean(clearing) || screen !== "play";

  return (
    <div
      className={cn("game-shell", screen !== "start" && "is-playing")}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerDown={() => unlockAudio()}
    >
      {screen === "start" ? (
        <StartScreen
          best={best}
          hasSession={Boolean(savedSession)}
          ready={ready}
          onPlay={onPlayClick}
          onContinue={() => beginRun(savedSession)}
          onHelp={() => setHelp(true)}
        />
      ) : (
        <div className="play-layout">
          <Hud
            score={play.score}
            best={best}
            combo={play.combo}
            b2b={play.b2b}
            undosLeft={play.undosLeft}
            canUndo={
              screen === "play" &&
              !clearing &&
              !adBusy &&
              (play.undosLeft === 0 || (play.undosLeft > 0 && historyRef.current.length > 0))
            }
            onPause={() => {
              if (screen === "play") {
                gameplayStop();
                setScreen("paused");
              }
            }}
            onUndo={() => {
              if (play.undosLeft > 0) {
                undo();
                return;
              }
              void (async () => {
                const ok = await runRewarded();
                if (!ok) return;
                const next = { ...playRef.current, undosLeft: playRef.current.undosLeft + 1 };
                setPlay(next);
                persistSession(next);
              })();
            }}
          />
          <div ref={boardRef} className="board-stage">
            <div className={cn("board-frame", shaking && "is-shaking")}>
              <Board
                board={play.board}
                ghost={screen === "play" ? ghost : null}
                clearing={clearing}
                popping={popping}
                locked={locked}
                onPointerUp={onBoardPointerUp}
                onPointerLeave={() => {
                  if (!drag) setGhost(null);
                }}
              />
              <FxCanvas ref={fxRef} className="fx-layer" />
              {banner ? <div className="board-banner">{banner}</div> : null}
            </div>
          </div>
          <div className="tray-row" aria-label="Pieces" key={dealPulse}>
            <button
              type="button"
              className={cn(
                "hold-slot",
                selected !== null && !play.holdLocked && "is-ready",
                play.holdLocked && "is-locked",
                !play.hold && "is-empty",
              )}
              disabled={locked}
              aria-label={play.hold ? "Hold, tap a piece then hold to swap" : "Hold empty"}
              onPointerUp={(e) => {
                e.stopPropagation();
                if (locked) return;
                doHold();
              }}
            >
              <span className="hold-label">Hold</span>
              {play.hold ? (
                <PieceView
                  piece={play.hold}
                  cell={Math.min(trayCell, 22)}
                  gap={trayGap}
                  dimmed={play.holdLocked}
                />
              ) : null}
            </button>
            {play.pieces.map((piece, index) => {
              const placeable = piece ? hasAnyPlacement(play.board, piece) : false;
              const isSel = selected === index;
              const hide = Boolean(drag && drag.index === index);
              return (
                <button
                  key={piece?.id ?? `empty-${index}`}
                  type="button"
                  className={cn(
                    "tray-slot",
                    isSel && "is-selected",
                    dealPulse > 0 && "is-dealt",
                    invalidIndex === index && "is-shake",
                    !piece && "is-empty",
                  )}
                  disabled={!piece || locked}
                  aria-label={piece ? `Piece ${index + 1}` : `Empty slot ${index + 1}`}
                  data-piece={index}
                  aria-pressed={isSel}
                  onPointerDown={(ev) => onTrayPointerDown(index, ev)}
                >
                  {piece && !hide ? (
                    <PieceView piece={piece} cell={trayCell} gap={trayGap} dimmed={!placeable} />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {drag && draggingPiece ? (
        <div
          className="drag-layer"
          style={{
            left: drag.x + drag.offsetX,
            top: drag.y + drag.offsetY,
          }}
        >
          <PieceView piece={draggingPiece} cell={geom.cell} gap={geom.gap} />
        </div>
      ) : null}

      {screen === "paused" ? (
        <PauseScreen
          sound={sound}
          onResume={() => {
            void resumePlay();
          }}
          onHelp={() => setHelp(true)}
          onToggleSound={toggleSound}
          onRestart={() => beginRun(null)}
          onShuffle={() => {
            void shufflePieces();
          }}
          shuffling={adBusy}
          confirming={confirmRestart}
          onAskRestart={() => setConfirmRestart(true)}
        />
      ) : null}

      {screen === "over" ? (
        <OverScreen
          score={play.score}
          best={best}
          lines={play.lines}
          maxCombo={play.maxCombo}
          newBest={newBest}
          onContinue={() => {
            void continueRun();
          }}
          continuing={adBusy}
          onAgain={() => {
            void playAgain();
          }}
          onHome={() => {
            setScreen("start");
            setSavedSession(null);
          }}
        />
      ) : null}

      {help ? <HelpScreen onClose={closeHelp} /> : null}
      {adBreak ? <AdBreakScreen /> : null}
    </div>
  );
}
