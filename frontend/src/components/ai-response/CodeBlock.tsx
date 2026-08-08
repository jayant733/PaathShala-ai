import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';

/** Flatten arbitrary React children (highlighted spans) back into plain source text. */
function extractText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    const children = (node as { props?: { children?: ReactNode } }).props?.children;
    if (children != null) return extractText(children);
  }
  return '';
}

const LANG_LABELS: Record<string, string> = {
  ts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  jsx: 'jsx',
  sh: 'shell',
  bash: 'bash',
  shell: 'shell',
  py: 'python',
  yml: 'yaml',
  yaml: 'yaml',
  html: 'html',
  css: 'css',
  json: 'json',
};

interface CodeBlockProps {
  className?: string;
  /** The already-highlighted <code> children emitted by react-markdown. */
  highlighted?: ReactNode;
  showLineNumbers?: boolean;
}

/**
 * Premium glass code block: frosted surface, language badge, copy button and
 * (optional) line numbers. The highlighted token spans are passed straight
 * through from react-markdown; token colors come from the .hljs theme in
 * index.css.
 */
export default function CodeBlock({ className, highlighted, showLineNumbers = true }: CodeBlockProps) {
  const raw = extractText(highlighted);
  const lang = /language-([\w-]+)/.exec(className || '')?.[1] || 'text';
  const label = LANG_LABELS[lang] || lang;
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(raw);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable (e.g. non-secure context) — ignore */
    }
  };

  // Line numbers align with the code because both share the same 22px line
  // height; trailing whitespace is trimmed so the count matches visual lines.
  const lineCount = Math.max(1, raw.replace(/\s+$/, '').split('\n').length);

  return (
    <div className="glass my-4 overflow-hidden rounded-xl">
      {/* Header: language badge + copy */}
      <div className="flex items-center justify-between gap-3 border-b border-outline-variant/30 bg-surface-container-high/50 px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant">{label}</span>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy code"
          title="Copy code"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] font-medium text-on-surface-variant transition-colors hover:text-on-surface"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Body: optional line-number gutter + highlighted code */}
      <pre className="m-0 flex overflow-x-auto p-4 text-[13px] leading-[22px]">
        {showLineNumbers && (
          <span aria-hidden="true" className="select-none pr-4 font-mono text-right text-on-surface-variant/40">
            {Array.from({ length: lineCount }, (_, i) => (
              <span key={i} className="block leading-[22px]">{i + 1}</span>
            ))}
          </span>
        )}
        <code className="hljs whitespace-pre font-mono leading-[22px]">{highlighted}</code>
      </pre>
    </div>
  );
}
