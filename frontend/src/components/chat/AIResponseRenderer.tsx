import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import ResponseRenderer from '../ai-response/ResponseRenderer';
import { parsePresentation } from '../ai-response/parsePresentation';

interface AIResponseRendererProps {
  content: string;
  /** True while the response is still streaming in; keeps the presentation skeleton until done. */
  streaming?: boolean;
}

export default function AIResponseRenderer({ content, streaming = false }: AIResponseRendererProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const parsedContent = useMemo(() => {
    let text = content;
    const thinkingMatch = text.match(/<thinking>([\s\S]*?)<\/thinking>/);
    let reasoning = null;
    
    if (thinkingMatch) {
      reasoning = thinkingMatch[1];
      text = text.replace(/<thinking>[\s\S]*?<\/thinking>/, '').trim();
    } else {
      // Handle incomplete thinking tags in streaming
      const partialThinkingMatch = text.match(/<thinking>([\s\S]*)$/);
      if (partialThinkingMatch) {
        reasoning = partialThinkingMatch[1];
        text = text.replace(/<thinking>[\s\S]*$/, '').trim();
      }
    }
    
    return { text, reasoning };
  }, [content]);

  const slides = useMemo(() => {
    const text = parsedContent.text;
    // If the content is short, just render it as one slide
    if (text.length < 500) {
      return [text];
    }

    // Split by horizontal rules
    const hrSplit = text.split(/\n---\n|\n___\n|\n\*\*\*\n/);
    if (hrSplit.length > 1) {
      return hrSplit.map(s => s.trim()).filter(Boolean);
    }

    // Fallback: Split by H1 or H2 if there are multiple
    // We use a regex lookahead to keep the heading with the content
    const headingSplit = text.split(/(?=\n##? )/);
    if (headingSplit.length > 2) {
      return headingSplit.map(s => s.trim()).filter(Boolean);
    }

    // Fallback: chunk by double newlines if extremely long (e.g. 1500 chars)
    if (text.length > 1500) {
      const chunks = text.split(/\n\n/);
      const combinedChunks: string[] = [];
      let currentChunk = '';
      
      chunks.forEach(chunk => {
        if ((currentChunk + '\n\n' + chunk).length > 800) {
          if (currentChunk) combinedChunks.push(currentChunk.trim());
          currentChunk = chunk;
        } else {
          currentChunk = currentChunk ? currentChunk + '\n\n' + chunk : chunk;
        }
      });
      if (currentChunk) combinedChunks.push(currentChunk.trim());
      
      if (combinedChunks.length > 1) return combinedChunks;
    }

    // Default to a single slide
    return [text];
  }, [parsedContent.text]);

  // Ensure currentSlide is valid if content changes
  React.useEffect(() => {
    if (currentSlide >= slides.length) {
      setCurrentSlide(0);
    }
  }, [slides.length, currentSlide]);

  // Structured presentation responses are handled by ResponseRenderer.
  const presentation = useMemo(
    () => parsePresentation(content, { isDone: !streaming }),
    [content, streaming],
  );
  if (presentation.status !== 'none') {
    return <ResponseRenderer content={content} streaming={streaming} />;
  }

  if (slides.length <= 1) {
    return (
      <div className="flex flex-col space-y-2">
        {parsedContent.reasoning && (
          <details className="group bg-surface-container-highest/30 rounded-lg border border-outline-variant/20 overflow-hidden">
            <summary className="cursor-pointer px-4 py-2 text-label-md font-label-md text-primary flex items-center gap-2 hover:bg-surface-container-highest/50 transition-colors">
              <span className="material-symbols-outlined text-[18px] group-open:rotate-180 transition-transform">keyboard_arrow_down</span>
              AI Reasoning Process
            </summary>
            <div className="p-4 pt-2 text-body-sm text-on-surface-variant font-mono whitespace-pre-wrap">
              {parsedContent.reasoning}
            </div>
          </details>
        )}
        <div className="prose prose-invert prose-p:leading-relaxed max-w-none prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-outline-variant/20">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{slides[0] || parsedContent.text}</ReactMarkdown>
        </div>
      </div>
    );
  }

  const handlePrev = () => setCurrentSlide(prev => Math.max(0, prev - 1));
  const handleNext = () => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1));

  return (
    <div className="flex flex-col space-y-4">
      {parsedContent.reasoning && (
        <details className="group bg-surface-container-highest/30 rounded-lg border border-outline-variant/20 overflow-hidden">
          <summary className="cursor-pointer px-4 py-2 text-label-md font-label-md text-primary flex items-center gap-2 hover:bg-surface-container-highest/50 transition-colors">
            <span className="material-symbols-outlined text-[18px] group-open:rotate-180 transition-transform">keyboard_arrow_down</span>
            AI Reasoning Process
          </summary>
          <div className="p-4 pt-2 text-body-sm text-on-surface-variant font-mono whitespace-pre-wrap max-h-[300px] overflow-y-auto">
            {parsedContent.reasoning}
          </div>
        </details>
      )}
      <div className="relative overflow-hidden bg-surface-container-lowest rounded-xl border border-surface-container-highest/50 p-6 min-h-[250px] shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="prose prose-invert prose-p:leading-relaxed max-w-none prose-pre:bg-surface-container-high prose-pre:border prose-pre:border-outline-variant/20"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {slides[currentSlide]}
            </ReactMarkdown>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide Navigation */}
      <div className="flex items-center justify-between px-2 pt-2 border-t border-surface-container-highest/30">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-50 disabled:hover:bg-transparent font-label-md text-label-md"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        
        <div className="flex items-center gap-1.5">
          {slides.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-2 h-2 rounded-full transition-colors ${idx === currentSlide ? 'bg-primary' : 'bg-surface-container-highest'}`}
            />
          ))}
          <span className="font-label-sm text-label-sm text-on-surface-variant ml-2">
            Slide {currentSlide + 1} / {slides.length}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={currentSlide === slides.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-50 disabled:hover:bg-transparent font-label-md text-label-md"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
