export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'threads' | 'tiktok';

export interface Post {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  platforms: Platform[];
  content: string;
  status: 'ready' | 'published';
}

export interface SavedPlan {
  id: string;
  name: string;
  timestamp: string;
  posts: Post[];
}

export interface SyncConfig {
  sheetUrl: string;
  lastSynced: string | null;
  geminiApiKey: string | null;
  geminiModel: string;
}
