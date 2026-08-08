import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, AlertTriangle, Maximize2, Minimize2, Copy, Check, Download, Info } from 'lucide-react';

interface DiagramRendererProps {
  source: string;
  label?: string;
}

let mermaidPromise: Promise<any> | null = null;
let renderCounter = 0;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: 'dark',
        themeVariables: {
          primaryColor: '#1e2a45',
          primaryTextColor: '#e8eefc',
          primaryBorderColor: '#3b82f6',
          lineColor: '#64748b',
          secondaryColor: '#14202e',
          tertiaryColor: '#0d141d',
          fontSize: '14px',
        },
        flowchart: { curve: 'basis', htmlLabels: true },
        er: { useMaxWidth: true },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

function stripFence(source: string): string {
  const match = source.match(/^```(?:mermaid)?\s*([\s\S]*?)```$/);
  return (match ? match[1] : source).trim();
}

function stableId(source: string): string {
  let hash = 0;
  for (let i = 0; i < source.length; i++) {
    hash = (hash << 5) - hash + source.charCodeAt(i);
    hash |= 0;
  }
  return `paathDiagram_${(hash >>> 0).toString(36)}_${++renderCounter}`;
}

function downloadSvg(svgHtml: string) {
  const blob = new Blob([svgHtml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `diagram-${Date.now()}.svg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Small icon button used in the diagram toolbar. */
function ToolButton({
  onClick,
  title,
  children,
}: {
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-label-sm font-label-sm text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-surface-container-highest/20 bg-surface-container-lowest/40 transition-colors"
    >
      {children}
    </button>
  );
}

/**
 * Renders a Mermaid diagram as an interactive dark-themed SVG with a toolbar
 * (fullscreen, copy source, download SVG). Node hover-tooltips come from
 * mermaid's `click NodeId "explanation"` syntax. Falls back to a readable
 * <pre> block if the diagram fails to parse.
 */
export default function DiagramRenderer({ source, label }: DiagramRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [svgHtml, setSvgHtml] = useState<string>('');
  const [fullscreen, setFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  const code = stripFence(source);

  useEffect(() => {
    let cancelled = false;
    let el: HTMLDivElement | null = containerRef.current;
    setState('loading');
    setSvgHtml('');

    if (!code) {
      setState('error');
      return;
    }

    const id = stableId(code);
    loadMermaid()
      .then(async (mermaid) => {
        const { svg } = await mermaid.render(id, code);
        if (cancelled || !el) return;
        el.innerHTML = svg;
        // Mermaid injects a temp <div id="d"> node we can remove.
        document.getElementById(`dmermaid-${id}`)?.remove();
        setSvgHtml(svg);
        setState('done');
      })
      .catch((e) => {
        console.error('Mermaid render failed', e);
        if (!cancelled) setState('error');
      });

    return () => {
      cancelled = true;
      if (el) el.innerHTML = '';
    };
  }, [code]);

  const copySource = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }, [code]);

  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center gap-3 py-8 text-on-surface-variant">
        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Rendering diagram…
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="rounded-xl border border-outline-variant/20 bg-surface-container-lowest/70 p-4">
        <div className="flex items-center gap-2 text-amber-400 font-label-sm text-label-sm mb-2">
          <AlertTriangle className="w-4 h-4" /> Diagram source
        </div>
        <pre className="font-mono text-[13px] text-on-surface-variant whitespace-pre-wrap leading-relaxed">{code}</pre>
      </div>
    );
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-1.5">
      <ToolButton onClick={() => setFullscreen(true)} title="Fullscreen">
        <Maximize2 className="w-3.5 h-3.5" /> Fullscreen
      </ToolButton>
      <ToolButton onClick={copySource} title="Copy Mermaid source">
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? 'Copied' : 'Copy'}
      </ToolButton>
      <ToolButton onClick={() => downloadSvg(svgHtml)} title="Download as SVG">
        <Download className="w-3.5 h-3.5" /> SVG
      </ToolButton>
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-on-surface-variant/70 bg-surface-container-high/30"
        title="Hover over a highlighted node to see its explanation"
      >
        <Info className="w-3 h-3" /> Hover nodes for details
      </span>
    </div>
  );

  return (
    <div>
      {label && (
        <p className="text-center text-on-surface-variant/70 font-label-sm text-label-sm mb-2">{label}</p>
      )}

      <div className="mb-2 flex justify-end">{toolbar}</div>

      {/* Inline (scrollable on overflow so it never breaks the layout) */}
      <div className="overflow-x-auto">
        <div
          ref={containerRef}
          className="mermaid-diagram [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:mx-auto [&_svg]:min-w-[420px]"
        />
      </div>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between gap-2 p-3 border-b border-surface-container-highest/20">
            <span className="font-label-md text-label-md text-on-surface">{label || 'Diagram'}</span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={copySource}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-label-sm font-semibold hover:bg-primary-container transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy source'}
              </button>
              <button
                onClick={() => downloadSvg(svgHtml)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-label-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                <Download className="w-4 h-4" /> SVG
              </button>
              <button
                onClick={() => setFullscreen(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-high text-on-surface text-label-sm font-semibold hover:bg-surface-container-highest transition-colors"
              >
                <Minimize2 className="w-4 h-4" /> Close
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto flex items-start justify-center p-6">
            <div
              className="max-w-full [&_svg]:max-w-full [&_svg]:h-auto"
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
