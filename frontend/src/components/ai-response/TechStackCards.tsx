import { Boxes } from 'lucide-react';
import { RevealGroup, RevealItem } from '../ui/Reveal';

/** Glass badge grid showing the technologies involved in the topic. */
export default function TechStackCards({ tech }: { tech: string[] }) {
  if (!tech?.length) return null;
  return (
    <div>
      <h4 className="font-label-md text-label-md uppercase tracking-wider text-on-surface-variant flex items-center gap-2 mb-3">
        <Boxes className="w-4 h-4 text-secondary" /> Technology Stack
      </h4>
      <RevealGroup className="flex flex-wrap gap-2">
        {tech.map((t) => (
          <RevealItem key={t} y={10}>
            <span className="glass inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-label-sm text-label-sm text-on-surface">
              <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-primary to-tertiary" />
              {t}
            </span>
          </RevealItem>
        ))}
      </RevealGroup>
    </div>
  );
}
