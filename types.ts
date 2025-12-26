
export interface BibleBook {
  name: string;
  chapters: number;
}

export interface Verse {
  book_id: string;
  book_name: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleResponse {
  reference: string;
  verses: Verse[];
  text: string;
  translation_id: string;
  translation_name: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UserNote {
  id: string;
  verseRef: string;
  text: string;
  timestamp: number;
}
