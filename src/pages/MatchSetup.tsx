import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, User, Cpu, ChevronRight, RotateCcw } from 'lucide-react';
import { Faction, PlayerType, BotDifficulty, MatchConfig } from '../rules/threeKingdomRules';
import { useMatchContext } from '../context/MatchContext';
import { cn } from '../lib/utils';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];

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
  const { config, updateConfig } = useMatchContext();
  
  const [localFactions, setLocalFactions] = useState(config.factions);
  const [localPrimary, setLocalPrimary] = useState(config.primaryKingdom);

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
    updateConfig({
      factions: localFactions,
      primaryKingdom: localPrimary
    });
    navigate('/practice');
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 max-w-2xl"
      >
        <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 uppercase tracking-[0.2em]">
          Prepare the <span className="text-gold">Battlefield</span>
        </h1>
        <p className="text-zinc-400 font-serif italic text-lg leading-relaxed">
          "Choose your kingdom, assign your rivals, and begin the struggle for unification."
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-12">
        {FACTIONS.map((f, idx) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => handleSelectPrimary(f)}
            className={cn(
              "glass-dark border p-8 rounded-[2rem] flex flex-col gap-6 cursor-pointer transition-all hover:-translate-y-2 group relative overflow-hidden",
              FACTION_DETAILS[f].color,
              localPrimary === f ? "ring-2 ring-gold shadow-[0_0_40px_rgba(212,175,55,0.1)] border-gold/50" : "border-white/5"
            )}
          >
            {/* Background Graphic */}
            <div className={cn("absolute -right-8 -bottom-8 opacity-5 transition-transform group-hover:scale-110 group-hover:rotate-12", FACTION_DETAILS[f].accent)}>
              <Sword size={200} />
            </div>

            <div className="flex justify-between items-start">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Faction {idx + 1}</span>
                <h3 className="text-2xl font-serif font-bold text-white">{FACTION_DETAILS[f].name}</h3>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gold mt-1">{FACTION_DETAILS[f].theme}</span>
              </div>
              {localPrimary === f && (
                <div className="bg-gold/10 p-2 rounded-xl text-gold border border-gold/20">
                  <Shield size={16} />
                </div>
              )}
            </div>

            <p className="text-xs text-zinc-500 font-serif italic leading-relaxed min-h-[48px]">
              {FACTION_DETAILS[f].description}
            </p>

            <div className="flex flex-col gap-4 mt-4 relative z-10">
              {/* Control Type */}
              <div className="flex flex-col gap-2">
                <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Command Mode</span>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                      localFactions[f].control === 'Human' 
                        ? "bg-white text-black border-white shadow-xl" 
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <User size={12} />
                    Human
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border",
                      localFactions[f].control === 'Bot' 
                        ? "bg-gold text-black border-gold shadow-xl shadow-gold/20" 
                        : "bg-white/5 text-white/40 border-white/10 hover:bg-white/10"
                    )}
                  >
                    <Cpu size={12} />
                    Bot
                  </button>
                </div>
              </div>

              {/* Difficulty */}
              <AnimatePresence>
                {localFactions[f].control === 'Bot' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2 overflow-hidden"
                  >
                    <span className="text-[8px] uppercase tracking-widest opacity-40 font-bold">Tactical Depth</span>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDifficultyChange(f, 'easy'); }}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                          localFactions[f].difficulty === 'easy' ? "bg-gold/10 border-gold/20 text-gold" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                        )}
                      >
                        {DIFFICULTY_LABELS.easy}
                        {localFactions[f].difficulty === 'easy' && <Zap size={10} />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDifficultyChange(f, 'normal'); }}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-xl border text-[10px] font-bold uppercase transition-all",
                          localFactions[f].difficulty === 'normal' ? "bg-gold/10 border-gold/20 text-gold" : "bg-white/5 border-white/5 text-zinc-500 hover:bg-white/10"
                        )}
                      >
                        {DIFFICULTY_LABELS.normal}
                        {localFactions[f].difficulty === 'normal' && <Zap size={10} />}
                      </button>
                      <div className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/5 text-zinc-600 text-[10px] font-bold uppercase flex justify-between items-center cursor-not-allowed">
                        Hard
                        <span className="text-[7px] bg-zinc-800 px-1.5 py-0.5 rounded">Coming Soon</span>
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-4xl glass-dark border border-white/5 p-8 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-8 mb-12"
      >
        <div className="flex flex-col gap-1">
          <h4 className="text-white font-serif font-bold uppercase tracking-widest text-sm">Match Rules</h4>
          <p className="text-zinc-500 text-xs font-serif italic">3-Player variant, standard armies, Shu moves first.</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
          >
            Withdraw
          </button>
          <button 
            onClick={handleStart}
            className="px-12 py-4 bg-gold text-black rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:scale-105 transition-all flex items-center gap-2"
          >
            Start Match
            <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
