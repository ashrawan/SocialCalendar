import React from 'react';
import { Post } from '../types';
import { format, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { CheckCircle2, Clock, Calendar as CalendarIcon, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';

interface ListViewProps {
  posts: Post[];
  onEditPost: (post: Post) => void;
}

export const ListView: React.FC<ListViewProps> = ({ posts, onEditPost }) => {
  const sortedPosts = [...posts].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`).getTime();
    const dateB = new Date(`${b.date}T${b.time}`).getTime();
    return dateA - dateB;
  });

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return 'bg-[#1DA1F2]/10 text-[#1DA1F2] border-[#1DA1F2]/20';
      case 'linkedin': return 'bg-[#0077B5]/10 text-[#0077B5] border-[#0077B5]/20';
      case 'instagram': return 'bg-[#E4405F]/10 text-[#E4405F] border-[#E4405F]/20';
      default: return 'bg-black/5 text-black/60 border-black/10';
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-[var(--bg-primary)] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-4">
        {sortedPosts.length === 0 ? (
          <div className="text-center py-20 opacity-30 text-[var(--text-primary)]">
            <CalendarIcon size={48} className="mx-auto mb-4" />
            <p className="font-serif italic text-xl">No posts scheduled yet.</p>
          </div>
        ) : (
          sortedPosts.map((post) => (
            <motion.div
              layoutId={post.id}
              key={post.id}
              onClick={() => onEditPost(post)}
              className="bg-[var(--bg-secondary)] rounded-2xl p-5 md:p-6 border border-[var(--border)] hover:border-[var(--text-primary)]/10 transition-all cursor-pointer group shadow-sm hover:shadow-md overflow-hidden text-[var(--text-primary)]"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
                <div className="flex items-start md:items-center gap-4 md:gap-6 flex-1 min-w-0">
                  {/* Date Badge */}
                  <div className="flex flex-col items-center justify-center min-w-[50px] h-[50px] md:min-w-[60px] md:h-[60px] bg-[var(--text-primary)]/5 rounded-xl shrink-0">
                    <span className="text-[9px] md:text-[10px] font-mono uppercase opacity-50">{format(parseISO(post.date), 'MMM')}</span>
                    <span className="text-lg md:text-xl font-serif font-black">{format(parseISO(post.date), 'dd')}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <span className="text-xs font-mono opacity-50 flex items-center gap-1">
                        <Clock size={12} />
                        {post.time}
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {post.platforms.map(p => (
                          <span 
                            key={p} 
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-mono uppercase tracking-tight border",
                              getPlatformColor(p)
                            )}
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm font-medium opacity-80 break-words line-clamp-2 md:line-clamp-none">{post.content}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest flex items-center gap-2",
                    post.status === 'published' 
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                      : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                  )}>
                    {post.status === 'published' && <CheckCircle2 size={10} />}
                    {post.status}
                  </div>
                  <button className="p-2 md:opacity-0 group-hover:opacity-100 hover:bg-[var(--text-primary)]/5 rounded-full transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
