import React, { useState } from 'react';
import { Calendar } from './components/Calendar';
import { ListView } from './components/ListView';
import { PostEditor } from './components/PostEditor';
import { SyncPanel } from './components/SyncPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { SampleGenerator } from './components/SampleGenerator';
import { PlanModal } from './components/PlanModal';
import { usePosts } from './hooks/usePosts';
import { Post } from './types';
import { format, parseISO, isSameDay } from 'date-fns';
import { exportPostsToExcel, copyPostsToClipboard } from './lib/export';
import { RefreshCw, Plus, LayoutGrid, Settings, Sparkles, List, FileSpreadsheet, Copy, Check, Calendar as CalendarIcon } from 'lucide-react';
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
  const [copied, setCopied] = useState(false);
  const { posts, savedPlans, loading, savePost, deletePost, replacePosts, bulkSave, deletePlan, refresh } = usePosts();

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
    <div className="h-screen bg-[#f5f5f5] text-black selection:bg-black selection:text-white font-sans flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-black/5 z-30 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <LayoutGrid size={18} className="text-white" />
            </div>
            <span className="font-serif font-black italic tracking-tight text-xl">SocialSync</span>
          </div>
          
          <div className="hidden md:flex items-center gap-1 bg-black/5 p-1 rounded-xl">
            <button 
              onClick={() => setView('calendar')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                view === 'calendar' ? "bg-white shadow-sm opacity-100" : "opacity-40 hover:opacity-100"
              )}
            >
              <LayoutGrid size={12} />
              Calendar
            </button>
            <button 
              onClick={() => setView('list')}
              className={cn(
                "px-4 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2",
                view === 'list' ? "bg-white shadow-sm opacity-100" : "opacity-40 hover:opacity-100"
              )}
            >
              <List size={12} />
              List View
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsPlanOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/5 text-black/70 text-xs font-bold hover:bg-black/10 transition-all border border-black/5"
          >
            <CalendarIcon size={14} />
            Plan
          </button>
          
          <button 
            onClick={() => setIsSyncOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-black/5 text-xs font-medium hover:bg-black/5 transition-all"
          >
            <RefreshCw size={14} />
            Sync Sheet
          </button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 hover:bg-black/5 rounded-xl transition-all"
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
            className="fixed bottom-8 right-8 w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-20"
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
            className="fixed inset-0 bg-white z-[100] flex flex-col items-center justify-center gap-4"
          >
            <RefreshCw size={40} className="animate-spin opacity-20" />
            <p className="font-mono text-[10px] uppercase tracking-widest opacity-40">Initializing Workspace</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
