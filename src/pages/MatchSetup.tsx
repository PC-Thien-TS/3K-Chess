import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, User, Cpu, ChevronRight, RotateCcw } from 'lucide-react';
import { Faction, PlayerType, BotDifficulty, MatchConfig } from '../rules/classicThreeKingdomRules';
import { useMatchContext } from '../context/MatchContext';
import { cn } from '../lib/utils';
import { DEFAULT_GAME_MODE, GAME_MODE_META, GameMode, normalizeGameMode } from '@/shared/gameModes';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];
const AUTHENTIC_DISABLED_MESSAGE = 'Authentic Three Kingdoms mode is under construction.';

const FACTION_DETAILS = {
  Shu: {
    name: 'Kingdom of Shu',
    theme: 'Virtue & Loyalty',
    color: 'border-rose-500/50 text-rose-500 shadow-rose-900/20',
    bg: 'bg-rose-950/20',
    accent: 'bg-rose-500',
    description: 'Heirs to the Han legacy, fighting for restoration with unmatched spirit.'
  },
  Wei: {
    name: 'Empire of Wei',
    theme: 'Power & Ambition',
    color: 'border-blue-500/50 text-blue-500 shadow-blue-900/20',
    bg: 'bg-blue-950/20',
    accent: 'bg-blue-500',
    description: 'The dominant force of the north, ruling with absolute authority and strategy.'
  },
  Wu: {
    name: 'Nation of Wu',
    theme: 'Nature & Tenacity',
    color: 'border-emerald-500/50 text-emerald-500 shadow-emerald-900/20',
    bg: 'bg-emerald-950/20',
    accent: 'bg-emerald-500',
    description: 'Lords of the Yangtze, defending their southern rivers with iron resolve.'
  }
};

const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
  easy: 'Subtle strategist (Easy)',
  normal: 'Grand Strategist (Normal)',
  hard: 'Divine Tactician (Hard)'
};

