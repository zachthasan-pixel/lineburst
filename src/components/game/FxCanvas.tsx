import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { CellOffset } from "@/lib/game/types";

export type BoardGeom = {
  pad: number;
  gap: number;
  cell: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  rot: number;
  vr: number;
};

type Floater = {
  x: number;
  y: number;
  text: string;
  life: number;
  max: number;
  size: number;
  color: string;
};

export type FxHandle = {
  burst: (cells: CellOffset[], geom: BoardGeom, colors: string[], intensity?: number) => void;
  floatText: (x: number, y: number, text: string, opts?: { size?: number; color?: string }) => void;
};

function readVar(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export const FxCanvas = forwardRef<FxHandle, { className?: string }>(function FxCanvas(
  { className },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const floaters = useRef<Floater[]>([]);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let running = true;

    const loop = (t: number) => {
      if (!running) return;
      const raw = (t - last) / 1000;
      const dt = Math.min(raw, 0.1);
      last = t;

      const parent = canvas.parentElement;
      const w = parent?.clientWidth ?? 0;
      const h = parent?.clientHeight ?? 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const nextP: Particle[] = [];
      for (const p of particles.current) {
        p.life -= dt;
        if (p.life <= 0) continue;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 520 * dt;
        p.vx *= 0.98;
        p.rot += p.vr * dt;
        const a = Math.max(0, p.life / p.max);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
        nextP.push(p);
      }
      particles.current = nextP;

      const nextF: Floater[] = [];
      for (const f of floaters.current) {
        f.life -= dt;
        if (f.life <= 0) continue;
        f.y -= 42 * dt;
        const a = Math.min(1, f.life / f.max);
        ctx.save();
        ctx.globalAlpha = a;
        ctx.fillStyle = f.color;
        ctx.font = `700 ${f.size}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
        nextF.push(f);
      }
      floaters.current = nextF;

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    burst(cells, geom, colors, intensity = 1) {
      if (reduced.current) return;
      const count = Math.round(8 * intensity);
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]!;
        const cx = geom.pad + cell.c * (geom.cell + geom.gap) + geom.cell / 2;
        const cy = geom.pad + cell.r * (geom.cell + geom.gap) + geom.cell / 2;
        const color = colors[i % colors.length] ?? "#5eead4";
        for (let n = 0; n < count; n++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 80 + Math.random() * 220 * intensity;
          particles.current.push({
            x: cx + (Math.random() - 0.5) * geom.cell * 0.4,
            y: cy + (Math.random() - 0.5) * geom.cell * 0.4,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd - 80,
            life: 0.35 + Math.random() * 0.35,
            max: 0.7,
            size: 3 + Math.random() * 5,
            color,
            rot: Math.random() * Math.PI,
            vr: (Math.random() - 0.5) * 8,
          });
        }
      }
    },
    floatText(x, y, text, opts) {
      floaters.current.push({
        x,
        y,
        text,
        life: 1,
        max: 1,
        size: opts?.size ?? 20,
        color: opts?.color ?? readVar("--color-fg", "#eef1f6"),
      });
    },
  }));

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
});
