export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
}

export type DifficultyLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface Article {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string; // The full text
  topic: Topic;
  difficulty: DifficultyLevel;
}

export interface SentenceAnalysis {
  original: string;
  translation: string;
  isComplex: boolean;
  grammarNotes?: string; // For long/difficult sentences
}

export interface GrammarPoint {
  point: string; // e.g., "Present Perfect Continuous"
  explanation: string;
  sentences: string[]; // List of original sentences from text matching this point
}

export interface ArticleAnalysis {
  sentences: SentenceAnalysis[];
  grammarPoints: GrammarPoint[];
}

export interface VocabItem {
  id: string;
  word: string;
  translation: string; // Chinese translation
  explanation: string; // Fun, friend-like explanation
  visualPrompt: string; // Description for generating an image
  generatedImage?: string; // Base64 of generated image (optional)
  examples: {
    english: string;
    chinese: string;
  }[];
  addedAt: number;
}

export interface UserHistory {
  [date: string]: Article;
}

export enum AppState {
  LOADING = 'LOADING',
  TOPIC_SELECTION = 'TOPIC_SELECTION',
  READING = 'READING',
  ANALYZING = 'ANALYZING', // Generating analysis
  ERROR = 'ERROR'
}

export type AppView = 'READING' | 'NOTEBOOK' | 'ANALYSIS' | 'SETTINGS';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export enum NotebookMode {
  LIST = 'LIST',
  FLASHCARD = 'FLASHCARD',
  STORY = 'STORY'
}

export interface AudioState {
  isPlaying: boolean;
  isLoading: boolean;
  hasAudio: boolean;
}