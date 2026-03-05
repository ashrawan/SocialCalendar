import React, { useState, useEffect } from 'react';
import { X, Share2, Download, Upload, Link as LinkIcon, Check, Copy, Globe, Shield, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Post } from '../types';
import LZString from 'lz-string';

interface SharePanelProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onImport: (posts: Post[]) => void;
}

export const SharePanel: React.FC<SharePanelProps> = ({ isOpen, onClose, posts, onImport }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const data = JSON.stringify(posts);
      const compressed = LZString.compressToEncodedURIComponent(data);
      const url = new URL(window.location.href);
      url.searchParams.set('share', compressed);
      setShareUrl(url.toString());
    }
  }, [isOpen, posts]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportFile = () => {
    const data = JSON.stringify(posts, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `social-sync-board-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const importedPosts = JSON.parse(content);
        if (Array.isArray(importedPosts)) {
          onImport(importedPosts);
          onClose();
        } else {
          throw new Error('Invalid file format');
        }
      } catch (err) {
        setImportError('Failed to import file. Make sure it is a valid SocialSync JSON file.');
      }
    };
    reader.readAsText(file);
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] shadow-2xl z-[70] rounded-t-[32px] p-8 max-w-2xl mx-auto text-[var(--text-primary)]"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-2xl font-serif font-bold italic">Share Board</h2>
                <p className="text-xs font-mono opacity-50 mt-1 uppercase tracking-widest">Direct & Offline Sharing</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-[var(--text-primary)]/5 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Share Link */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Direct Share Link</label>
                <div className="relative">
                  <LinkIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-30" />
                  <input 
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full pl-12 pr-24 py-4 bg-[var(--text-primary)]/[0.02] border-none rounded-2xl text-xs focus:ring-2 focus:ring-[var(--text-primary)]/5 text-[var(--text-primary)] truncate"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] opacity-40 leading-relaxed italic">
                  * This link contains your entire board data. Anyone with this link can view and import your plan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export */}
                <button 
                  onClick={handleExportFile}
                  className="p-6 bg-[var(--text-primary)]/[0.02] border border-[var(--border)] rounded-[24px] hover:bg-[var(--text-primary)]/[0.05] transition-all text-left flex flex-col gap-4 group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                    <Download size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Export Offline File</h3>
                    <p className="text-[10px] opacity-40 font-mono uppercase tracking-tight mt-1">Download as .json board</p>
                  </div>
                </button>

                {/* Import */}
                <label className="p-6 bg-[var(--text-primary)]/[0.02] border border-[var(--border)] rounded-[24px] hover:bg-[var(--text-primary)]/[0.05] transition-all text-left flex flex-col gap-4 group cursor-pointer">
                  <input 
                    type="file" 
                    accept=".json" 
                    onChange={handleImportFile}
                    className="hidden" 
                  />
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Import Board File</h3>
                    <p className="text-[10px] opacity-40 font-mono uppercase tracking-tight mt-1">Load from .json file</p>
                  </div>
                </label>
              </div>

              {importError && (
                <div className="p-4 bg-red-500/10 text-red-600 rounded-xl flex items-center gap-3 text-xs border border-red-500/20">
                  <AlertCircle size={16} />
                  {importError}
                </div>
              )}

              <div className="p-5 bg-blue-500/10 rounded-3xl border border-blue-500/20 space-y-3">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                  <Shield size={14} />
                  Privacy Note
                </div>
                <p className="text-[10px] text-blue-600/70 leading-relaxed">
                  SocialSync is a local-first application. Your data stays in your browser. 
                  Sharing via link or file is a direct way to transfer your board without a central server.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
