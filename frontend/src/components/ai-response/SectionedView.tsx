import { Reveal } from '../ui/Reveal';
import DiagramRenderer from './DiagramRenderer';
import ImageCard from './ImageCard';
import FeatureCards from './FeatureCards';
import TechStackCards from './TechStackCards';
import TimelineSteps from './TimelineSteps';
import ComparisonTable from './ComparisonTable';
import Markdown from './Markdown';
import type { Presentation } from './types';

/**
 * Generic presentation renderer: title, summary, sections, diagram, images,
 * cards, steps, tech and a comparison table. Used as the safe default for any
 * structured response, and composed by the type-specific views.
 */
export default function SectionedView({ p }: { p: Presentation }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      {p.summary && (
        <Reveal y={16}>
          <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-3xl">{p.summary}</p>
        </Reveal>
      )}

      {/* Sections */}
      {p.sections?.length ? (
        <div className="space-y-5">
          {p.sections.map((section, i) => (
            <Reveal key={i} y={20}>
              <div className="rounded-2xl border border-surface-container-highest/30 bg-surface-container-lowest/50 p-5">
                <h4 className="font-title-sm text-title-sm text-on-surface mb-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-primary/15 text-primary flex items-center justify-center text-[12px] font-bold">{i + 1}</span>
                  {section.title}
                </h4>
                <Markdown content={section.content} />
              </div>
            </Reveal>
          ))}
        </div>
      ) : (
        p.markdown && <Reveal y={16}><Markdown content={p.markdown} /></Reveal>
      )}

      {/* Diagram */}
      {p.diagram && (
        <Reveal y={24}>
          <div className="glass rounded-2xl p-4">
            <DiagramRenderer source={p.diagram} label="Architecture overview" />
          </div>
        </Reveal>
      )}

      {/* Images */}
      {p.images?.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {p.images.map((img, i) => (
            <Reveal key={i} y={20}>
              <ImageCard
                imageUrl={img.imageUrl}
                title={img.title || img.query}
                description={img.description}
                seed={img.query}
              />
            </Reveal>
          ))}
        </div>
      ) : null}

      {/* Cards */}
      {p.cards?.length ? <FeatureCards cards={p.cards} /> : null}

      {/* Steps */}
      {p.steps?.length ? <TimelineSteps steps={p.steps} /> : null}

      {/* Comparison */}
      {p.comparison ? <ComparisonTable comparison={p.comparison} /> : null}

      {/* Tech */}
      {p.tech?.length ? <TechStackCards tech={p.tech} /> : null}
    </div>
  );
}
