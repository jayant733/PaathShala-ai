import CountUp, { type CountUpProps } from "./CountUp";

type AnimatedStatProps = Omit<CountUpProps, "className" | "digitEffect"> & {
  label: string;
  /** Short lowercase caption under the number, e.g. "routing latency". */
  caption?: string;
  className?: string;
  mono?: boolean;
};

/**
 * A single animated statistic: large tabular number (via CountUp) with a
 * mono caption. Mounts inside a revealed container.
 */
export function AnimatedStat({
  label,
  caption,
  className = "",
  mono = true,
  ...countProps
}: AnimatedStatProps) {
  return (
    <div className={`flex flex-col items-center gap-1.5 text-center ${className}`}>
      <CountUp
        {...countProps}
        digitEffect="slide"
        className={`text-[2rem] md:text-[2.5rem] leading-none font-semibold tracking-tight text-on-surface ${
          mono ? "font-mono" : ""
        }`}
      />
      <span className="text-label-sm text-on-surface-variant uppercase tracking-[0.16em]">
        {caption ?? label}
      </span>
    </div>
  );
}
