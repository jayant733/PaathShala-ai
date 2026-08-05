import { useEffect, useRef } from 'react';
import clsx from 'clsx';

interface TimerProps {
  /** Remaining seconds (owned by the parent / store). */
  secondsLeft: number;
  /** Called each second with the decremented value. */
  onTick: (s: number) => void;
  /** Called once when the timer hits zero. */
  onExpire?: () => void;
  className?: string;
}

/** mm:ss countdown. Parent owns the seconds so the value survives re-renders / persist. */
export default function Timer({ secondsLeft, onTick, onExpire, className }: TimerProps) {
  const expiredRef = useRef(false);

  useEffect(() => {
    if (secondsLeft <= 0) {
      if (!expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
      return;
    }
    const t = setTimeout(() => onTick(Math.max(0, secondsLeft - 1)), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft, onTick, onExpire]);

  const safe = Math.max(0, secondsLeft);
  const mm = Math.floor(safe / 60).toString().padStart(2, '0');
  const ss = (safe % 60).toString().padStart(2, '0');
  const urgent = safe <= 60;

  return (
    <span
      className={clsx(
        'font-mono text-body-md font-semibold tabular-nums inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        urgent ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface',
        className
      )}
    >
      <span className="material-symbols-outlined text-[18px]">timer</span>
      {mm}:{ss}
    </span>
  );
}
