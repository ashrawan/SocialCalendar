import React, { useState, useEffect } from 'react';
import { Calendar } from './components/Calendar';
import { ListView } from './components/ListView';
import { PostEditor } from './components/PostEditor';
import { SyncPanel } from './components/SyncPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SampleGenerator } from './components/SampleGenerator';
import { PlanModal } from './components/PlanModal';
import { usePosts } from './hooks/usePosts';
import { SharePanel } from './components/SharePanel';
import { Post } from './types';
import { format, parseISO, isSameDay } from 'date-fns';
import { exportPostsToExcel, copyPostsToClipboard } from './lib/export';
import { RefreshCw, Plus, LayoutGrid, Settings, Sparkles, List, FileSpreadsheet, Copy, Check, Calendar as CalendarIcon, Moon, Sun, Share2 } from 'lucide-react';
import LZString from 'lz-string';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'calendar' | 'list'>('calendar');
  const [selectedPost, setSelectedPost] = useState<Partial<Post> | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSampleOpen, setIsSampleOpen] = useState(false);
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved as 'light' | 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const { posts, savedPlans, loading, savePost, deletePost, replacePosts, bulkSave, deletePlan, refresh } = usePosts();

  // Handle share link on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareData = params.get('share');
    if (shareData) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(shareData);
        if (decompressed) {
          const importedPosts = JSON.parse(decompressed);
          if (Array.isArray(importedPosts) && confirm('A shared board was detected. Would you like to import it? This will replace your current local data.')) {
            replacePosts(importedPosts);
            // Clear the URL param
            const url = new URL(window.location.href);
            url.searchParams.delete('share');
            window.history.replaceState({}, '', url.toString());
          }
        }
      } catch (err) {
        console.error('Failed to parse share data:', err);
      }
    }
  }, [loading]);

  const handleCopy = () => {
    copyPostsToClipboard(posts);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectDay = (date: Date) => {
    setSelectedPost({ date: format(date, 'yyyy-MM-dd'), time: '09:00', platforms: ['twitter'], status: 'ready' });
    setIsEditorOpen(true);
  };

  const handleEditPost = (post: Post) => {
    setSelectedPost(post);
    setIsEditorOpen(true);
  };

  const handleSync = async (importedPosts: Post[], replace: boolean = true) => {
    if (replace) {
      replacePosts(importedPosts);
    } else {
      bulkSave(importedPosts);
    }
  };

  const handleGenerate = (generatedPosts: Post[], planName?: string) => {
    bulkSave(generatedPosts, planName);
  };

  return (
    <div className="h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-black selection:text-white font-sans flex flex-col overflow-hidden transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="h-16 bg-[var(--bg-secondary)]/80 backdrop-blur-md border-b border-[var(--border)] z-30 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--text-primary)] rounded-lg flex items-center justify-center">
              <LayoutGrid size={18} className="text-[var(--bg-primary)]" />
            </div>
            <span className="font-serif font-black italic tracking-tight text-xl">SocialSync</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-[var(--text-primary)]/5 p-1 rounded-xl">
            <button 
              onClick={() => setView('calendar')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                view === 'calendar' ? "bg-[var(--bg-secondary)] shadow-sm opacity-100" : "opacity-40 hover:opacity-100"
              )}
            >
              <LayoutGrid size={12} />
              Calendar
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                view === 'list' ? "bg-[var(--bg-secondary)] shadow-sm opacity-100" : "opacity-40 hover:opacity-100"
              )}
            >
              <List size={12} />
              List View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-[var(--text-primary)]/5 rounded-xl transition-all"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button 
            onClick={() => setIsPlanOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--text-primary)]/5 text-[var(--text-primary)]/70 text-xs font-bold hover:bg-[var(--text-primary)]/10 transition-all border border-[var(--border)]"
          >
            <CalendarIcon size={14} />
            Plan
          </button>
          
          <button 
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs font-medium hover:bg-[var(--text-primary)]/5 transition-all"
          >
            <Share2 size={14} />
            Share
          </button>
          
          <button 
            onClick={() => setIsSyncOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-xs font-medium hover:bg-[var(--text-primary)]/5 transition-all"
          >
            <RefreshCw size={14} />
            Sync Sheet
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-[var(--text-primary)]/5 rounded-xl transition-all"
          >
            <Settings size={20} />
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {view === 'calendar' ? (
          <Calendar 
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            posts={posts}
            onSelectDay={handleSelectDay}
            onEditPost={handleEditPost}
          />
        ) : (
          <ListView 
            posts={posts}
            onEditPost={handleEditPost}
          />
        )}

        {/* Floating Action Button for List View */}
        {view === 'list' && (
          <button 
            onClick={() => handleSelectDay(new Date())}
            className="fixed bottom-8 right-8 w-14 h-14 bg-[var(--text-primary)] text-[var(--bg-primary)] rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
          >
            <Plus size={24} />
          </button>
        )}
      </main>

      {/* Overlays */}
      <PostEditor 
        post={selectedPost}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedPost(null);
        }}
        onSave={savePost}
        onDelete={deletePost}
      />

      <SyncPanel 
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        onSync={handleSync}
      />

      <SharePanel 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        posts={posts}
        onImport={(importedPosts) => {
          if (confirm('Are you sure you want to import this board? It will replace your current local data.')) {
            replacePosts(importedPosts);
          }
        }}
      />

      <SettingsPanel 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        savedPlans={savedPlans}
        onDeletePlan={deletePlan}
      />

      <SampleGenerator 
        isOpen={isSampleOpen}
        onClose={() => setIsSampleOpen(false)}
        onGenerate={handleGenerate}
      />

      <PlanModal 
        isOpen={isPlanOpen}
        onClose={() => setIsPlanOpen(false)}
        posts={posts}
        onOpenAI={() => setIsSampleOpen(true)}
      />

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[var(--bg-primary)] z-[100] flex flex-col items-center justify-center gap-4"
          >
            <RefreshCw size={40} className="animate-spin opacity-20" />
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">Initializing Workspace</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
