type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfx: GainNode | null = null;
let enabled = true;

function now() {
  return ctx?.currentTime ?? 0;
}

function connectGraph(ac: AudioContext) {
  master = ac.createGain();
  sfx = ac.createGain();
  sfx.gain.value = 0.8;
  master.gain.value = enabled ? 0.7 : 0;
  sfx.connect(master);
  master.connect(ac.destination);
}

export function unlockAudio() {
  if (typeof window === "undefined") return;
  const W = window as AudioWindow;
  const Ctor = W.AudioContext || W.webkitAudioContext;
  if (!Ctor) return;
  if (!ctx) {
    ctx = new Ctor({ latencyHint: "interactive" });
    connectGraph(ctx);
  }
  if (ctx.state === "suspended") void ctx.resume();
}

export function setSoundEnabled(on: boolean) {
  enabled = on;
  if (!master || !ctx) return;
  master.gain.setTargetAtTime(on ? 0.7 : 0, ctx.currentTime, 0.03);
}

export function isSoundEnabled() {
  return enabled;
}

function envGain(peak: number, attack: number, dur: number) {
  if (!ctx || !sfx) return null;
  const g = ctx.createGain();
  const t = now();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(sfx);
  return g;
}

function tone(freq: number, dur: number, type: OscillatorType, peak: number, attack = 0.008) {
  if (!ctx || !enabled) return;
  const g = envGain(peak, attack, dur);
  if (!g) return;
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, now());
  o.connect(g);
  o.start(now());
  o.stop(now() + dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

function slide(from: number, to: number, dur: number, type: OscillatorType, peak: number) {
  if (!ctx || !enabled) return;
  const g = envGain(peak, 0.006, dur);
  if (!g) return;
  const o = ctx.createOscillator();
  o.type = type;
  const t = now();
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t + dur * 0.9);
  o.connect(g);
  o.start(t);
  o.stop(t + dur + 0.02);
  o.onended = () => {
    o.disconnect();
    g.disconnect();
  };
}

function noise(dur: number, peak: number, freq: number, q = 2) {
  if (!ctx || !enabled || !sfx) return;
  const ac = ctx;
  const frames = Math.max(1, Math.floor(ac.sampleRate * dur));
  const buffer = ac.createBuffer(1, frames, ac.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  src.buffer = buffer;
  const filter = ac.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const g = envGain(peak, 0.004, dur);
  if (!g) return;
  src.connect(filter);
  filter.connect(g);
  src.start(now());
  src.stop(now() + dur);
  src.onended = () => {
    src.disconnect();
    filter.disconnect();
    g.disconnect();
  };
}

export function playSelect() {
  tone(720 + Math.random() * 40, 0.05, "triangle", 0.08);
}

export function playPlace() {
  tone(180 + Math.random() * 20, 0.08, "sine", 0.16);
  tone(420 + Math.random() * 30, 0.045, "square", 0.05);
}

export function playInvalid() {
  slide(240, 110, 0.16, "sawtooth", 0.1);
}

export function playClear(lines: number) {
  noise(0.1, 0.14, 1500, 1.3);
  const n = Math.min(lines, 5);
  for (let i = 0; i < n; i++) {
    const f = 460 + i * 170;
    setTimeout(() => tone(f, 0.11, "triangle", 0.13), i * 32);
  }
}

export function playCombo(combo: number) {
  const n = Math.min(combo, 8);
  const f = 520 + n * 90;
  tone(f, 0.14, "sine", 0.14);
  tone(f * 1.5, 0.16, "triangle", 0.09);
  if (n >= 3) {
    setTimeout(() => tone(f * 2, 0.2, "sine", 0.08), 40);
    noise(0.08, 0.08, 1800, 1.1);
  }
  if (n >= 5) {
    setTimeout(() => tone(f * 2.5, 0.22, "triangle", 0.07), 90);
  }
}

export function playPerfect() {
  tone(523, 0.18, "sine", 0.12);
  setTimeout(() => tone(659, 0.18, "sine", 0.12), 70);
  setTimeout(() => tone(784, 0.28, "triangle", 0.14), 140);
}

export function playOver() {
  slide(360, 90, 0.45, "sine", 0.14);
  setTimeout(() => tone(80, 0.3, "triangle", 0.08), 80);
}

export function playHold() {
  tone(390, 0.07, "triangle", 0.08);
  setTimeout(() => tone(520, 0.08, "sine", 0.07), 40);
}

export function playB2B() {
  tone(392, 0.1, "sine", 0.1);
  setTimeout(() => tone(523, 0.12, "triangle", 0.12), 50);
  setTimeout(() => tone(659, 0.18, "sine", 0.1), 110);
}

export function playDeal() {
  tone(500, 0.06, "triangle", 0.06);
  setTimeout(() => tone(640, 0.07, "triangle", 0.05), 50);
}

export function playUndo() {
  slide(300, 220, 0.1, "sine", 0.08);
}

export function resumeAudioIfNeeded() {
  if (typeof document === "undefined") return;
  if (document.visibilityState === "visible") unlockAudio();
}
