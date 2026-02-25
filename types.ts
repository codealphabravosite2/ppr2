export enum AppState {
  DASHBOARD = 'DASHBOARD',
  COLLECTION_VIEW = 'COLLECTION_VIEW',
  CREATE_NOTE = 'CREATE_NOTE',
  READING = 'READING',
}

export enum ThemeMode {
  LIGHT = 'LIGHT',
  SEPIA = 'SEPIA',
  DARK = 'DARK',
}

export enum FontFamily {
  SERIF = 'font-serif',
  SANS = 'font-sans',
  MONO = 'font-mono',
}

export interface ReadingSettings {
  theme: ThemeMode;
  fontSize: number;
  fontFamily: FontFamily;
  lineHeight: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  isThinking?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  color: string;
  noteCount: number;
}

export interface Folder {
  id: string;
  name: string;
  collectionId: string;
  createdAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  collectionId: string;
  folderId?: string;
  createdAt: number;
}

export type RewriteStyle = 'simplify' | 'engaging' | 'sarcastic' | 'concise' | 'pirate';