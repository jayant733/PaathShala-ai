import { useEffect, useState } from 'react';

interface ScoreDonutProps {
  /** Percentage 0–100. */
  percent: number;
  size?: number;
  strokeWidth?: number;
  /** Tailwind text-color class for the progress arc, e.g. "text-primary". */
  colorClass?: string;
  /** Tailwind text-color class for the track. */
  trackClass?: string;
  caption?: string;
}

/** Animated SVG donut for scores / score distributions. Hand-rolled — no chart lib. */
export default function ScoreDonut({
  percent,
  size = 180,
  strokeWidth = 16,
  colorClass = 'text-primary',
  trackClass = 'text-surface-container-highest',
  caption,
}: ScoreDonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 1100;
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      // ease-out cubic
      setDisplay(percent * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [percent]);

  const offset = circumference * (1 - display / 100);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${trackClass} stroke-current`}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className={`${colorClass} stroke-current`}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-mono text-[2.25rem] font-semibold leading-none text-on-surface tabular-nums">
          {Math.round(display)}
          <span className="text-on-surface-variant text-[1.25rem]">%</span>
        </span>
        {caption && (
          <span className="mt-1 px-2 text-label-sm text-on-surface-variant uppercase tracking-[0.16em]">{caption}</span>
        )}
      </div>
    </div>
  );
}
