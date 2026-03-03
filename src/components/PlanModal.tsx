import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileSpreadsheet, Copy, Sparkles, Check, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Post } from '../types';
import { exportPostsToExcel, copyPostsToClipboard } from '../lib/export';

interface PlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  onOpenAI: () => void;
}

export const PlanModal: React.FC<PlanModalProps> = ({ isOpen, onClose, posts, onOpenAI }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    copyPostsToClipboard(posts);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    exportPostsToExcel(posts);
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
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white shadow-2xl z-[70] rounded-[32px] p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-2xl font-serif font-bold italic">Content Plan</h2>
                <p className="text-xs font-mono opacity-50 mt-1 uppercase tracking-widest">Manage your current schedule</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-3">
              <button 
                onClick={handleExport}
                className="w-full p-4 rounded-2xl bg-black/[0.02] hover:bg-black/[0.05] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <FileSpreadsheet size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">Download Excel</p>
                    <p className="text-[10px] opacity-50 font-mono uppercase tracking-tight">Export full plan to .xlsx</p>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-20 group-hover:opacity-100 transition-all" />
              </button>

              <button 
                onClick={handleCopy}
                className="w-full p-4 rounded-2xl bg-black/[0.02] hover:bg-black/[0.05] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    {copied ? <Check size={24} /> : <Copy size={24} />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{copied ? 'Copied!' : 'Copy to Clipboard'}</p>
                    <p className="text-[10px] opacity-50 font-mono uppercase tracking-tight">Copy formatted summary</p>
                  </div>
                </div>
                <ChevronRight size={16} className="opacity-20 group-hover:opacity-100 transition-all" />
              </button>

              <div className="h-px bg-black/5 my-2" />

              <button 
                onClick={() => {
                  onClose();
                  onOpenAI();
                }}
                className="w-full p-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 transition-all flex items-center justify-between group border border-emerald-100"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm">
                    <Sparkles size={24} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-emerald-900">AI Sample Generator</p>
                    <p className="text-[10px] text-emerald-600/60 font-mono uppercase tracking-tight">Generate new ideas with Gemini</p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-emerald-400" />
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-black/5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase opacity-40">Active Posts</span>
                <span className="font-serif font-bold text-xl">{posts.length}</span>
              </div>
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-neutral-800 transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
