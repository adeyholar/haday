import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { PAD_BASE, PAD_TOP } from "@/lib/pad-guides";
import { staveRegion } from "@/lib/letter-models";
import { clipPaths, modelToPad } from "@/lib/letter-strokes";
import { cn } from "@/lib/cn";

type Point = { x: number; y: number };
type Stroke = Point[];

export type InkPadHandle = {
  isEmpty: () => boolean;
  clear: () => void;
  undo: () => void;
  commit: () => void;
  toImage: () => string | null;
  getStrokes: () => { x: number; y: number }[][];
  getHeight: () => number;
};

type Props = {
  className?: string;
  disabled?: boolean;
  guides?: boolean;
  model?: string | null;
  showModel?: boolean;
  /** Which handwritten variant to follow (cycles with “Another hand”). */
  modelIndex?: number;
  /** Draw the ghost as a moving stroke to copy. Honors reduced-motion. */
  animate?: boolean;
  onChange?: (empty: boolean) => void;
};

function drawPaths(
  ctx: CanvasRenderingContext2D,
  paths: Point[][],
  style: string,
  width: number,
) {
  ctx.strokeStyle = style;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const path of paths) {
    if (path.length < 2) {
      if (path[0]) {
        ctx.beginPath();
        ctx.arc(path[0].x, path[0].y, width / 2, 0, Math.PI * 2);
        ctx.fillStyle = style;
        ctx.fill();
      }
      continue;
    }
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
    ctx.stroke();
  }
}

