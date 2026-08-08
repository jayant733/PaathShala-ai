import { type ReactNode } from "react";

/**
 * Live "status" pill — pulsing dot + mono label. Used for the hero badge and
 * section eyebrows.
 */
export function AnimatedBadge({
  children,
  className = "",
  dotClass = "bg-primary",
}: {
  children: ReactNode;
  className?: string;
  dotClass?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass text-label-sm text-on-surface-variant ${className}`}
    >
      <span className="relative flex h-2 w-2">
        <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${dotClass}`} />
        <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} />
      </span>
      {children}
    </span>
  );
}
