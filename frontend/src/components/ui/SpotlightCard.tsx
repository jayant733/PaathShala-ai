import { useRef, type ReactNode, type PointerEvent } from "react";

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  /** Spotlight glow color (M3 token). */
  color?: string;
  /** M3 token for the soft border on hover. */
  borderColor?: string;
};

/**
 * Card with a cursor-tracking radial spotlight and a glowing border on hover.
 * Pure CSS-variable technique → GPU friendly, no re-renders on move.
 */
export function SpotlightCard({
  children,
  className = "",
  color = "var(--color-primary-fixed)",
  borderColor = "var(--color-primary)",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={() => ref.current?.style.removeProperty("--spot-x")}
      className={`group relative overflow-hidden rounded-[1.75rem] border border-outline-variant/20 bg-surface-container-lowest/70 backdrop-blur-xl transition-colors duration-500 hover:border-[var(--color-outline-variant)]/50 ${className}`}
      style={{
        ["--spot-x" as string]: "50%",
        ["--spot-y" as string]: "50%",
        ["--spot-c" as string]: color,
        ["--spot-b" as string]: borderColor,
      }}
    >
      {/* Spotlight glow that follows the cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(240px circle at var(--spot-x) var(--spot-y), var(--spot-c) 0%, transparent 70%)",
        }}
      />
      {/* Glowing border ring */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ boxShadow: `0 0 0 1px var(--spot-b), 0 0 40px -12px var(--spot-c)` }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
