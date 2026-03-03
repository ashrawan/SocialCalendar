import React, { useState } from 'react';
import { Sparkles, Download, FileSpreadsheet, RefreshCw, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';
import { Post, Platform } from '../types';
import * as XLSX from 'xlsx';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

import { exportPostsToExcel } from '../lib/export';

interface SampleGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (posts: Post[], planName?: string) => void;
}

export const SampleGenerator: React.FC<SampleGeneratorProps> = ({ isOpen, onClose, onGenerate }) => {
  const [prompt, setPrompt] = useState('A content plan for a sustainable fashion brand focusing on eco-friendly materials and ethical manufacturing.');
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async () => {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      setError('Please set your Gemini API Key in Settings first.');
      setStatus('error');
      return;
    }

    setStatus('generating');
    setError(null);

    try {
      const genAI = new GoogleGenAI({ apiKey });
      const selectedModel = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';
      const model = genAI.models.generateContent({
        model: selectedModel,
        contents: `Generate a social media content plan for the current month based on this theme: "${prompt}". 
        Return the response as a JSON array of objects with these properties: 
        "date" (YYYY-MM-DD), "time" (HH:mm), "platforms" (array of strings: twitter, linkedin, instagram, facebook, threads, tiktok), 
        "content" (string, the post text), "status" (always "ready"). 
        Generate at least 15 posts spread across the month.`,
        config: { responseMimeType: 'application/json' }
      });

      const response = await model;
      const text = response.text;
      const posts: Post[] = JSON.parse(text).map((p: any) => ({
        ...p,
        id: Math.random().toString(36).substr(2, 9)
      }));

      onGenerate(posts, `AI Plan: ${prompt.slice(0, 20)}...`);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setError(err.message || 'Failed to generate plan');
    }
  };

  const handleExport = () => {
    const postsJson = localStorage.getItem('social_sync_posts');
    if (!postsJson) return;
    const posts: Post[] = JSON.parse(postsJson);
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
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed bottom-0 left-0 right-0 bg-white shadow-2xl z-[70] rounded-t-[32px] p-8 max-w-2xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex flex-col">
                <h2 className="text-2xl font-serif font-bold italic">AI Content Generator</h2>
                <p className="text-xs font-mono opacity-50 mt-1 uppercase tracking-widest">Generate a sample plan with Gemini</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-mono uppercase tracking-widest opacity-50">What are you planning?</label>
                <textarea 
                  rows={4}
                  placeholder="Describe your brand or campaign..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="w-full px-4 py-4 bg-black/[0.02] border-none rounded-2xl text-sm focus:ring-2 focus:ring-black/5 resize-none placeholder:opacity-30"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-3 text-xs border border-red-100">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {status === 'success' && (
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-between text-xs border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={16} />
                    Sample plan generated and added to your calendar!
                  </div>
                  <button 
                    onClick={handleExport}
                    className="p-2 hover:bg-emerald-100 rounded-lg transition-all"
                    title="Download as Excel"
                  >
                    <Download size={18} />
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button 
                  onClick={generatePlan}
                  disabled={status === 'generating'}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl",
                    status === 'generating' ? "bg-black/10 text-black/30 cursor-not-allowed" : "bg-black text-white hover:bg-neutral-800 shadow-black/10"
                  )}
                >
                  <Sparkles size={20} className={cn(status === 'generating' && "animate-pulse")} />
                  {status === 'generating' ? 'Generating...' : 'Generate Plan'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
