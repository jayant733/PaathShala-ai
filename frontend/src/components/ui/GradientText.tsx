import { type ReactNode } from "react";

/**
 * Animated M3 gradient text. Wraps inline content; the gradient pans
 * continuously (respects prefers-reduced-motion via CSS).
 */
export function GradientText({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <span className={`text-gradient ${className}`}>{children}</span>;
}
