import { Brain, BookOpen, Shield, Database, Network, Cpu, Rocket, Lightbulb, Sparkles } from 'lucide-react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { RevealGroup, RevealItem } from '../ui/Reveal';
import type { PresentationCard } from './types';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  brain: Brain,
  book: BookOpen,
  shield: Shield,
  database: Database,
  network: Network,
  cpu: Cpu,
  rocket: Rocket,
  lightbulb: Lightbulb,
};

/** Grid of glass spotlight cards for component / feature highlights. */
export default function FeatureCards({ cards }: { cards: PresentationCard[] }) {
  if (!cards?.length) return null;
  return (
    <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {cards.map((card, i) => {
        const Icon = ICONS[card.icon ?? ''] ?? Sparkles;
        return (
          <RevealItem key={i} y={18}>
            <SpotlightCard className="h-full p-4">
              <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="font-label-md text-label-md text-on-surface font-semibold mb-1">{card.title}</p>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{card.description}</p>
            </SpotlightCard>
          </RevealItem>
        );
      })}
    </RevealGroup>
  );
}
