import type {
  AnswerType,
  Presentation,
  PresentationParseResult,
} from './types';

const OPEN_RE = /%%%PAATHSHALA:([a-z_]+)%%%/;
const CLOSE_RE = /%%%END%%%/;

const VALID_TYPES: AnswerType[] = [
  'architecture',
  'concept',
  'code',
  'comparison',
  'learning',
  'system_design',
  'tutorial',
  'research',
  'roadmap',
  'debugging',
];

export interface ParseOptions {
  /** True once the stream has finished emitting tokens. Defaults to true. */
  isDone?: boolean;
}

/**
 * Parse an optional PaathShala presentation envelope from a (possibly still
 * streaming) response string.
 *
 * - opener seen but not yet closed  -> `streaming` (kept while tokens stream)
 * - opener + valid JSON             -> `parsed`
 * - opener + malformed/incomplete envelope, once the stream is finished
 *                                     -> `invalid` (markdown with envelope stripped)
 * - no opener                       -> `none`
 *
 * While `isDone` is false the parser stays in `streaming` and never resolves to
 * `invalid`, so a temporarily truncated envelope (JSON still being assembled,
 * close tag not yet emitted) does not prematurely flip the UI to markdown
 * mid-stream. Pass `{ isDone: false }` from the live streaming bubble; finished
 * messages default to `isDone: true` and resolve a malformed envelope to a
 * markdown fallback instead of getting stuck on a skeleton.
 */
export function parsePresentation(
  content: string,
  opts?: ParseOptions,
): PresentationParseResult {
  const text = content || '';
  const isDone = opts?.isDone !== false;

  const open = text.match(OPEN_RE);
  if (!open) return { status: 'none' };

  const rawType = open[1];
  const type: AnswerType = VALID_TYPES.includes(rawType as AnswerType)
    ? (rawType as AnswerType)
    : 'default';

  const close = text.match(CLOSE_RE);
  if (!close) {
    // Envelope was opened but never closed.
    if (isDone) {
      // Stream finished with an incomplete envelope. Drop the malformed
      // envelope (and any partial content after the opener) so we fall back to
      // the surrounding markdown instead of leaving a permanent skeleton.
      const markdown = text.slice(0, open.index).trim();
      return { status: 'invalid', markdown: markdown || text };
    }
    // Still streaming — the close tag may not have arrived yet.
    return { status: 'streaming', type };
  }

  const start = open.index! + open[0].length;
  const end = close.index!;
  const jsonText = text.slice(start, end).trim();

  let presentation: Presentation;
  try {
    presentation = parseJson(jsonText);
  } catch (e) {
    if (!isDone) return { status: 'streaming', type }; // JSON may be mid-stream truncated
    // Strip the whole envelope so the surrounding markdown renders cleanly.
    const markdown = text.replace(/%%%PAATHSHALA:[a-z_]+%%%[\s\S]*?%%%END%%%/, '').trim();
    return { status: 'invalid', markdown: markdown || text };
  }

  // Keep the trailing prose after the envelope for a normal markdown read-out.
  const trailing = text.slice(close.index! + close[0].length).trim();

  return {
    status: 'parsed',
    type,
    presentation: {
      ...presentation,
      answerType: type,
      markdown: presentation.content || trailing || undefined,
    },
  };
}

function parseJson(raw: string): Presentation {
  // The model may wrap the JSON in a markdown code fence — strip it.
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```$/);
  if (fence) s = fence[1].trim();

  const parsed = JSON.parse(s);
  return parsed as Presentation;
}