export default function MatchSetup() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { config, updateConfig } = useMatchContext();
  const initialGameMode = normalizeGameMode(searchParams.get('mode'), DEFAULT_GAME_MODE);
  
  const [localFactions, setLocalFactions] = useState(config.factions);
  const [localPrimary, setLocalPrimary] = useState(config.primaryKingdom);
  const [localGameMode, setLocalGameMode] = useState<GameMode>(initialGameMode);
  const [modeNotice, setModeNotice] = useState<string | null>(initialGameMode === 'authentic' ? AUTHENTIC_DISABLED_MESSAGE : null);

  const handleControlToggle = (faction: Faction) => {
    setLocalFactions(prev => {
      const next: PlayerType = prev[faction].control === 'Human' ? 'Bot' : 'Human';
      return {
        ...prev,
        [faction]: { ...prev[faction], control: next }
      };
    });
  };

  const handleDifficultyChange = (faction: Faction, diff: BotDifficulty) => {
    if (diff === 'hard') return; // Only easy and normal are active for now
    setLocalFactions(prev => ({
      ...prev,
      [faction]: { ...prev[faction], difficulty: diff }
    }));
  };

  const handleSelectPrimary = (faction: Faction) => {
    setLocalPrimary(faction);
    setLocalFactions(prev => ({
      ...prev,
      [faction]: { ...prev[faction], control: 'Human' }
    }));
  };

  const handleStart = () => {
    if (localGameMode === 'authentic') {
      setModeNotice(AUTHENTIC_DISABLED_MESSAGE);
      return;
    }
    updateConfig({
      gameMode: 'classic',
      factions: localFactions,
      primaryKingdom: localPrimary
    });
    navigate('/practice', { state: { gameMode: 'classic' } });
  };

  const handleModeSelect = (mode: GameMode) => {
    setLocalGameMode(mode);
    setSearchParams({ mode });
    setModeNotice(mode === 'authentic' ? AUTHENTIC_DISABLED_MESSAGE : null);
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-16 max-w-3xl"
      >
        <span className="text-gold text-[10px] font-black uppercase tracking-[0.6em] mb-4 block animate-pulse">Preparation of War</span>
        <h1 className="text-5xl md:text-8xl font-serif font-black text-white mb-6 uppercase tracking-[0.1em] leading-tight shadow-xl">
           PREPARE THE <span className="text-gold italic">FIELD</span>
        </h1>
        <div className="w-16 h-px bg-gold/30 mx-auto mb-6" />
        <p className="text-zinc-500 font-serif italic text-xl leading-relaxed tracking-wide opacity-80">
          "The three powers have gathered at the river's edge. Finalize your command and seal the fate of the realm."
        </p>
      </motion.div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {(['classic', 'authentic'] as GameMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => handleModeSelect(mode)}
            className={cn(
              "text-left glass-dark border rounded-[2.5rem] p-8 transition-all shadow-2xl",
              localGameMode === mode
                ? "border-gold/40 bg-gold/[0.06]"
                : "border-white/5 bg-white/[0.02] hover:border-white/10"
            )}
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">
                {GAME_MODE_META[mode].shortLabel}
              </span>
              <div className={cn(
                "w-3 h-3 rounded-full border",
                localGameMode === mode ? "bg-gold border-gold" : "border-white/20"
              )} />
            </div>
            <h3 className="text-white text-2xl font-serif font-black uppercase tracking-tight mb-3">
              {GAME_MODE_META[mode].label}
            </h3>
            <p className="text-zinc-500 font-serif italic text-sm leading-relaxed">
              {GAME_MODE_META[mode].description}
            </p>
          </button>
        ))}
      </div>

      {localGameMode === 'authentic' && (
        <div className="w-full max-w-5xl mb-12 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 text-amber-100 text-sm font-serif italic">
          {AUTHENTIC_DISABLED_MESSAGE}
        </div>
      )}
      {modeNotice && localGameMode === 'classic' && (
        <div className="w-full max-w-5xl mb-12 bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6 text-amber-100 text-sm font-serif italic">
          {modeNotice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 w-full max-w-7xl mb-16">
        {FACTIONS.map((f, idx) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.15, type: "spring", stiffness: 100 }}
            onClick={() => handleSelectPrimary(f)}
            className={cn(
              "group glass-dark border-2 p-10 rounded-[3.5rem] flex flex-col gap-8 cursor-pointer transition-all duration-500 hover:-translate-y-4 relative overflow-hidden shadow-2xl",
              FACTION_DETAILS[f].color,
              localPrimary === f ? "border-gold/50 shadow-[0_0_80px_rgba(212,175,55,0.15)] ring-1 ring-gold/20" : "border-white/5 hover:border-white/10"
            )}
          >
            {/* Background Texture & Crest */}
            <div className="absolute inset-0 bg-gold/[0.01] pointer-events-none" />
            <div className={cn("absolute -right-12 -bottom-12 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12 group-hover:opacity-[0.06] duration-1000", FACTION_DETAILS[f].accent)}>
              <Sword size={300} strokeWidth={1} />
            </div>

            <div className="flex justify-between items-start relative z-10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40 mb-2">Dominion III</span>
                <h3 className="text-4xl font-serif font-black text-white uppercase italic tracking-tighter">{FACTION_DETAILS[f].name}</h3>
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gold mt-1 group-hover:tracking-[0.4em] transition-all">{FACTION_DETAILS[f].theme}</span>
              </div>
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2",
                localPrimary === f ? "bg-gold text-black border-gold shadow-2xl scale-110" : "bg-white/5 text-zinc-700 border-white/10 group-hover:bg-white/10 group-hover:border-white/20"
              )}>
                {localPrimary === f ? <Shield size={24} /> : <Zap size={24} />}
              </div>
            </div>

            <div className="h-px bg-white/5 relative z-10 shadow-inner" />

            <p className="text-sm text-zinc-500 font-serif italic leading-relaxed min-h-[60px] relative z-10 opacity-70 group-hover:opacity-100 transition-opacity">
              {FACTION_DETAILS[f].description}
            </p>

            <div className="flex flex-col gap-6 mt-4 relative z-10">
              {/* Command Mode */}
              <div className="flex flex-col gap-3">
                <span className="text-[9px] uppercase tracking-[0.4em] opacity-30 font-black text-white">Military Command</span>
                <div className="flex gap-3 bg-black/40 p-2 rounded-2xl border border-white/5 shadow-inner">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg group/btn",
                      localFactions[f].control === 'Human' 
                        ? "bg-white text-black border-white" 
                        : "bg-transparent text-zinc-600 border-transparent hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <User size={14} className={cn(localFactions[f].control === 'Human' ? "text-black" : "text-zinc-700 group-hover/btn:text-gold")} />
                    Human
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg group/btn",
                      localFactions[f].control === 'Bot' 
                        ? "bg-gold text-black border-gold shadow-gold/20" 
                        : "bg-transparent text-zinc-600 border-transparent hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <Cpu size={14} className={cn(localFactions[f].control === 'Bot' ? "text-black" : "text-zinc-700 group-hover/btn:text-gold")} />
                    Bot
                  </button>
                </div>
              </div>

              {/* Tactical Adjustments */}
              <AnimatePresence>
                {localFactions[f].control === 'Bot' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, y: -10 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -10 }}
                    className="flex flex-col gap-3 overflow-hidden pt-2"
                  >
                    <span className="text-[9px] uppercase tracking-[0.4em] opacity-30 font-black text-white">Strategic Intent</span>
                    <div className="grid grid-cols-1 gap-2">
                       <button
                         onClick={(e) => { e.stopPropagation(); handleDifficultyChange(f, 'easy'); }}
                         className={cn(
                           "flex items-center justify-between px-6 py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all shadow-md group/diff",
                           localFactions[f].difficulty === 'easy' ? "bg-gold/10 border-gold/40 text-gold shadow-gold/5" : "bg-white/[0.02] border-white/5 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
                         )}
                       >
                         {DIFFICULTY_LABELS.easy}
                         <Zap size={12} className={cn(localFactions[f].difficulty === 'easy' ? "opacity-100" : "opacity-0 group-hover/diff:opacity-20")} />
                       </button>
                       <button
                         onClick={(e) => { e.stopPropagation(); handleDifficultyChange(f, 'normal'); }}
                         className={cn(
                           "flex items-center justify-between px-6 py-4 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all shadow-md group/diff",
                           localFactions[f].difficulty === 'normal' ? "bg-gold/10 border-gold/40 text-gold shadow-gold/5" : "bg-white/[0.02] border-white/5 text-zinc-600 hover:bg-white/5 hover:text-zinc-300"
                         )}
                       >
                         {DIFFICULTY_LABELS.normal}
                         <div className="flex gap-1">
                            <Zap size={12} className={cn(localFactions[f].difficulty === 'normal' ? "opacity-100" : "opacity-0")} />
                            <Zap size={12} className={cn(localFactions[f].difficulty === 'normal' ? "opacity-100" : "opacity-0")} />
                         </div>
                       </button>
                       <div className="px-6 py-4 rounded-2xl bg-white/[0.01] border border-white/[0.03] text-zinc-800 text-[9px] font-black uppercase tracking-widest flex justify-between items-center cursor-not-allowed grayscale">
                         Divine Tactician (Hard)
                         <span className="text-[8px] bg-zinc-900 px-2 py-0.5 rounded-full text-zinc-600 border border-white/5">Dormant</span>
                       </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-5xl glass-dark border-2 border-white/5 p-12 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-10 mb-12 shadow-3xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gold/[0.01] pointer-events-none" />
        <div className="flex flex-col gap-2 relative z-10">
          <h4 className="text-gold font-serif font-black uppercase tracking-[0.4em] text-sm">Treaty of the Three Kingdoms</h4>
          <div className="flex items-center gap-4 text-zinc-500 text-[11px] font-serif italic tracking-wide">
             <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gold/50" /> {GAME_MODE_META[localGameMode].shortLabel} Mode</span>
             <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gold/50" /> 3-Dominion Battle</span>
             <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gold/50" /> Traditional Protocol</span>
             <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gold/50" /> Unified Objective</span>
          </div>
        </div>
        
        <div className="flex gap-6 items-center relative z-10 w-full md:w-auto">
          <button 
            onClick={() => navigate('/')}
            className="flex-1 md:flex-none px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600 hover:text-white transition-colors"
          >
            Retreat
          </button>
          <button 
            onClick={handleStart}
            disabled={localGameMode === 'authentic'}
            className="flex-[2] md:flex-none px-16 py-6 bg-gold text-black rounded-2xl text-[12px] font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(212,175,55,0.35)] hover:bg-white hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-4"
          >
            {localGameMode === 'authentic' ? 'UNDER CONSTRUCTION' : 'SEAL FATE'}
            <ChevronRight size={20} className="animate-pulse" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
