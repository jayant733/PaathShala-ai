/** Structured AI presentation types emitted by the tutor prompt. */
export type AnswerType =
  | 'architecture'
  | 'concept'
  | 'code'
  | 'comparison'
  | 'learning'
  | 'system_design'
  | 'tutorial'
  | 'research'
  | 'roadmap'
  | 'debugging'
  | 'default';

/** Learner difficulty level surfaced on a presentation. */
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface PresentationSection {
  title: string;
  content: string;
}

export type CardIcon =
  | 'brain'
  | 'book'
  | 'shield'
  | 'database'
  | 'network'
  | 'cpu'
  | 'rocket'
  | 'lightbulb';

export interface PresentationCard {
  icon?: CardIcon | string;
  title: string;
  description: string;
}

export interface PresentationImage {
  query: string;
  title?: string;
  description?: string;
  imageUrl?: string;
}

export interface PresentationStep {
  title: string;
  description: string;
}

export interface ComparisonData {
  columns: string[];
  rows: string[][];
}

/** A contextual, tap-to-send follow-up the learner can run after a presentation. */
export interface SuggestedAction {
  title: string;
  prompt: string;
}

/** The shape carried inside the %%%PAATHSHALA:{type}%%% ... %%%END%%% envelope. */
export interface Presentation {
  answerType: AnswerType;
  title?: string;
  summary?: string;
  content?: string;
  /** Learner difficulty level (beginner | intermediate | advanced). */
  difficulty?: Difficulty | string;
  /** What the learner should already know. */
  prerequisites?: string[];
  /** Natural follow-on topics. */
  nextTopics?: string[];
  /** The 3-6 core concepts this presentation covers. */
  concepts?: string[];
  sections?: PresentationSection[];
  diagram?: string;
  images?: PresentationImage[];
  cards?: PresentationCard[];
  steps?: PresentationStep[];
  tech?: string[];
  comparison?: ComparisonData;
  /** Context-aware follow-up actions suggested by the model. */
  suggestedActions?: SuggestedAction[];
  /** Raw markdown that followed the envelope (streamed prose). */
  markdown?: string;
}

export interface ParsedPresentation {
  status: 'parsed';
  type: AnswerType;
  presentation: Presentation;
}

export interface StreamingPresentation {
  status: 'streaming';
  type: AnswerType;
}

export interface NoPresentation {
  status: 'none';
}

/** Envelope was present but its JSON could not be parsed — fall back to the
 *  surrounding markdown with the envelope stripped out. */
export interface InvalidPresentation {
  status: 'invalid';
  markdown: string;
}

export type PresentationParseResult =
  | ParsedPresentation
  | StreamingPresentation
  | NoPresentation
  | InvalidPresentation;
