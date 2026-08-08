import { Boxes, BookOpen, Code2, Columns3, GraduationCap } from 'lucide-react';
import SectionedView from './SectionedView';
import type { Presentation } from './types';

function ViewBanner({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-label-sm text-label-sm text-on-surface">
      <span className="text-primary">{icon}</span> {label}
    </div>
  );
}

export function ArchitectureView({ p }: { p: Presentation }) {
  return (
    <div className="space-y-5">
      <ViewBanner icon={<Boxes className="w-4 h-4" />} label="System Architecture" />
      <SectionedView p={p} />
    </div>
  );
}

export function ConceptView({ p }: { p: Presentation }) {
  return (
    <div className="space-y-5">
      <ViewBanner icon={<BookOpen className="w-4 h-4" />} label="Concept Explained" />
      <SectionedView p={p} />
    </div>
  );
}

export function CodeView({ p }: { p: Presentation }) {
  return (
    <div className="space-y-5">
      <ViewBanner icon={<Code2 className="w-4 h-4" />} label="Code Walkthrough" />
      <SectionedView p={p} />
    </div>
  );
}

export function ComparisonView({ p }: { p: Presentation }) {
  return (
    <div className="space-y-5">
      <ViewBanner icon={<Columns3 className="w-4 h-4" />} label="Comparison" />
      <SectionedView p={p} />
    </div>
  );
}

export function LearningView({ p }: { p: Presentation }) {
  return (
    <div className="space-y-5">
      <ViewBanner icon={<GraduationCap className="w-4 h-4" />} label="Learning Path" />
      <SectionedView p={p} />
    </div>
  );
}
