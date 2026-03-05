import React, { useState, useEffect } from 'react';
import { X, Trash2, Clock, Calendar as CalendarIcon, Save, Check } from 'lucide-react';
import { Post, Platform } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface PostEditorProps {
  post: Partial<Post> | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (post: Post) => void;
  onDelete: (id: string) => void;
}

const PLATFORMS: { id: Platform; label: string }[] = [
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'threads', label: 'Threads' },
  { id: 'tiktok', label: 'TikTok' },
];

export const PostEditor: React.FC<PostEditorProps> = ({ 
  post, 
  isOpen, 
  onClose, 
  onSave,
  onDelete
}) => {
  const [formData, setFormData] = useState<Partial<Post>>({
    platforms: ['twitter'],
    status: 'ready',
    time: '09:00',
    content: '',
  });

  useEffect(() => {
    if (post) {
      setFormData({
        ...post,
        platforms: post.platforms || ['twitter'],
        status: post.status || 'ready',
      });
    }
  }, [post]);

  const togglePlatform = (id: Platform) => {
    const current = formData.platforms || [];
    if (current.includes(id)) {
      setFormData({ ...formData, platforms: current.filter(p => p !== id) });
    } else {
      setFormData({ ...formData, platforms: [...current, id] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.date && formData.content && formData.platforms?.length) {
      onSave({
        id: formData.id || Math.random().toString(36).substr(2, 9),
        date: formData.date,
        time: formData.time || '09:00',
        platforms: formData.platforms,
        content: formData.content,
        status: formData.status || 'ready',
      } as Post);
      onClose();
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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--bg-secondary)] shadow-2xl z-50 flex flex-col text-[var(--text-primary)]"
          >
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-xl font-serif font-bold italic">
                {formData.id ? 'Edit Post' : 'New Post'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-[var(--text-primary)]/5 rounded-full">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Date</label>
                  <div className="relative">
                    <CalendarIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      type="date"
                      required
                      value={formData.date || ''}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full pl-9 pr-4 py-3 bg-[var(--text-primary)]/[0.02] border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--text-primary)]/5 text-[var(--text-primary)]"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Time</label>
                  <div className="relative">
                    <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                    <input 
                      type="time"
                      required
                      value={formData.time || '09:00'}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full pl-9 pr-4 py-3 bg-[var(--text-primary)]/[0.02] border-none rounded-xl text-sm focus:ring-2 focus:ring-[var(--text-primary)]/5 text-[var(--text-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Content</label>
                <textarea 
                  required
                  rows={6}
                  placeholder="What's the plan?"
                  value={formData.content || ''}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-4 bg-[var(--text-primary)]/[0.02] border-none rounded-2xl text-sm focus:ring-2 focus:ring-[var(--text-primary)]/5 resize-none placeholder:opacity-30 text-[var(--text-primary)]"
                />
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Status</label>
                <div className="flex gap-2">
                  {(['ready', 'published'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: s })}
                      className={cn(
                        "flex-1 py-3 rounded-xl border text-[10px] font-mono uppercase tracking-widest transition-all",
                        formData.status === s 
                          ? "bg-[var(--text-primary)] text-[var(--bg-primary)] border-[var(--text-primary)] shadow-lg" 
                          : "bg-[var(--bg-secondary)] border-[var(--border)] hover:border-[var(--text-primary)]/20"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform Selection (Checkboxes) - MOVED TO BOTTOM */}
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">Publish to</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => {
                    const isSelected = formData.platforms?.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlatform(p.id)}
                        className={cn(
                          "p-3 rounded-xl border text-xs font-medium transition-all flex items-center gap-3",
                          isSelected 
                            ? "border-[var(--text-primary)] bg-[var(--text-primary)] text-[var(--bg-primary)] shadow-lg" 
                            : "border-[var(--border)] hover:border-[var(--text-primary)]/20 bg-[var(--bg-secondary)]"
                        )}
                      >
                        <div className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                          isSelected ? "bg-[var(--bg-primary)] border-[var(--bg-primary)]" : "border-[var(--text-primary)]/20"
                        )}>
                          {isSelected && <Check size={12} className="text-[var(--text-primary)]" />}
                        </div>
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-[var(--border)] flex gap-3">
              {formData.id && (
                <button 
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this post?')) {
                      onDelete(formData.id!);
                      onClose();
                    }
                  }}
                  className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button 
                onClick={handleSubmit}
                className="flex-1 bg-[var(--text-primary)] text-[var(--bg-primary)] py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all shadow-xl shadow-black/10"
              >
                <Save size={18} />
                Save Post
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
