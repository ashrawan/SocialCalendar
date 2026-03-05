import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Link as LinkIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Post, Platform } from '../types';
import { format, parse, isValid } from 'date-fns';

interface SyncPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSync: (posts: Post[], replace: boolean) => void;
}

export const SyncPanel: React.FC<SyncPanelProps> = ({ isOpen, onClose, onSync }) => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [replace, setReplace] = useState(true);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUrl = localStorage.getItem('google_sheet_url');
    const savedSync = localStorage.getItem('google_sheet_last_sync');
    if (savedUrl) setSheetUrl(savedUrl);
    if (savedSync) setLastSynced(savedSync);
  }, []);

  const convertToCsvUrl = (url: string) => {
    if (!url) return '';
    const trimmedUrl = url.trim();
    
    // If it's already a CSV export URL, return it
    if (trimmedUrl.includes('/export?format=csv') || trimmedUrl.includes('/pub?output=csv')) return trimmedUrl;
    
    // Handle "Published to web" URLs
    // Example: https://docs.google.com/spreadsheets/d/e/2PACX-1v.../pubhtml
    if (trimmedUrl.includes('/pubhtml') || trimmedUrl.includes('/pub?')) {
      const pubMatch = trimmedUrl.match(/\/spreadsheets\/d\/e\/([a-zA-Z0-9-_]+)/);
      if (pubMatch && pubMatch[1]) {
        return `https://docs.google.com/spreadsheets/d/e/${pubMatch[1]}/pub?output=csv`;
      }
    }

    // Handle standard Google Sheets URLs (including /u/0/ prefixes)
    // Example: https://docs.google.com/spreadsheets/d/12345/edit#gid=67890
    // Example: https://docs.google.com/spreadsheets/u/0/d/12345/edit
    const idMatch = trimmedUrl.match(/\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9-_]+)/);
    if (idMatch && idMatch[1]) {
      const id = idMatch[1];
      const gidMatch = trimmedUrl.match(/[#&?]gid=([0-9]+)/);
      const gid = gidMatch ? gidMatch[1] : '0';
      // Using gviz/tq endpoint which is often more robust than /export
      return `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&gid=${gid}`;
    }
    
    // Fallback: If it's just an ID
    if (/^[a-zA-Z0-9-_]{40,}$/.test(trimmedUrl)) {
      return `https://docs.google.com/spreadsheets/d/${trimmedUrl}/gviz/tq?tqx=out:csv&gid=0`;
    }
    
    return trimmedUrl;
  };

  const parseCSV = (text: string) => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          currentField += '"';
          i++;
        } else if (char === '"') {
          inQuotes = false;
        } else {
          currentField += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ',') {
          currentRow.push(currentField);
          currentField = '';
        } else if (char === '\r' || char === '\n') {
          currentRow.push(currentField);
          if (currentRow.some(f => f.trim() !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentField = '';
          if (char === '\r' && nextChar === '\n') {
            i++;
          }
        } else {
          currentField += char;
        }
      }
    }
    
    if (currentRow.length > 0 || currentField !== '') {
      currentRow.push(currentField);
      if (currentRow.some(f => f.trim() !== '')) {
        rows.push(currentRow);
      }
    }
    
    return rows;
  };

  const handleSync = async () => {
    if (!sheetUrl) return;
    
    setStatus('syncing');
    setError(null);
    
    const finalUrl = convertToCsvUrl(sheetUrl);
    localStorage.setItem('google_sheet_url', sheetUrl);

    try {
      if (!finalUrl.startsWith('https://docs.google.com/spreadsheets/')) {
        throw new Error('Invalid Google Sheets URL. Please copy the full URL from your browser address bar.');
      }

      console.log('Syncing from:', finalUrl);
      const res = await fetch(finalUrl);
      if (!res.ok) {
        if (res.status === 400) {
          throw new Error(`Bad Request (400). This usually means the Sheet ID is invalid or the sheet has restricted access. Ensure you copied the FULL URL and the sheet is shared as "Anyone with the link can view".`);
        }
        if (res.status === 404) throw new Error('Sheet not found (404). Check the URL and make sure the sheet exists.');
        if (res.status === 401 || res.status === 403) throw new Error('Access denied (401/403). Make sure the sheet is shared with "Anyone with the link can view".');
        throw new Error(`Failed to fetch sheet (Status: ${res.status}).`);
      }
      
      const csvText = await res.text();
      const rows = parseCSV(csvText);
      
      if (rows.length < 2) throw new Error('Sheet is empty or missing data rows.');
      
      const headers = rows[0].map(h => h.trim().toLowerCase());
      const dataRows = rows.slice(1);

      const importedPosts: Post[] = dataRows.map((values, idx) => {
        const row: any = {};
        headers.forEach((h, i) => { row[h] = values[i]; });

        // Normalize date to YYYY-MM-DD
        let normalizedDate = row.date || '';
        if (normalizedDate) {
          const formats = ['yyyy-MM-dd', 'MM/dd/yyyy', 'dd/MM/yyyy', 'MM-dd-yyyy', 'dd-MM-yyyy', 'yyyy/MM/dd'];
          let parsedDate: Date | null = null;
          
          for (const fmt of formats) {
            const d = parse(normalizedDate, fmt, new Date());
            if (isValid(d)) {
              parsedDate = d;
              break;
            }
          }
          
          if (parsedDate) {
            normalizedDate = format(parsedDate, 'yyyy-MM-dd');
          }
        }

        // Handle both 'platform' and 'platforms' columns
        const platformsStr = row.platforms || row.platform || 'twitter';
        const platforms = platformsStr.split(/[;,]/).map((p: string) => p.trim().toLowerCase()).filter(Boolean) as Platform[];

        return {
          id: row.id || `import-${idx}-${Date.now()}`,
          date: normalizedDate,
          time: row.time || '09:00',
          platforms: platforms.length > 0 ? platforms : ['twitter'] as Platform[],
          content: row.content || '',
          status: (row.status || 'ready').toLowerCase() as 'ready' | 'published',
        };
      }).filter(p => p.date && p.content);

      if (importedPosts.length === 0) {
        throw new Error('No valid posts found. Ensure columns are named: Date, Time, Platforms, Content.');
      }

      const now = new Date().toISOString();
      localStorage.setItem('google_sheet_last_sync', now);
      setLastSynced(now);
      onSync(importedPosts, replace);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error('Sync Error:', err);
      setStatus('error');
      setError(err.message || 'Failed to sync. Check your internet and sheet sharing settings.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] shadow-2xl z-50 rounded-t-[32px] p-8 max-w-2xl mx-auto text-[var(--text-primary)]"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-2xl font-serif font-bold italic">Google Sheets Sync</h2>
                <p className="text-xs font-mono opacity-50 mt-1 uppercase tracking-widest">Link your content calendar</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--text-primary)]/5 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">CSV Export URL</label>
                <div className="relative">
                  <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                  <input 
                    type="url"
                    placeholder="Paste your Google Sheet URL here..."
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[var(--text-primary)]/[0.02] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--text-primary)]/5 placeholder:opacity-30 text-[var(--text-primary)]"
                  />
                </div>
                <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 space-y-2">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">How to sync:</p>
                  <ol className="text-[10px] text-blue-600/70 space-y-1 list-decimal ml-4">
                    <li>Open your Google Sheet</li>
                    <li>Click <span className="font-bold">File &gt; Share &gt; Share with others</span></li>
                    <li>Set General access to <span className="font-bold">"Anyone with the link"</span></li>
                    <li>Copy the URL from your browser and paste it above</li>
                  </ol>
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed">
                  Expected columns: <code className="bg-[var(--text-primary)]/5 px-1 rounded">Date</code>, <code className="bg-[var(--text-primary)]/5 px-1 rounded">Time</code>, <code className="bg-[var(--text-primary)]/5 px-1 rounded">Platforms</code>, <code className="bg-[var(--text-primary)]/5 px-1 rounded">Content</code>
                </p>
                {lastSynced && (
                  <p className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest">
                    Last Synced: {format(new Date(lastSynced), 'MMM d, yyyy HH:mm')}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-[var(--text-primary)]/[0.02] rounded-2xl">
                <div className="flex flex-col">
                  <span className="text-sm font-bold">Replace current plan</span>
                  <span className="text-[10px] opacity-40 font-mono uppercase tracking-tight">Clear local posts before sync</span>
                </div>
                <button 
                  onClick={() => setReplace(!replace)}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    replace ? "bg-[var(--text-primary)]" : "bg-[var(--text-primary)]/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-[var(--bg-secondary)] transition-all",
                    replace ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-500/10 rounded-2xl border border-red-500/20">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-red-600">Clear All Local Posts</span>
                  <span className="text-[10px] text-red-600/60 font-mono uppercase tracking-tight">Permanently delete all local data</span>
                </div>
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to clear all local posts? This cannot be undone.')) {
                      onSync([], true);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-red-600 transition-all"
                >
                  Clear
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 text-red-600 rounded-xl flex items-center gap-3 text-xs border border-red-500/20">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {status === 'success' && (
                <div className="p-4 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center gap-3 text-xs border border-emerald-500/20">
                  <CheckCircle2 size={16} />
                  Sync successful! Posts imported.
                </div>
              )}

              <button 
                onClick={handleSync}
                disabled={status === 'syncing' || !sheetUrl}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl",
                  status === 'syncing' ? "bg-[var(--text-primary)]/10 text-[var(--text-primary)]/30 cursor-not-allowed" : "bg-[var(--text-primary)] text-[var(--bg-primary)] hover:bg-neutral-800 shadow-black/10"
                )}
              >
                <RefreshCw size={20} className={cn(status === 'syncing' && "animate-spin")} />
                {status === 'syncing' ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
