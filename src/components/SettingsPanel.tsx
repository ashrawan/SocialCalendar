import React, { useState, useEffect } from 'react';
import { X, Key, Shield, Info, Save, CheckCircle2, Sparkles, Trash2, FileSpreadsheet, Globe, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SavedPlan } from '../types';
import { format } from 'date-fns';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: SavedPlan[];
  onDeletePlan: (id: string) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ 
  isOpen, 
  onClose, 
  savedPlans,
  onDeletePlan 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3-flash-preview');
  const [customModel, setCustomModel] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sheetWebhook, setSheetWebhook] = useState('');

  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'sync'>('settings');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    const storedModel = localStorage.getItem('gemini_model') || 'gemini-3-flash-preview';
    const storedWebhook = localStorage.getItem('google_sheet_webhook') || '';
    
    if (storedKey) setApiKey(storedKey);
    setSheetWebhook(storedWebhook);
    
    const standardModels = ['gemini-3-flash-preview', 'gemini-3.1-pro-preview'];
    if (standardModels.includes(storedModel)) {
      setModel(storedModel);
      setIsCustom(false);
    } else {
      setModel('custom');
      setCustomModel(storedModel);
      setIsCustom(true);
    }
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    const modelToSave = isCustom ? customModel : model;
    localStorage.setItem('gemini_model', modelToSave);
    localStorage.setItem('google_sheet_webhook', sheetWebhook);
    
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1500);
  };

  const tabs = [
    { id: 'settings', label: 'Settings', icon: Key },
    { id: 'history', label: 'Plan History', icon: FileSpreadsheet },
    { id: 'sync', label: 'Sync', icon: Globe },
  ] as const;

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-[70] flex flex-col"
          >
            <div className="p-8 border-b border-black/5 bg-white shrink-0">
              <div className="flex items-center justify-between mb-6">
                <div className="flex flex-col">
                  <h2 className="text-3xl font-serif font-black italic tracking-tight">Workspace</h2>
                  <p className="text-[10px] font-mono opacity-50 mt-1 uppercase tracking-widest">Configuration & History</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <X size={24} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex p-1 bg-black/5 rounded-2xl">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-mono uppercase tracking-widest transition-all",
                      activeTab === tab.id ? "bg-white text-black shadow-sm" : "text-black/40 hover:text-black/60"
                    )}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
              <AnimatePresence mode="wait">
                {activeTab === 'settings' && (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    {/* AI Configuration */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">
                        <Sparkles size={14} />
                        AI Engine
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium opacity-60">Gemini API Key</label>
                          <input 
                            type="password"
                            placeholder="Enter your API key"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-5 py-4 bg-black/[0.02] border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 transition-all"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-medium opacity-60">Model Selection</label>
                          <div className="grid grid-cols-1 gap-2">
                            {['gemini-3-flash-preview', 'gemini-3.1-pro-preview'].map((m) => (
                              <button
                                key={m}
                                onClick={() => { setModel(m); setIsCustom(false); }}
                                className={cn(
                                  "p-4 rounded-2xl border text-xs font-medium text-left transition-all flex items-center justify-between",
                                  !isCustom && model === m ? "bg-black text-white border-black shadow-lg" : "bg-white border-black/5 hover:bg-black/5"
                                )}
                              >
                                {m}
                                {!isCustom && model === m && <CheckCircle2 size={14} />}
                              </button>
                            ))}
                            <button
                              onClick={() => setIsCustom(true)}
                              className={cn(
                                "p-4 rounded-2xl border text-xs font-medium text-left transition-all flex items-center justify-between",
                                isCustom ? "bg-black text-white border-black shadow-lg" : "bg-white border-black/5 hover:bg-black/5"
                              )}
                            >
                              Custom Model Name
                              {isCustom && <CheckCircle2 size={14} />}
                            </button>
                          </div>
                          
                          {isCustom && (
                            <motion.input 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              type="text"
                              placeholder="e.g. gemini-1.5-pro"
                              value={customModel}
                              onChange={(e) => setCustomModel(e.target.value)}
                              className="w-full px-5 py-4 bg-black/[0.02] border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 transition-all"
                            />
                          )}
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === 'history' && (
                  <motion.div
                    key="history"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    {/* Saved Plans */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">
                        <FileSpreadsheet size={14} />
                        Generated Plans History
                      </div>
                      
                      <div className="space-y-3">
                        {savedPlans.length === 0 ? (
                          <div className="p-8 border border-dashed border-black/10 rounded-[32px] text-center opacity-30">
                            <p className="text-xs font-mono">No generated plans saved yet.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {savedPlans.map((plan) => (
                              <div 
                                key={plan.id}
                                className="p-4 bg-black/[0.02] border border-black/5 rounded-2xl flex items-center justify-between group"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold truncate max-w-[200px]">{plan.name}</span>
                                  <span className="text-[10px] font-mono opacity-40">{format(new Date(plan.timestamp), 'MMM d, yyyy HH:mm')}</span>
                                </div>
                                <button 
                                  onClick={() => onDeletePlan(plan.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </section>
                  </motion.div>
                )}

                {activeTab === 'sync' && (
                  <motion.div
                    key="sync"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="space-y-8"
                  >
                    {/* Google Sheets Sync */}
                    <section className="space-y-6">
                      <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">
                        <Globe size={14} />
                        Google Sheets Sync (Push)
                      </div>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-medium opacity-60">Apps Script Webhook URL</label>
                          <input 
                            type="url"
                            placeholder="https://script.google.com/macros/s/.../exec"
                            value={sheetWebhook}
                            onChange={(e) => setSheetWebhook(e.target.value)}
                            className="w-full px-5 py-4 bg-black/[0.02] border border-black/5 rounded-2xl text-sm focus:ring-2 focus:ring-black/5 transition-all"
                          />
                        </div>
                        
                        <div className="p-5 bg-emerald-50 rounded-3xl border border-emerald-100 space-y-3">
                          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-widest">
                            <Info size={14} />
                            How to sync back?
                          </div>
                          <p className="text-[10px] text-emerald-800/70 leading-relaxed">
                            To sync changes back to Google Sheets, you can use a simple Google Apps Script that receives POST requests. 
                            When you update a post, the app can "push" the change to your script.
                          </p>
                          <a 
                            href="https://developers.google.com/apps-script/guides/web" 
                            target="_blank" 
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:underline"
                          >
                            Learn about Web Apps <ExternalLink size={10} />
                          </a>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-8 border-t border-black/5 bg-white shrink-0">
              <button 
                onClick={handleSave}
                className={cn(
                  "w-full py-5 rounded-[24px] font-bold flex items-center justify-center gap-3 transition-all shadow-2xl",
                  saved ? "bg-emerald-500 text-white" : "bg-black text-white hover:bg-neutral-800 shadow-black/20"
                )}
              >
                {saved ? (
                  <>
                    <CheckCircle2 size={24} />
                    Settings Saved
                  </>
                ) : (
                  <>
                    <Save size={24} />
                    Save Configuration
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
