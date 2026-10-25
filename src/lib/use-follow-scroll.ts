import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { readLineInComfort, scrollWasOurs, shouldFollowScroll } from "@/lib/read-follow";

/** Publish the fixed player height so the page and the word card stay above it. */
export function useDockHeight(dockRef: RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    const el = active ? dockRef.current : null;
    if (!el || typeof ResizeObserver === "undefined") {
      document.documentElement.style.removeProperty("--dock-h");
      return;
    }
    const apply = () => {
      document.documentElement.style.setProperty("--dock-h", `${Math.ceil(el.getBoundingClientRect().height)}px`);
    };
    apply();
    const watch = new ResizeObserver(apply);
    watch.observe(el);
    return () => {
      watch.disconnect();
      document.documentElement.style.removeProperty("--dock-h");
    };
  }, [dockRef, active]);
}

function pxVar(name: string, fallback: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!raw) return fallback;
  const probe = document.createElement("div");
  probe.style.position = "absolute";
  probe.style.visibility = "hidden";
  probe.style.height = raw;
  document.body.appendChild(probe);
  const height = probe.getBoundingClientRect().height;
  probe.remove();
  return height || fallback;
}

function readingFrame(): { top: number; bottom: number } {
  const header = pxVar("--read-header", 56);
  const dock = pxVar("--dock-h", 0);
  const nav = pxVar("--nav-h", 56);
  return { top: header, bottom: Math.max(header + 1, window.innerHeight - dock - nav) };
}

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Follow a verse line, not each word. A hand scroll, a key, or the scrollbar
 * pauses it. Play, or "Back to the reader", starts it again.
 */
export function useFollowScroll(lineKey: string) {
  const targetRef = useRef<HTMLElement | null>(null);
  const following = useRef(true);
  const armedAt = useRef(0);
  const seen = useRef("");
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(true);

  const scrollToTarget = useCallback((force: boolean) => {
    const node = targetRef.current;
    if (!node) return;
    if (!force && scrollWasOurs(armedAt.current, performance.now())) return;
    const frame = readingFrame();
    const rect = node.getBoundingClientRect();
    const comfortable = readLineInComfort(rect.top, rect.bottom, frame.top, frame.bottom);
    if (!force && !shouldFollowScroll(true, comfortable)) return;
    armedAt.current = performance.now();
    node.scrollIntoView({
      block: "center",
      inline: "nearest",
      behavior: reducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const pause = useCallback(() => {
    if (!following.current) return;
    following.current = false;
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    following.current = true;
    setPaused(false);
    setOnScreen(true);
    scrollToTarget(true);
  }, [scrollToTarget]);

  useEffect(() => {
    if (!lineKey || lineKey === seen.current) return;
    const first = seen.current === "";
    seen.current = lineKey;
    if (!following.current) return;
    if (first) {
      const node = targetRef.current;
      if (!node) return;
      const frame = readingFrame();
      const rect = node.getBoundingClientRect();
      const visible = rect.bottom > frame.top && rect.top < frame.bottom;
      if (visible) return;
    }
    scrollToTarget(false);
  }, [lineKey, scrollToTarget]);

  useEffect(() => {
    let ready = false;
    const arm = window.setTimeout(() => {
      ready = true;
    }, 400);
    const onScroll = () => {
      if (!ready || scrollWasOurs(armedAt.current, performance.now())) return;
      pause();
    };
    const onPointerLeave = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && target instanceof HTMLElement && target.closest(".read-dock, .wlc-toolbar, .wlc-card")) return;
      pause();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "PageUp" || event.key === "PageDown" || event.key === "Home" || event.key === "End") {
        pause();
      }
    };
    window.addEventListener("wheel", onPointerLeave, { passive: true });
    window.addEventListener("touchmove", onPointerLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    const onScrollEnd = () => {
      armedAt.current = 0;
    };
    window.addEventListener("scrollend", onScrollEnd);
    return () => {
      window.clearTimeout(arm);
      window.removeEventListener("wheel", onPointerLeave);
      window.removeEventListener("touchmove", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scrollend", onScrollEnd);
    };
  }, [pause]);

  useEffect(() => {
    const node = targetRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const frame = readingFrame();
    const top = Math.round(frame.top);
    const bottom = Math.round(Math.max(0, window.innerHeight - frame.bottom));
    const watch = new IntersectionObserver(
      (entries) => {
        setOnScreen(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0.6 },
    );
    watch.observe(node);
    return () => watch.disconnect();
  }, [lineKey, paused]);

  return {
    targetRef,
    paused,
    showBack: paused && !onScreen,
    resume,
  };
}
