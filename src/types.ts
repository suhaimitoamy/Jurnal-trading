export type MaterialStatus = 'Belum dibaca' | 'Sedang dipelajari' | 'Selesai' | 'Favorit' | 'Arsip';
export type MaterialType = 'Video' | 'Gambar' | 'PDF' | 'Markdown' | 'TXT' | 'Word' | 'Excel' | 'PowerPoint' | 'Link' | 'Catatan manual';

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  subcategoryId: string;
  tags: string[];
  status: MaterialStatus;
  type: MaterialType;
  folderId?: string;
  content?: string; 
  fileBlob?: Blob; 
  fileName?: string;
  url?: string; 
  createdAt: number;
  lastOpenedAt?: number;
  progress: number;
}

export type TradeResult = 'Win' | 'Loss' | 'BE' | 'No Entry';
export type TradeSession = 'Asia' | 'London' | 'New York';

export interface TradeJournal {
  id: string;
  pair: string;
  date: number;
  session: TradeSession;
  setup: string;
  entryPrice?: number;
  slPrice?: number;
  tpPrice?: number;
  riskAmount?: number;
  rewardAmount?: number;
  lotSize?: number;
  result?: TradeResult;
  pnl?: number; 
  screenshot?: Blob; 
  reason?: string;
  emotion?: string;
  mistakes?: string;
  lessons?: string;
  notes?: string;
  tags: string[];
  isArchived?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  image?: string;
}

export type ViewState = 'dashboard' | 'library' | 'media' | 'jurnal' | 'asisten' | 'statistik' | 'pengaturan' | 'arsip' | 'backup';
