import React from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Post } from '../types';
import { motion } from 'motion/react';

interface CalendarProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  posts: Post[];
  onSelectDay: (date: Date) => void;
  onEditPost: (post: Post) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ 
  currentDate, 
  setCurrentDate, 
  posts, 
  onSelectDay,
  onEditPost
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Robust date matching for calendar cells
  const getPostsForDay = (day: Date) => {
    const dayStr = format(day, 'yyyy-MM-dd');
    return posts.filter(p => {
      // Direct string match is fastest and usually correct for YYYY-MM-DD
      if (p.date === dayStr) return true;
      
      // Fallback: parse and compare if formats differ slightly
      try {
        const pDate = p.date.includes('T') ? parseISO(p.date) : parseISO(`${p.date}T00:00:00`);
        return isSameDay(pDate, day);
      } catch {
        return false;
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f5f5f5] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-8 border-b border-black/5 bg-white shrink-0">
        <div className="flex flex-col">
          <h1 className="text-6xl font-serif font-black tracking-tighter leading-none">
            {format(currentDate, 'MMMM')}
          </h1>
          <p className="text-sm font-mono uppercase tracking-widest opacity-50 mt-2">
            {format(currentDate, 'yyyy')} Content Plan
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={prevMonth}
            className="p-3 hover:bg-black/5 rounded-full transition-colors border border-black/5"
          >
            <ChevronLeft size={24} />
          </button>
          <button 
            onClick={nextMonth}
            className="p-3 hover:bg-black/5 rounded-full transition-colors border border-black/5"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 border-b border-black/5 bg-white shrink-0">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="py-4 text-center text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">
            {day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 flex-1 overflow-y-auto bg-black/5 gap-[1px]">
        {days.map((day) => {
          const dayPosts = getPostsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const publishedCount = dayPosts.filter(p => p.status === 'published').length;
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toString()}
              className={cn(
                "min-h-[160px] p-4 relative group transition-all duration-300",
                !isCurrentMonth ? "bg-black/[0.02] opacity-30" : "bg-white hover:bg-black/[0.01]"
              )}
            >
              {/* Oversized Number Background */}
              <span className={cn(
                "absolute top-2 left-2 text-7xl font-serif font-black leading-none pointer-events-none transition-all duration-500",
                isToday ? "text-emerald-600 opacity-[0.08]" : "opacity-[0.03] group-hover:opacity-[0.06]"
              )}>
                {format(day, 'd')}
              </span>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-sm font-mono font-bold",
                      isToday ? "text-emerald-600" : "opacity-80"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayPosts.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <div className="px-2 py-0.5 rounded-full bg-black/5 text-black/40 text-[8px] font-bold uppercase tracking-tighter">
                          {dayPosts.length} posts
                        </div>
                        {publishedCount > 0 && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold uppercase tracking-tighter shadow-sm shadow-emerald-200">
                            <CheckCircle2 size={8} />
                            {publishedCount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {isCurrentMonth && (
                    <button 
                      onClick={() => onSelectDay(day)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-black/5 rounded-lg transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[110px] scrollbar-hide">
                  {dayPosts.slice(0, 4).map(post => (
                    <motion.button
                      layoutId={post.id}
                      key={post.id}
                      onClick={() => onEditPost(post)}
                      className={cn(
                        "text-[10px] p-2 rounded-xl border text-left flex items-center gap-2 transition-all group/post shadow-sm",
                        post.status === 'published' 
                          ? "bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-emerald-100" 
                          : "bg-white border-black/5 text-black/70 hover:border-black/20"
                      )}
                    >
                      <div className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        post.status === 'published' ? "bg-emerald-500" : "bg-black/20"
                      )} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className="font-mono opacity-60 text-[8px]">{post.time}</span>
                          {post.status === 'published' && <CheckCircle2 size={8} className="text-emerald-500" />}
                        </div>
                        <p className="font-medium truncate text-[9px] leading-tight">{post.content}</p>
                        <div className="flex gap-0.5 mt-1">
                          {post.platforms.map(p => (
                            <div key={p} className={cn(
                              "w-1 h-1 rounded-full",
                              p === 'twitter' ? "bg-[#1DA1F2]" : 
                              p === 'linkedin' ? "bg-[#0077B5]" : 
                              p === 'instagram' ? "bg-[#E4405F]" : "bg-black/20"
                            )} />
                          ))}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                  {dayPosts.length > 4 && (
                    <button 
                      onClick={() => onSelectDay(day)}
                      className="text-[9px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 text-center py-2 hover:bg-black/5 rounded-lg transition-all"
                    >
                      + {dayPosts.length - 4} more
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
