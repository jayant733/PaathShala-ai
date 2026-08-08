import { useMemo, useState } from 'react';
import { X, Copy, Check, StickyNote, Eye, FileCode2, Download, Save } from 'lucide-react';
import Markdown from './Markdown';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import type { Presentation } from './types';

interface NotesModalProps {
  open: boolean;
  presentation: Presentation | null;
  rawContent: string;
  onClose: () => void;
}

/** Build structured markdown notes from a presentation: Summary / Concepts /
 *  Key points / Steps / Examples, ending with "continue learning". */
function buildNotes(p: Presentation | null, raw: string): string {
  if (!p) return raw;
  const lines: string[] = [];
  if (p.title) lines.push(`# ${p.title}`);
  if (p.summary) lines.push('', `> ${p.summary}`);
  if (p.difficulty) lines.push('', `**Difficulty:** ${p.difficulty}`);
  if (p.prerequisites?.length) lines.push('', `**Prerequisites:** ${p.prerequisites.join(', ')}`);

  if (p.concepts?.length) {
    lines.push('', '## Key Concepts');
    p.concepts.forEach((c) => lines.push(`- ${c}`));
  }

  if (p.cards?.length) {
    lines.push('', '## Important Points');
    p.cards.forEach((c) => lines.push(`- **${c.title}:** ${c.description}`));
  }

  if (p.sections?.length) {
    lines.push('', '## In Depth');
    for (const s of p.sections) {
      lines.push('', `### ${s.title}`);
      lines.push(s.content);
    }
  }

  if (p.steps?.length) {
    lines.push('', '## Step-by-Step');
    p.steps.forEach((s, i) => lines.push(`${i + 1}. **${s.title}** — ${s.description}`));
  }

  // "Examples" section: pull real-world illustrations from sections/cards.
  const exampleText =
    p.cards?.map((c) => c.description).find((d) => /example|use case|real/i.test(d)) ||
    p.sections?.map((s) => s.content).find((c) => /example|use case|for instance/i.test(c));
  if (exampleText) lines.push('', '## Examples', `- ${exampleText}`);

  if (p.nextTopics?.length) lines.push('', `**Continue with:** ${p.nextTopics.join(', ')}`);
  return lines.join('\n');
}

function downloadMarkdown(note: string, title: string) {
  const blob = new Blob([note], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(title || 'notes').replace(/[^\w\- ]/g, '').trim() || 'notes'}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Modal showing structured notes from a presentation with preview/raw toggle,
 *  copy, export and a (client-side) save slot for a future backend endpoint. */
export default function NotesModal({ open, presentation, rawContent, onClose }: NotesModalProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [mode, setMode] = useState<'preview' | 'raw'>('preview');

  const panelRef = useFocusTrap<HTMLDivElement>(open, onClose);

  const notes = useMemo(() => buildNotes(presentation, rawContent), [presentation, rawContent]);
  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(notes);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  // Placeholder for a future backend sync — for now persist client-side.
  const save = () => {
    try {
      const existing = JSON.parse(localStorage.getItem('paathshala-notes') ?? '[]') as unknown[];
      existing.push({ title: presentation?.title || 'Untitled', note: notes, ts: Date.now() });
      localStorage.setItem('paathshala-notes', JSON.stringify(existing));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch {
      /* storage unavailable */
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notes-modal-title"
        className="w-full max-w-2xl max-h-[85vh] flex flex-col bg-surface-container-low rounded-2xl shadow-2xl border border-surface-container-highest/20"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-container-highest/30">
          <h3 id="notes-modal-title" className="font-title-sm text-title-sm text-on-surface flex items-center gap-2">
            <StickyNote className="w-5 h-5 text-primary" /> Study Notes
          </h3>
          <div className="flex items-center gap-1.5">
            {/* preview / raw toggle */}
            <button
              onClick={() => setMode((m) => (m === 'preview' ? 'raw' : 'preview'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-label-sm font-semibold hover:bg-surface-container-highest transition-colors"
              title="Toggle markdown preview"
            >
              {mode === 'preview' ? <FileCode2 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {mode === 'preview' ? 'Raw' : 'Preview'}
            </button>
            <button
              onClick={save}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-label-sm font-semibold hover:bg-surface-container-highest transition-colors"
              title="Save notes (client-side for now, backend sync coming)"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-400" /> : <Save className="w-4 h-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>
            <button
              onClick={() => downloadMarkdown(notes, presentation?.title || 'notes')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-label-sm font-semibold hover:bg-surface-container-highest transition-colors"
              title="Export as .md"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container transition-colors"
              title="Copy notes"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button onClick={onClose} aria-label="Close notes" className="w-8 h-8 rounded-full hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {mode === 'preview' ? (
            <Markdown content={notes} />
          ) : (
            <pre className="font-mono text-[13px] text-on-surface-variant whitespace-pre-wrap leading-relaxed">{notes}</pre>
          )}
        </div>
      </div>
    </div>
  );
}
