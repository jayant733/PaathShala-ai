type TestimonialCardProps = {
  quote: string;
  name: string;
  role: string;
  /** Material Symbols icon name for the avatar. */
  icon?: string;
};

/**
 * Glass quote card used inside the testimonials marquee.
 */
export function TestimonialCard({ quote, name, role, icon = "person" }: TestimonialCardProps) {
  return (
    <figure className="glass rounded-3xl p-6 w-[320px] sm:w-[360px] shrink-0 flex flex-col gap-4">
      <div className="flex items-center gap-0.5 text-secondary">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className="material-symbols-outlined text-[16px] filled">
            star
          </span>
        ))}
      </div>
      <blockquote className="text-body-md text-on-surface leading-relaxed">“{quote}”</blockquote>
      <figcaption className="mt-auto flex items-center gap-3 pt-4 border-t border-outline-variant/20">
        <span className="w-9 h-9 rounded-full bg-primary-container/70 flex items-center justify-center">
          <span className="material-symbols-outlined text-[18px] text-on-primary-container">
            {icon}
          </span>
        </span>
        <div>
          <div className="text-label-md text-on-surface">{name}</div>
          <div className="text-label-sm text-on-surface-variant">{role}</div>
        </div>
      </figcaption>
    </figure>
  );
}