export const InkPad = forwardRef<InkPadHandle, Props>(function InkPad(
  { className, disabled, guides, model, showModel, modelIndex = 0, animate, onChange },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentRef = useRef<Stroke | null>(null);
  const guidesRef = useRef(Boolean(guides));
  const modelRef = useRef(model ?? "");
  const showModelRef = useRef(Boolean(showModel));
  const modelIndexRef = useRef(modelIndex);
  const animateRef = useRef(Boolean(animate));
  const followTRef = useRef(1);
  const followRafRef = useRef(0);
  const reducedRef = useRef(false);
  guidesRef.current = Boolean(guides);
  modelRef.current = model ?? "";
  showModelRef.current = Boolean(showModel);
  modelIndexRef.current = modelIndex;
  animateRef.current = Boolean(animate);

  function hasInk() {
    return strokesRef.current.length > 0 || Boolean(currentRef.current);
  }

  function stopFollow() {
    if (followRafRef.current) cancelAnimationFrame(followRafRef.current);
    followRafRef.current = 0;
    followTRef.current = 1;
  }

  function startFollow() {
    stopFollow();
    if (!animateRef.current || !showModelRef.current || !modelRef.current || hasInk() || reducedRef.current) {
      followTRef.current = 1;
      redraw();
      return;
    }
    const t0 = performance.now();
    const drawMs = 2400;
    const holdMs = 800;
    const loop = drawMs + holdMs;
    const tick = (now: number) => {
      if (hasInk()) {
        followTRef.current = 1;
        followRafRef.current = 0;
        redraw();
        return;
      }
      const e = (now - t0) % loop;
      followTRef.current = e < drawMs ? e / drawMs : 1;
      redraw();
      followRafRef.current = requestAnimationFrame(tick);
    };
    followTRef.current = 0;
    followRafRef.current = requestAnimationFrame(tick);
  }

  function sizeCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function redraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.fillStyle = "#faf7f0";
    ctx.fillRect(0, 0, rect.width, rect.height);
    if (guidesRef.current) {
      ctx.save();
      ctx.strokeStyle = "rgba(28, 24, 20, 0.28)";
      ctx.lineWidth = 1.25;
      ctx.setLineDash([5, 5]);
      const topY = rect.height * PAD_TOP;
      const baseY = rect.height * PAD_BASE;
      ctx.beginPath();
      ctx.moveTo(12, topY);
      ctx.lineTo(rect.width - 12, topY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(12, baseY);
      ctx.lineTo(rect.width - 12, baseY);
      ctx.stroke();
      ctx.restore();
    }
    if (showModelRef.current && modelRef.current) {
      const region = staveRegion(modelRef.current);
      const full = modelToPad(modelRef.current, rect.width, rect.height, region, modelIndexRef.current);
      const t = followTRef.current;
      ctx.save();
      drawPaths(ctx, full, "rgba(28, 24, 20, 0.16)", 4.5);
      if (t < 0.999) {
        const shown = clipPaths(full, t);
        drawPaths(ctx, shown, "rgba(28, 24, 20, 0.55)", 5.2);
        const last = shown[shown.length - 1];
        const tip = last?.[last.length - 1];
        if (tip) {
          ctx.fillStyle = "rgba(28, 24, 20, 0.72)";
          ctx.beginPath();
          ctx.arc(tip.x, tip.y, 4.4, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        drawPaths(ctx, full, "rgba(28, 24, 20, 0.42)", 4.5);
      }
      ctx.restore();
    }
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1c1814";
    ctx.lineWidth = 3.2;
    const all = currentRef.current ? [...strokesRef.current, currentRef.current] : strokesRef.current;
    for (const stroke of all) {
      if (stroke.length < 2) {
        if (stroke[0]) {
          ctx.beginPath();
          ctx.arc(stroke[0].x, stroke[0].y, 1.6, 0, Math.PI * 2);
          ctx.fillStyle = "#1c1814";
          ctx.fill();
        }
        continue;
      }
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y);
      ctx.stroke();
    }
  }

  function pointFromEvent(e: PointerEvent): Point | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  useEffect(() => {
    reducedRef.current =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    sizeCanvas();
    const onResize = () => sizeCanvas();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [guides, model, showModel, modelIndex]);

  useEffect(() => {
    startFollow();
    return () => stopFollow();
  }, [animate, model, showModel, modelIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const down = (e: PointerEvent) => {
      if (disabled) return;
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      const p = pointFromEvent(e);
      if (!p) return;
      stopFollow();
      currentRef.current = [p];
      onChange?.(false);
      redraw();
    };
    const move = (e: PointerEvent) => {
      if (!currentRef.current) return;
      e.preventDefault();
      const p = pointFromEvent(e);
      if (!p) return;
      currentRef.current.push(p);
      redraw();
    };
    const up = (e: PointerEvent) => {
      if (!currentRef.current) return;
      e.preventDefault();
      strokesRef.current.push(currentRef.current);
      currentRef.current = null;
      onChange?.(strokesRef.current.length === 0);
      redraw();
    };

    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
    };
  }, [disabled, onChange]);

  useImperativeHandle(ref, () => ({
    isEmpty: () => strokesRef.current.length === 0 && !currentRef.current,
    clear: () => {
      strokesRef.current = [];
      currentRef.current = null;
      onChange?.(true);
      startFollow();
    },
    undo: () => {
      strokesRef.current = strokesRef.current.slice(0, -1);
      onChange?.(strokesRef.current.length === 0);
      if (strokesRef.current.length === 0) startFollow();
      else redraw();
    },
    commit: () => {
      if (currentRef.current?.length) {
        strokesRef.current.push(currentRef.current);
        currentRef.current = null;
        redraw();
      }
    },
    toImage: () => {
      const all = currentRef.current?.length ? [...strokesRef.current, currentRef.current] : strokesRef.current;
      if (all.length === 0) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const stroke of all) {
        for (const p of stroke) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
      }
      if (!Number.isFinite(minX)) return null;
      const pad = 36;
      const srcW = Math.max(8, maxX - minX);
      const srcH = Math.max(8, maxY - minY);
      const outW = 960;
      const scale = outW / (srcW + pad * 2);
      const outH = Math.max(220, Math.round((srcH + pad * 2) * scale));
      const out = document.createElement("canvas");
      out.width = outW;
      out.height = outH;
      const ctx = out.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, outW, outH);
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#111111";
      ctx.fillStyle = "#111111";
      ctx.lineWidth = Math.max(8, 10);
      const tx = (x: number) => (x - minX + pad) * scale;
      const ty = (y: number) => (y - minY + pad) * scale;
      for (const stroke of all) {
        if (stroke.length < 2) {
          if (stroke[0]) {
            ctx.beginPath();
            ctx.arc(tx(stroke[0].x), ty(stroke[0].y), ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          continue;
        }
        ctx.beginPath();
        ctx.moveTo(tx(stroke[0].x), ty(stroke[0].y));
        for (let i = 1; i < stroke.length; i++) ctx.lineTo(tx(stroke[i].x), ty(stroke[i].y));
        ctx.stroke();
      }
      return out.toDataURL("image/png");
    },
    getStrokes: () => {
      const all = currentRef.current?.length ? [...strokesRef.current, currentRef.current] : strokesRef.current;
      return all.map((s) => s.map((p) => ({ x: p.x, y: p.y })));
    },
    getHeight: () => canvasRef.current?.getBoundingClientRect().height ?? 0,
  }));

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "h-52 w-full touch-none rounded-[var(--radius-xl)] bg-card shadow-[var(--shadow-border)]",
        disabled ? "cursor-default opacity-70" : "cursor-crosshair",
        className,
      )}
      style={{ touchAction: "none" }}
      aria-label="Hebrew writing pad"
    />
  );
});
