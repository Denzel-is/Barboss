"use client";

import { RefreshCw } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

const enabledRoutes = new Set(["/app", "/app/tasks", "/app/shop", "/admin", "/admin/review"]);
const refreshThreshold = 74;
const maxPull = 118;

export function PullToRefresh() {
  const pathname = usePathname();
  const router = useRouter();
  const startY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, startTransition] = useTransition();
  const isEnabled = enabledRoutes.has(pathname);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    function handleTouchStart(event: TouchEvent) {
      if (window.scrollY > 0 || event.touches.length !== 1) {
        startY.current = null;
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, button, details")) {
        startY.current = null;
        return;
      }

      startY.current = event.touches[0]?.clientY ?? null;
    }

    function handleTouchMove(event: TouchEvent) {
      if (startY.current === null || window.scrollY > 0) {
        return;
      }

      const currentY = event.touches[0]?.clientY ?? 0;
      const distance = Math.max(0, currentY - startY.current);

      if (distance > 12) {
        event.preventDefault();
        setPullDistance(Math.min(maxPull, Math.round(distance * 0.58)));
      }
    }

    function handleTouchEnd() {
      const shouldRefresh = pullDistance >= refreshThreshold;
      startY.current = null;

      if (shouldRefresh) {
        setPullDistance(refreshThreshold);
        startTransition(() => {
          router.refresh();
          window.setTimeout(() => setPullDistance(0), 650);
        });
        return;
      }

      setPullDistance(0);
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, [isEnabled, pullDistance, router]);

  if (!isEnabled && !isRefreshing) {
    return null;
  }

  const progress = Math.min(1, pullDistance / refreshThreshold);
  const visible = pullDistance > 0 || isRefreshing;

  return (
    <div
      aria-hidden={!visible}
      className="pointer-events-none fixed left-1/2 top-3 z-50 flex h-11 w-11 -translate-x-1/2 items-center justify-center rounded-full border border-emerald-900/10 bg-white/95 text-emerald-800 shadow-lg transition-all duration-200"
      style={{
        opacity: visible ? 1 : 0,
        transform: `translate(-50%, ${visible ? Math.min(28, pullDistance / 4) : -18}px) scale(${0.78 + progress * 0.22})`,
      }}
    >
      <RefreshCw
        className={isRefreshing ? "h-5 w-5 animate-spin" : "h-5 w-5"}
        style={{ transform: isRefreshing ? undefined : `rotate(${progress * 210}deg)` }}
      />
    </div>
  );
}
