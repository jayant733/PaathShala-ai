import { type CSSProperties } from "react";

type Blob = {
  /** M3 token color, e.g. 'primary-fixed' → color-mix handled via CSS var. */
  color: string;
  size: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
  duration?: number;
  x?: string;
  y?: string;
};

type AuroraProps = {
  blobs?: Blob[];
  className?: string;
};

const DEFAULT_BLOBS: Blob[] = [
  { color: "var(--color-primary-fixed)", size: 560, top: "-12%", left: "-8%", opacity: 0.5, duration: 24, x: "60px", y: "40px" },
  { color: "var(--color-tertiary-fixed)", size: 480, top: "10%", right: "-10%", opacity: 0.4, duration: 30, x: "-70px", y: "-30px" },
  { color: "var(--color-secondary)", size: 520, bottom: "-18%", left: "20%", opacity: 0.28, duration: 27, x: "-50px", y: "-50px" },
];

/**
 * Animated aurora background layer. Renders drifting, blurred gradient blobs
 * behind content. Pure GPU transforms; honors prefers-reduced-motion in CSS.
 */
export function Aurora({ blobs = DEFAULT_BLOBS, className = "" }: AuroraProps) {
  return (
    <div className={`aurora ${className}`} aria-hidden="true">
      {blobs.map((b, i) => {
        const style: CSSProperties = {
          backgroundColor: b.color,
          width: b.size,
          height: b.size,
          top: b.top,
          left: b.left,
          right: b.right,
          bottom: b.bottom,
          opacity: b.opacity,
          "--aurora-dur": `${b.duration ?? 26}s`,
          "--aurora-x": b.x ?? "40px",
          "--aurora-y": b.y ?? "-30px",
        } as CSSProperties;
        return <span key={i} className="aurora-blob" style={style} />;
      })}
    </div>
  );
}
