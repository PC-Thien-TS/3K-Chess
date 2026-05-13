import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sword, Shield, Zap, User, Cpu, ChevronRight } from 'lucide-react';
import { Faction, PlayerType, BotDifficulty } from '../rules/classicThreeKingdomRules';
import { useMatchContext } from '../context/MatchContext';
import { cn } from '../lib/utils';
import { DEFAULT_GAME_MODE, GameMode, normalizeGameMode } from '@/shared/gameModes';
import { useI18n } from '@/src/i18n/useI18n';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];
const AUTHENTIC_DEFAULT_CONTROLS = {
  Shu: 'Bot' as const,
  Wei: 'Bot' as const,
  Wu: 'Human' as const,
};

const FACTION_VISUALS = {
  Shu: {
    color: 'border-rose-500/50 text-rose-500 shadow-rose-900/20',
    bg: 'bg-rose-950/20',
    accent: 'bg-rose-500',
  },
  Wei: {
    color: 'border-blue-500/50 text-blue-500 shadow-blue-900/20',
    bg: 'bg-blue-950/20',
    accent: 'bg-blue-500',
  },
  Wu: {
    color: 'border-emerald-500/50 text-emerald-500 shadow-emerald-900/20',
    bg: 'bg-emerald-950/20',
    accent: 'bg-emerald-500',
  },
};

