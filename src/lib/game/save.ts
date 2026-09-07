import type { PersistV1, Session } from "./types";

const KEY = "lineburst-save-v1";
const SAVE_VERSION = 1 as const;

const defaults: PersistV1 = {
  version: SAVE_VERSION,
  best: 0,
  sound: true,
  seenHelp: false,
  session: null,
};

function isPiece(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.color === "number" &&
    typeof p.w === "number" &&
    typeof p.h === "number" &&
    Array.isArray(p.cells)
  );
}

function normalizeSession(s: Session): Session {
  return {
    ...s,
    hold: s.hold ?? null,
    holdLocked: Boolean(s.holdLocked),
    b2b: Boolean(s.b2b),
  };
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (!Array.isArray(s.board) || s.board.length !== 8) return false;
  if (!Array.isArray(s.pieces) || s.pieces.length !== 3) return false;
  if (typeof s.score !== "number") return false;
  if (!s.pieces.every((p) => p === null || isPiece(p))) return false;
  if (s.hold != null && !isPiece(s.hold)) return false;
  return true;
}

export function loadPersist(): PersistV1 {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaults };
    const parsed = JSON.parse(raw) as Partial<PersistV1>;
    if (parsed.version !== SAVE_VERSION) return { ...defaults };
    return {
      version: SAVE_VERSION,
      best: typeof parsed.best === "number" && parsed.best >= 0 ? parsed.best : 0,
      sound: parsed.sound !== false,
      seenHelp: Boolean(parsed.seenHelp),
      session: isSession(parsed.session) ? normalizeSession(parsed.session) : null,
    };
  } catch {
    return { ...defaults };
  }
}

export function writePersist(next: PersistV1) {
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // private mode / quota — keep playing in memory
  }
}

export function persistPatch(patch: Partial<Omit<PersistV1, "version">>) {
  const current = loadPersist();
  writePersist({ ...current, ...patch, version: SAVE_VERSION });
}
