import { type ReactNode } from "react";
import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
};

/**
 * Consistent section header: animated eyebrow pill + display title + subcopy.
 * Used across every landing section to keep hierarchy identical.
 */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className = "",
}: SectionHeadingProps) {
  const alignCls =
    align === "center" ? "items-center text-center mx-auto" : "items-start text-left";

  return (
    <Reveal
      className={`flex flex-col gap-5 max-w-3xl ${alignCls} ${className}`}
    >
      <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full glass text-label-sm text-primary uppercase tracking-[0.18em] w-fit">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        {eyebrow}
      </span>
      <h2 className="text-headline-lg md:text-[40px] md:leading-[48px] text-on-surface tracking-tight text-balance">
        {title}
      </h2>
      {subtitle && (
        <p className="text-body-lg text-on-surface-variant max-w-2xl text-pretty">
          {subtitle}
        </p>
      )}
    </Reveal>
  );
}