export default function MatchSetup() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { config, updateConfig } = useMatchContext();
  const initialGameMode = normalizeGameMode(searchParams.get('mode'), DEFAULT_GAME_MODE);
  const AUTHENTIC_PREVIEW_MESSAGE = t<string>('matchSetup.previewMessage');
  const DIFFICULTY_LABELS: Record<BotDifficulty, string> = {
    easy: t('matchSetup.difficultyLabels.easy'),
    normal: t('matchSetup.difficultyLabels.normal'),
    hard: t('matchSetup.difficultyLabels.hard'),
  };
  const DIFFICULTY_NOTES: Record<BotDifficulty, string> = {
    easy: t('matchSetup.difficultyNotes.easy'),
    normal: t('matchSetup.difficultyNotes.normal'),
    hard: t('matchSetup.difficultyNotes.hard'),
  };

  const buildAuthenticFactions = (source: typeof config.factions) => ({
    ...source,
    Shu: { ...source.Shu, control: AUTHENTIC_DEFAULT_CONTROLS.Shu },
    Wei: { ...source.Wei, control: AUTHENTIC_DEFAULT_CONTROLS.Wei },
    Wu: { ...source.Wu, control: AUTHENTIC_DEFAULT_CONTROLS.Wu },
  });

  const [classicFactions, setClassicFactions] = useState(config.factions);
  const [authenticFactions, setAuthenticFactions] = useState(buildAuthenticFactions(config.factions));
  const [localPrimary, setLocalPrimary] = useState<Faction>(initialGameMode === 'authentic' ? 'Wu' : config.primaryKingdom);
  const [localGameMode, setLocalGameMode] = useState<GameMode>(initialGameMode);
  const [modeNotice, setModeNotice] = useState<string | null>(initialGameMode === 'authentic' ? AUTHENTIC_PREVIEW_MESSAGE : null);
  const isAuthenticMode = localGameMode === 'authentic';
  const activeFactions = isAuthenticMode ? authenticFactions : classicFactions;

  const handleControlToggle = (faction: Faction) => {
    const updateFactions = isAuthenticMode ? setAuthenticFactions : setClassicFactions;
    updateFactions((prev) => {
      const next: PlayerType = prev[faction].control === 'Human' ? 'Bot' : 'Human';
      return {
        ...prev,
        [faction]: { ...prev[faction], control: next },
      };
    });
  };

  const handleDifficultyChange = (faction: Faction, diff: BotDifficulty) => {
    const updateFactions = isAuthenticMode ? setAuthenticFactions : setClassicFactions;
    updateFactions((prev) => ({
      ...prev,
      [faction]: { ...prev[faction], difficulty: diff },
    }));
  };

  const handleSelectPrimary = (faction: Faction) => {
    setLocalPrimary(faction);
    const updateFactions = isAuthenticMode ? setAuthenticFactions : setClassicFactions;
    updateFactions((prev) => ({
      ...prev,
      [faction]: { ...prev[faction], control: 'Human' },
    }));
  };

  const handleStart = () => {
    const nextFactions = localGameMode === 'authentic' ? authenticFactions : classicFactions;

    updateConfig({
      gameMode: localGameMode,
      factions: nextFactions,
      primaryKingdom: localPrimary,
    });
    navigate('/practice', {
      state: localGameMode === 'authentic'
        ? {
            gameMode: 'authentic',
            roomMode: 'local',
            mode: 'local',
            controlModes: {
              Shu: authenticFactions.Shu.control,
              Wei: authenticFactions.Wei.control,
              Wu: authenticFactions.Wu.control,
            },
          }
        : {
            gameMode: localGameMode,
            mode: 'local',
          },
    });
  };

  const handleModeSelect = (mode: GameMode) => {
    setLocalGameMode(mode);
    setSearchParams({ mode });
    setModeNotice(mode === 'authentic' ? AUTHENTIC_PREVIEW_MESSAGE : null);
    if (mode === 'authentic') {
      setAuthenticFactions((prev) => buildAuthenticFactions(prev));
      setLocalPrimary('Wu');
    }
  };

  return (
    <div className="container mx-auto flex min-h-0 flex-col items-center overflow-x-hidden px-4 pb-8 pt-14 sm:px-6 sm:pb-12 sm:pt-20 lg:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 max-w-3xl text-center sm:mb-12 lg:mb-16"
      >
        <span className="mb-3 block text-[9px] font-black uppercase tracking-[0.45em] text-gold animate-pulse sm:mb-4 sm:text-[10px] sm:tracking-[0.6em]">{t('matchSetup.heroKicker')}</span>
        <h1 className="mb-4 text-3xl font-serif font-black uppercase leading-tight tracking-[0.08em] text-white shadow-xl sm:mb-6 sm:text-5xl md:text-8xl md:tracking-[0.1em]">
          {t('matchSetup.heroTitleMain')} <span className="italic text-gold">{t('matchSetup.heroTitleAccent')}</span>
        </h1>
        <div className="mx-auto mb-4 h-px w-16 bg-gold/30 sm:mb-6" />
        <p className="text-sm font-serif italic leading-relaxed tracking-wide text-zinc-500 opacity-80 sm:text-lg lg:text-xl">
          "{t('matchSetup.heroSubtitle')}"
        </p>
      </motion.div>

      <div className="mb-6 grid w-full max-w-5xl grid-cols-1 gap-3 sm:gap-5 md:mb-10 md:grid-cols-2">
        {(['classic', 'authentic'] as GameMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            data-testid={mode === 'classic' ? 'classic-mode-card' : 'modern-3k-mode-card'}
            onClick={() => handleModeSelect(mode)}
            className={cn(
              'glass-dark rounded-[1.5rem] border p-4 text-left shadow-2xl transition-all sm:rounded-[2.5rem] sm:p-8',
              localGameMode === mode
                ? 'border-gold/40 bg-gold/[0.06]'
                : 'border-white/5 bg-white/[0.02] hover:border-white/10',
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">
                {t(`modes.${mode}.shortLabel`)}
              </span>
              <div
                className={cn(
                  'h-3 w-3 rounded-full border',
                  localGameMode === mode ? 'border-gold bg-gold' : 'border-white/20',
                )}
              />
            </div>
            <h3 className="mb-2 text-xl font-serif font-black uppercase tracking-tight text-white sm:mb-3 sm:text-2xl">
              {t(`modes.${mode}.label`)}
            </h3>
            <p className="text-sm font-serif italic leading-relaxed text-zinc-500">
              {t(`modes.${mode}.description`)}
            </p>
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gold">
              {t(`modes.${mode}.summary`)}
            </p>
          </button>
        ))}
      </div>

      {isAuthenticMode && (
        <div className="mb-6 w-full max-w-5xl rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-serif italic text-amber-100 sm:mb-10 sm:rounded-[2rem] sm:p-6">
          {AUTHENTIC_PREVIEW_MESSAGE}
        </div>
      )}
      {modeNotice && localGameMode === 'classic' && (
        <div className="mb-6 w-full max-w-5xl rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 p-4 text-sm font-serif italic text-amber-100 sm:mb-10 sm:rounded-[2rem] sm:p-6">
          {modeNotice}
        </div>
      )}

      <div className="mb-8 grid w-full max-w-7xl grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 xl:mb-16 xl:gap-10">
        {FACTIONS.map((f, idx) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.15, type: 'spring', stiffness: 100 }}
            onClick={() => handleSelectPrimary(f)}
            className={cn(
              'group glass-dark relative flex cursor-pointer flex-col gap-4 overflow-hidden rounded-[2rem] border-2 p-5 shadow-2xl transition-all duration-500 hover:-translate-y-2 sm:gap-8 sm:rounded-[3rem] sm:p-8 sm:hover:-translate-y-4 xl:rounded-[3.5rem] xl:p-10',
              FACTION_VISUALS[f].color,
              localPrimary === f ? 'border-gold/50 shadow-[0_0_80px_rgba(212,175,55,0.15)] ring-1 ring-gold/20' : 'border-white/15 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.04]',
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-gold/[0.01]" />
            <div className={cn('absolute -bottom-12 -right-12 opacity-[0.03] transition-transform duration-1000 group-hover:rotate-12 group-hover:scale-110 group-hover:opacity-[0.06]', FACTION_VISUALS[f].accent)}>
              <Sword size={300} strokeWidth={1} />
            </div>

            <div className="relative z-10 flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="mb-2 text-[10px] font-black uppercase tracking-[0.4em] opacity-65">Dominion III</span>
                <h3 className="text-3xl font-serif font-black uppercase italic tracking-tighter text-white sm:text-4xl">{t(`matchSetup.factionLabels.${f}.name`)}</h3>
                <span className="mt-1 text-[11px] font-black uppercase tracking-[0.3em] text-gold transition-all group-hover:tracking-[0.4em]">{t(`matchSetup.factionLabels.${f}.theme`)}</span>
              </div>
              <div
                className={cn(
                  'flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-500',
                  localPrimary === f ? 'scale-110 border-gold bg-gold text-black shadow-2xl' : 'border-white/20 bg-white/[0.08] text-zinc-400 group-hover:border-white/35 group-hover:bg-white/[0.12] group-hover:text-gold',
                )}
              >
                {localPrimary === f ? <Shield size={24} /> : <Zap size={24} />}
              </div>
            </div>

            <div className="relative z-10 h-px bg-white/5 shadow-inner" />

            <p className="relative z-10 min-h-[60px] text-sm font-serif italic leading-relaxed text-zinc-400 opacity-90 transition-opacity group-hover:text-zinc-300 group-hover:opacity-100">
              {t(`matchSetup.factionLabels.${f}.description`)}
            </p>

            <div className="relative z-10 mt-2 flex flex-col gap-4 sm:mt-4 sm:gap-6">
              {isAuthenticMode ? (
                <div className="flex flex-col gap-3">
                  <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white opacity-30">{t('matchSetup.sections.localCommand')}</span>
                  <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 p-2 shadow-inner sm:flex-row">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                      className={cn(
                        'group/btn flex flex-1 items-center justify-center gap-3 rounded-xl border py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all',
                        activeFactions[f].control === 'Human'
                          ? 'border-white bg-white text-black'
                          : 'border-transparent bg-transparent text-zinc-600 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <User size={14} className={cn(activeFactions[f].control === 'Human' ? 'text-black' : 'text-zinc-700 group-hover/btn:text-gold')} />
                      {t('common.human')}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                      className={cn(
                        'group/btn flex flex-1 items-center justify-center gap-3 rounded-xl border py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all',
                        activeFactions[f].control === 'Bot'
                          ? 'border-gold bg-gold text-black shadow-gold/20'
                          : 'border-transparent bg-transparent text-zinc-600 hover:bg-white/5 hover:text-white',
                      )}
                    >
                      <Cpu size={14} className={cn(activeFactions[f].control === 'Bot' ? 'text-black' : 'text-zinc-700 group-hover/btn:text-gold')} />
                      {t('common.bot')}
                    </button>
                  </div>
                  <div data-testid="han-court-status" className="rounded-[1.5rem] border border-amber-500/20 bg-amber-500/10 px-4 py-4 text-amber-100 sm:rounded-[2rem] sm:px-6">
                    <span className="text-[9px] font-black uppercase tracking-[0.35em]">{t('matchSetup.hanCourtTitle')}</span>
                    <p className="mt-2 text-xs font-serif italic leading-relaxed text-amber-100/85">
                      {t('matchSetup.hanCourtDescription')}
                    </p>
                  </div>
                  <AnimatePresence>
                    {activeFactions[f].control === 'Bot' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden pt-2"
                      >
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white opacity-30">{t('matchSetup.sections.botPressure')}</span>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((difficulty) => (
                            <button
                              key={`auth-${difficulty}`}
                              onClick={(e) => { e.stopPropagation(); handleDifficultyChange(f, difficulty); }}
                              className={cn(
                                'group/diff flex items-center justify-between gap-3 rounded-2xl border px-6 py-4 text-left shadow-md transition-all',
                                activeFactions[f].difficulty === difficulty
                                  ? 'border-gold/40 bg-gold/10 text-gold shadow-gold/5'
                                  : 'border-white/5 bg-white/[0.02] text-zinc-600 hover:bg-white/5 hover:text-zinc-300',
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest">{DIFFICULTY_LABELS[difficulty]}</span>
                                <span className="mt-1 text-[10px] font-serif italic normal-case tracking-normal opacity-70">
                                  {DIFFICULTY_NOTES[difficulty]}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {Array.from({ length: difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3 }).map((_, index) => (
                                  <Zap key={`auth-${difficulty}-${index}`} size={12} className={cn(activeFactions[f].difficulty === difficulty ? 'opacity-100' : 'opacity-30 group-hover/diff:opacity-60')} />
                                ))}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white opacity-30">{t('matchSetup.sections.militaryCommand')}</span>
                    <div className="flex flex-col gap-3 rounded-2xl border border-white/5 bg-black/40 p-2 shadow-inner sm:flex-row">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                        className={cn(
                          'group/btn flex flex-1 items-center justify-center gap-3 rounded-xl border py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all',
                          activeFactions[f].control === 'Human'
                            ? 'border-white bg-white text-black'
                            : 'border-transparent bg-transparent text-zinc-600 hover:bg-white/5 hover:text-white',
                        )}
                      >
                        <User size={14} className={cn(activeFactions[f].control === 'Human' ? 'text-black' : 'text-zinc-700 group-hover/btn:text-gold')} />
                        {t('common.human')}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleControlToggle(f); }}
                        className={cn(
                          'group/btn flex flex-1 items-center justify-center gap-3 rounded-xl border py-4 text-[10px] font-black uppercase tracking-[0.2em] shadow-lg transition-all',
                          activeFactions[f].control === 'Bot'
                            ? 'border-gold bg-gold text-black shadow-gold/20'
                            : 'border-transparent bg-transparent text-zinc-600 hover:bg-white/5 hover:text-white',
                        )}
                      >
                        <Cpu size={14} className={cn(activeFactions[f].control === 'Bot' ? 'text-black' : 'text-zinc-700 group-hover/btn:text-gold')} />
                        {t('common.bot')}
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {activeFactions[f].control === 'Bot' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: -10 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -10 }}
                        className="overflow-hidden pt-2"
                      >
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white opacity-30">{t('matchSetup.sections.strategicIntent')}</span>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          {(['easy', 'normal', 'hard'] as BotDifficulty[]).map((difficulty) => (
                            <button
                              key={difficulty}
                              onClick={(e) => { e.stopPropagation(); handleDifficultyChange(f, difficulty); }}
                              className={cn(
                                'group/diff flex items-center justify-between gap-3 rounded-2xl border px-6 py-4 text-left shadow-md transition-all',
                                activeFactions[f].difficulty === difficulty
                                  ? 'border-gold/40 bg-gold/10 text-gold shadow-gold/5'
                                  : 'border-white/5 bg-white/[0.02] text-zinc-600 hover:bg-white/5 hover:text-zinc-300',
                              )}
                            >
                              <div className="flex flex-col">
                                <span className="text-[9px] font-black uppercase tracking-widest">{DIFFICULTY_LABELS[difficulty]}</span>
                                <span className="mt-1 text-[10px] font-serif italic normal-case tracking-normal opacity-70">
                                  {DIFFICULTY_NOTES[difficulty]}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {Array.from({ length: difficulty === 'easy' ? 1 : difficulty === 'normal' ? 2 : 3 }).map((_, index) => (
                                  <Zap key={`${difficulty}-${index}`} size={12} className={cn(activeFactions[f].difficulty === difficulty ? 'opacity-100' : 'opacity-30 group-hover/diff:opacity-60')} />
                                ))}
                              </div>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-dark relative mb-8 flex w-full max-w-5xl flex-col gap-5 overflow-hidden rounded-[2rem] border-2 border-white/5 p-5 shadow-3xl sm:mb-12 sm:gap-8 sm:rounded-[3rem] sm:p-8 md:flex-row md:items-center md:justify-between xl:gap-10 xl:rounded-[4rem] xl:p-12"
      >
        <div className="pointer-events-none absolute inset-0 bg-gold/[0.01]" />
        <div className="relative z-10 flex flex-col gap-2">
          <h4 className="text-sm font-serif font-black uppercase tracking-[0.4em] text-gold">{t('matchSetup.sections.treatyTitle')}</h4>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-serif italic tracking-wide text-zinc-500 sm:gap-4">
            <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-gold/50" /> {t(`modes.${localGameMode}.shortLabel`)} {t('matchSetup.summary.modeSuffix')}</span>
            <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-gold/50" /> {t('matchSetup.summary.battleType')}</span>
            <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-gold/50" /> {isAuthenticMode ? t('matchSetup.summary.localOnly') : t('matchSetup.summary.onlineAndLocal')}</span>
            <span className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-gold/50" /> {isAuthenticMode ? t('matchSetup.summary.authenticSupport') : t('matchSetup.summary.replaySupport')}</span>
          </div>
        </div>

        <div className="relative z-10 flex w-full flex-col gap-3 sm:gap-4 md:w-auto md:flex-row md:items-center md:gap-6">
          <button
            onClick={() => navigate('/')}
            className="w-full rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 transition-colors hover:text-white md:w-auto md:px-8 md:py-5 md:tracking-[0.4em]"
          >
            {t('matchSetup.buttons.retreat')}
          </button>
          <button
            onClick={handleStart}
            data-testid={localGameMode === 'authentic' ? 'start-authentic-match-button' : 'start-local-match-button'}
            className="flex w-full items-center justify-center gap-4 rounded-2xl bg-gold px-8 py-5 text-[11px] font-black uppercase tracking-[0.28em] text-black shadow-[0_20px_50px_rgba(212,175,55,0.35)] transition-all hover:scale-[1.03] hover:bg-white active:scale-95 md:w-auto md:px-16 md:py-6 md:text-[12px] md:tracking-[0.4em]"
          >
            {localGameMode === 'authentic' ? t('matchSetup.buttons.startAuthentic') : t('matchSetup.buttons.startClassic')}
            <ChevronRight size={20} className="animate-pulse" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
