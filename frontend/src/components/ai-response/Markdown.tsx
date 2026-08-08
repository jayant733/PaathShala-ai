import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import CodeBlock from './CodeBlock';

interface MarkdownProps {
  content: string;
  /** Render premium code blocks (highlighting, copy button, language badge, line
   *  numbers). Defaults to true. Pass `false` to keep the plain renderer so
   *  structured presentation views are unaffected. */
  enhanced?: boolean;
}

/** Shared prose renderer with the app's typography. */
export default function Markdown({ content, enhanced = true }: MarkdownProps) {
  if (!content) return null;
  return (
    <div className="prose prose-invert prose-p:leading-relaxed prose-headings:text-on-surface prose-strong:text-on-surface max-w-none prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant/20 prose-a:text-primary prose-code:text-primary prose-code:before:content-none prose-code:after:content-none markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={enhanced ? [rehypeHighlight] : []}
        components={enhanced ? { pre: PreBlock } : undefined}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

/** Swap fenced `<pre>` blocks for the premium glass code card. */
function PreBlock({ children }: { children?: React.ReactNode }) {
  const code = React.isValidElement(children) ? children : null;
  const props = (code?.props ?? {}) as { className?: string; children?: React.ReactNode };
  return <CodeBlock className={props.className} highlighted={props.children} />;
}
