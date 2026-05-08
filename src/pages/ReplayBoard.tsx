import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  History, 
  Trophy, 
  Award,
  Sword,
  Target,
  Activity,
  Settings,
  Download,
  PlayCircle,
  ShieldAlert
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  Faction, 
  PieceType,
  Piece, 
  MatchRecord, 
  RecordedMove, 
  getPieceName,
  validateBoardIntegrity,
  isFactionInCheck
} from '@/src/rules/classicThreeKingdomRules';
import { getSavedMatchRecords, exportMatchRecord } from '@/src/storage/localMatchArchive';
import BoardPieceToken from '@/src/components/BoardPieceToken';
import { DEFAULT_GAME_MODE, GAME_MODE_META, normalizeGameMode } from '@/shared/gameModes';

const FACTION_COLORS = {
  Shu: 'text-rose-500 bg-black border-rose-500/50 shadow-rose-900/40',
  Wei: 'text-blue-500 bg-black border-blue-500/50 shadow-blue-900/40',
  Wu: 'text-emerald-500 bg-black border-emerald-500/50 shadow-emerald-900/40',
  None: 'text-zinc-500 bg-zinc-900 border-zinc-700'
};

const ROWS = 17;
const COLS = 17;
const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];

export default function ReplayBoard() {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [match, setMatch] = useState<MatchRecord | null>(null);
  const [currentStep, setCurrentStep] = useState(0); // 0 is initial position
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (location.state?.match) {
      setMatch(location.state.match);
    } else if (matchId) {
      if (matchId === 'local') {
          // If navigated to /replay/local without state, return home or to archive
          navigate('/archive');
          return;
      }
      const records = getSavedMatchRecords();
      const found = records.find(r => r.id === matchId);
      if (found) {
        setMatch(found);
      } else {
        navigate('/archive');
      }
    }
  }, [matchId, location.state]);

  const currentPieces = useCallback((): Piece[] => {
    if (!match) return [];
    let pieces = [...match.initialPieces];
    for (let i = 0; i < currentStep; i++) {
      const move = match.moves[i];
      // Apply move correctly
      const movedPiece = pieces.find(p => p.id === move.pieceId);
      if (movedPiece) {
        // Remove captured piece if any
        if (move.capturedPiece) {
            pieces = pieces.filter(p => !(p.x === move.to.x && p.y === move.to.y));
        }
        // If a move causes checkmate, some pieces might be cleared (eliminated factions)
        // However, RecordedMove usually tracks state at that point. 
        // A simpler way is to just follow the recorded piece positions if possible, 
        // but here we just update the specific moved piece.
        pieces = pieces.map(p => p.id === move.pieceId ? { ...p, x: move.to.x, y: move.to.y } : p);
        
        // Handle elimination: if this move eliminated a faction, remove all their pieces
        if (move.eliminatedAfterMove && move.eliminatedAfterMove.length > 0) {
            pieces = pieces.filter(p => !move.eliminatedAfterMove?.includes(p.faction));
        }
      }
    }
    return pieces;
  }, [match, currentStep]);

  const lastMove = currentStep > 0 ? match?.moves[currentStep - 1] : null;

  const nextStep = useCallback(() => {
    if (match && currentStep < match.moves.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [match, currentStep]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        nextStep();
      }, 1000);
    } else {
        if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, nextStep]);

  if (!match) return null;

  const replayMode = normalizeGameMode(match.setup?.gameMode, DEFAULT_GAME_MODE);
  if (replayMode === 'authentic') {
    return (
      <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col gap-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 px-4">
          <div className="space-y-4">
            <Link to="/archive" className="inline-flex items-center gap-3 text-gold hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em] mb-4 bg-gold/10 px-6 py-2.5 rounded-full border border-gold/20 mr-4">
              <ChevronLeft size={16} /> Return to Archives
            </Link>
            <h1 className="text-4xl md:text-7xl font-serif font-black text-white tracking-[0.05em] uppercase leading-none">
              AUTHENTIC <span className="text-gold italic block md:inline">REPLAY</span>
            </h1>
          </div>

          <div className="flex gap-4 w-full lg:w-auto">
            <button
              onClick={() => exportMatchRecord(match)}
              className="flex-1 lg:flex-none glass-dark border border-white/10 text-white px-8 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-95"
            >
              <Download size={18} className="text-gold" /> Export Log
            </button>
            <button
              onClick={() => navigate('/setup?mode=authentic')}
              className="flex-1 lg:flex-none bg-gold text-black px-8 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:bg-white hover:scale-[1.02] active:scale-95"
            >
              <PlayCircle size={18} /> New Campaign
            </button>
          </div>
        </div>

        <div className="px-4">
          <div className="glass-dark border border-white/10 rounded-[3rem] p-10 md:p-14 shadow-3xl">
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gold">Archive Notice</span>
            <h2 className="mt-4 text-3xl md:text-5xl font-serif font-black uppercase text-white tracking-tight">
              Authentic replay is not available in v1.
            </h2>
            <p className="mt-6 max-w-2xl text-zinc-400 font-serif italic leading-relaxed">
              This record can still be exported for reference, but the Authentic local ruleset does not yet support archive playback.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const boardPieces = currentPieces();

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 px-4">
        <div className="space-y-4">
          <Link to="/archive" className="inline-flex items-center gap-3 text-gold hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em] mb-4 bg-gold/10 px-6 py-2.5 rounded-full border border-gold/20 mr-4">
            <ChevronLeft size={16} /> Return to Archives
          </Link>
          <h1 className="text-4xl md:text-7xl font-serif font-black text-white tracking-[0.05em] uppercase leading-none">
            HISTORICAL <span className="text-gold italic block md:inline">RECONSTRUCTION</span>
          </h1>
          <div className="flex flex-wrap items-center gap-6 mt-4">
             {match.source?.mode === 'war-room-sim' && (
                <span className="text-[10px] font-black text-gold uppercase tracking-[0.3em] bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full flex items-center gap-2">
                   <Settings size={12} /> Unit {match.source.roomCode}
                </span>
             )}
             <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                <Settings size={12} className="text-gold" /> {GAME_MODE_META[replayMode].shortLabel}
             </span>
             <div className="flex items-center gap-3 border-l border-white/10 pl-6 h-8">
                <Trophy size={16} className="text-gold" /> 
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Dominion:</span>
                <span className={cn("text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg", match.winner ? FACTION_COLORS[match.winner] : "text-white bg-white/5")}>
                   {match.winner || "Stalemate"}
                </span>
             </div>
             <div className="flex items-center gap-3 border-l border-white/10 pl-6 h-8">
                <Sword size={16} className="text-rose-500/60" /> 
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Scale:</span>
                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] font-mono">{match.moves.length} Nodes</span>
             </div>
          </div>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
            <button 
                onClick={() => exportMatchRecord(match)}
                className="flex-1 lg:flex-none glass-dark border border-white/10 text-white px-8 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:bg-white/10 hover:scale-[1.02] active:scale-95"
            >
                <Download size={18} className="text-gold" /> Export Log
            </button>
            <button 
                onClick={() => navigate(`/setup?mode=${replayMode}`)}
                className="flex-1 lg:flex-none bg-gold text-black px-8 py-5 rounded-2xl flex items-center justify-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:bg-white hover:scale-[1.02] active:scale-95"
            >
                <PlayCircle size={18} /> New Campaign
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 items-start px-4">
        {/* Board Area */}
        <div className="xl:col-span-8 space-y-8">
          <div className="relative w-full max-w-[820px] mx-auto aspect-square overflow-hidden rounded-[2.25rem] border border-[#5d4926]/40 bg-[#100d09] p-3 sm:p-4 md:p-7 shadow-[0_28px_80px_rgba(0,0,0,0.82)]">
            <AnimatePresence mode="wait">
              <motion.div
                key={lastMove?.faction}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 pointer-events-none opacity-[0.08]"
              >
                <div className={cn("absolute inset-0 bg-gradient-to-br from-current via-transparent to-transparent", lastMove ? FACTION_COLORS[lastMove.faction] : "text-zinc-500")} />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(244,213,141,0.12),transparent_34%),radial-gradient(circle_at_18%_48%,rgba(20,83,45,0.14),transparent_26%),radial-gradient(circle_at_82%_82%,rgba(30,64,175,0.16),transparent_26%),linear-gradient(180deg,#2f2418_0%,#19120d_22%,#0d0a08_100%)]" />
            <div className="absolute inset-[1.25%] rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(0,0,0,0.35))]" />
            <div className="absolute inset-[2.2%] rounded-[1.8rem] border border-black/35 shadow-[inset_0_0_80px_rgba(0,0,0,0.72)]" />
            <div className="absolute left-[24%] top-[4%] h-[22%] w-[52%] rounded-full bg-rose-500/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute left-[4%] top-[24%] h-[52%] w-[22%] rounded-full bg-emerald-500/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute left-[24%] bottom-[4%] h-[22%] w-[52%] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.09] mix-blend-overlay [background-image:linear-gradient(120deg,rgba(255,255,255,0.16)_0,transparent_22%,rgba(255,255,255,0.08)_36%,transparent_52%,rgba(0,0,0,0.18)_72%,transparent_100%)]" />

            <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 md:p-7">
              <svg viewBox="0 0 170 170" className="w-full h-full fill-none" strokeWidth="0.52">
                <defs>
                  <linearGradient id="replay-board-grid-v1" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="rgba(244, 215, 160, 0.10)" />
                    <stop offset="50%" stopColor="rgba(225, 194, 136, 0.45)" />
                    <stop offset="100%" stopColor="rgba(244, 215, 160, 0.10)" />
                  </linearGradient>
                </defs>
                <rect x="5" y="5" width="160" height="160" rx="2" stroke="rgba(212,175,55,0.18)" />
                {[...Array(17)].map((_, i) => (
                  <line key={`v-${i}`} x1={i * 10 + 5} y1={5} x2={i * 10 + 5} y2={165} stroke="url(#replay-board-grid-v1)" opacity={i < 4 || i > 12 ? 0.35 : 1} />
                ))}
                {[...Array(17)].map((_, i) => (
                  <line key={`h-${i}`} x1={5} y1={i * 10 + 5} x2={165} y2={i * 10 + 5} stroke="url(#replay-board-grid-v1)" opacity={i < 4 || i > 12 ? 0.35 : 1} />
                ))}
                <rect x="71.5" y="1.5" width="27" height="27" rx="3" fill="rgba(127,29,29,0.08)" stroke="rgba(251,113,133,0.18)" />
                <rect x="1.5" y="71.5" width="27" height="27" rx="3" fill="rgba(6,95,70,0.08)" stroke="rgba(52,211,153,0.18)" />
                <rect x="71.5" y="141.5" width="27" height="27" rx="3" fill="rgba(30,64,175,0.08)" stroke="rgba(96,165,250,0.18)" />
                <g className="stroke-[rgba(251,113,133,0.34)] stroke-[0.9]">
                  <line x1={75} y1={5} x2={95} y2={25} />
                  <line x1={95} y1={5} x2={75} y2={25} />
                </g>
                <g className="stroke-[rgba(52,211,153,0.34)] stroke-[0.9]">
                  <line x1={5} y1={75} x2={25} y2={95} />
                  <line x1={25} y1={75} x2={5} y2={95} />
                </g>
                <g className="stroke-[rgba(96,165,250,0.34)] stroke-[0.9]">
                  <line x1={75} y1={145} x2={95} y2={165} />
                  <line x1={95} y1={145} x2={75} y2={165} />
                </g>
                <g className="stroke-[rgba(212,175,55,0.34)] stroke-[0.8]" strokeDasharray="2.4 2.4">
                  <line x1={65} y1={45} x2={65} y2={125} />
                  <line x1={45} y1={65} x2={125} y2={65} />
                  <line x1={45} y1={105} x2={125} y2={105} />
                </g>
              </svg>
            </div>

            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center p-10 sm:p-14 md:p-20 select-none overflow-hidden">
              <div className="text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-rose-500/[0.06] -mt-6">SHU</div>
              <div className="flex justify-between w-full">
                <div className="-ml-10 text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-emerald-500/[0.06] -rotate-90">WU</div>
                <div className="invisible -mr-10 text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-blue-500/[0.06]">WEI</div>
              </div>
              <div className="text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-blue-500/[0.06] -mb-6">WEI</div>
            </div>

            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-55">
              <span className="translate-y-[-48px] text-[9px] font-black uppercase tracking-[1.2em] text-[#453726] sm:text-[10px]">Inter-Kingdom River</span>
              <span className="translate-y-[48px] text-[9px] font-black uppercase tracking-[1.2em] text-[#453726] sm:text-[10px]">Chasm of Three Fates</span>
            </div>

            <div
              className="grid gap-0 w-full h-full relative z-10"
              style={{
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)`
              }}
            >
              {[...Array(ROWS)].map((_, y) => (
                [...Array(COLS)].map((_, x) => {
                  const piece = boardPieces.find(p => p.x === x && p.y === y);
                  const isLastMoveFrom = !!lastMove && lastMove.from.x === x && lastMove.from.y === y;
                  const isLastMoveTo = !!lastMove && lastMove.to.x === x && lastMove.to.y === y;
                  const isCheckedGeneral = !!piece && piece.type === 'G' && isFactionInCheck(piece.faction, boardPieces).inCheck;

                  let isAttacker = false;
                  FACTIONS.forEach(f => {
                    const check = isFactionInCheck(f, boardPieces);
                    if (check.inCheck && check.attackers.some(a => a.id === piece?.id)) {
                      isAttacker = true;
                    }
                  });

                  return (
                    <div
                      key={`${x}-${y}`}
                      className="relative flex items-center justify-center"
                    >
                      {(isLastMoveFrom || isLastMoveTo) && (
                        <div
                          className={cn(
                            "absolute inset-[9%] rounded-[0.9rem] border z-[1]",
                            isLastMoveTo
                              ? lastMove?.capturedPiece
                                ? "border-rose-400/55 bg-rose-500/[0.12] shadow-[0_0_16px_rgba(244,63,94,0.28)]"
                                : "border-gold/60 bg-gold/10 shadow-[0_0_18px_rgba(212,175,55,0.18)]"
                              : "border-sky-200/35 bg-sky-200/5",
                          )}
                        />
                      )}

                      <div className="absolute h-[2px] w-3 rounded-full bg-[#6f5b3d]/45" />
                      <div className="absolute h-3 w-[2px] rounded-full bg-[#6f5b3d]/45" />
                      <div className="absolute h-[4px] w-[4px] rounded-full bg-[#8a734b]/65 shadow-[0_0_6px_rgba(212,175,55,0.18)]" />

                      {piece && (
                        <motion.div
                          layoutId={piece.id}
                          transition={{ type: "spring", damping: 30, stiffness: 150 }}
                          className="absolute z-20 h-[90%] w-[90%]"
                        >
                          <BoardPieceToken
                            faction={piece.faction}
                            pieceType={piece.type as PieceType}
                            inCheck={isCheckedGeneral}
                            attacker={isAttacker}
                            interactive
                          />
                        </motion.div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>

          {/* Replay Controls & Progress */}
          <div className="glass-dark border border-white/5 p-8 rounded-[3.5rem] flex flex-col gap-10 shadow-3xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-4 bg-white/[0.02] border border-white/10 px-8 py-4 rounded-3xl">
                       <span className="text-4xl font-mono text-gold font-black tracking-tighter leading-none">{currentStep}</span>
                       <div className="w-px h-8 bg-zinc-800" />
                       <span className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.4em] leading-none mb-1">
                          OF {match.moves.length}
                       </span>
                  </div>
                  
                  <div className="flex items-center gap-6 p-2 rounded-full relative">
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setCurrentStep(0)}
                          className="p-5 text-zinc-500 hover:text-white transition-all rounded-[1.5rem] hover:bg-white/5 shadow-inner"
                          title="Rewind to Deployment"
                        >
                          <RotateCcw size={24} />
                        </button>
                        <button 
                          onClick={prevStep}
                          disabled={currentStep === 0}
                          className="p-5 text-zinc-500 hover:text-white disabled:opacity-10 transition-all rounded-[1.5rem] hover:bg-white/5 shadow-inner"
                        >
                          <ChevronLeft size={32} />
                        </button>
                      </div>

                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-20 h-20 bg-gold text-black rounded-[2rem] flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_15px_40px_rgba(212,175,55,0.3)] hover:bg-white"
                      >
                        {isPlaying ? <Pause size={36} fill="currentColor" /> : <Play size={36} className="translate-x-1" fill="currentColor" />}
                      </button>

                      <div className="flex items-center gap-3">
                        <button 
                          onClick={nextStep}
                          disabled={currentStep === match.moves.length}
                          className="p-5 text-zinc-500 hover:text-white disabled:opacity-10 transition-all rounded-[1.5rem] hover:bg-white/5 shadow-inner"
                        >
                          <ChevronRight size={32} />
                        </button>
                        <button 
                          onClick={() => setCurrentStep(match.moves.length)}
                          className="p-5 text-gold/60 hover:text-gold transition-all rounded-[1.5rem] hover:bg-gold/5 px-6 font-mono font-black text-xs uppercase tracking-widest"
                        >
                          FIN
                        </button>
                      </div>
                  </div>
              </div>
              
              {/* Cinematic Progress Bar */}
              <div className="px-4">
                  <div className="h-2 w-full bg-white/[0.02] rounded-full overflow-hidden relative border border-white/5 p-[1px]">
                      <motion.div 
                        initial={false}
                        animate={{ width: `${(currentStep / match.moves.length) * 100}%` }}
                        className="absolute inset-0 bg-gradient-to-r from-gold/40 to-gold rounded-full shadow-[0_0_20px_rgba(212,175,55,0.6)]"
                      />
                  </div>
              </div>
          </div>
        </div>

        {/* Right Panel: Analysis */}
        <div className="xl:col-span-4 space-y-8">
            {/* Tactical Intel */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -40 }}
                    className="glass-dark border border-white/10 p-10 rounded-[3rem] shadow-[0_20px_80px_rgba(0,0,0,0.4)] relative overflow-hidden flex flex-col h-full min-h-[500px]"
                >
                    <div className="absolute top-0 right-0 w-48 h-48 bg-gold/[0.02] blur-[80px] rounded-full" />
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] flex items-center gap-3">
                            <History size={18} className="text-gold" /> Tactical Log
                        </h3>
                        {(() => {
                            const integrity = validateBoardIntegrity(boardPieces);
                            return (
                                <div className={cn(
                                    "flex items-center gap-2 px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.1em]",
                                    integrity.valid ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "text-rose-500 border-rose-500/20 bg-rose-500/5 shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                                )}>
                                    <div className={cn("w-1.5 h-1.5 rounded-full", integrity.valid ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
                                    {integrity.valid ? "CONSISTENT" : "ANOMALY"}
                                </div>
                            );
                        })()}
                    </div>
                    
                    {lastMove ? (
                        <div className="space-y-8 relative z-10 flex-grow flex flex-col">
                            <div className="flex items-center gap-6">
                               <div className={cn("w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-black text-2xl shadow-2xl relative", FACTION_COLORS[lastMove.faction])}>
                                 <div className="absolute inset-0 bg-black/40 rounded-2xl" />
                                 <span className="relative z-10">{lastMove.pieceType}</span>
                               </div>
                               <div>
                                  <h4 className={cn("text-3xl font-serif font-black uppercase italic tracking-tighter", FACTION_COLORS[lastMove.faction])}>
                                    {lastMove.faction}
                                  </h4>
                                  <div className="w-8 h-1 bg-current mb-1 opacity-30" />
                                  <p className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] font-black">Strategic Advancement</p>
                               </div>
                            </div>
                            
                            <div className="bg-white/[0.03] border-l-4 border-gold/40 p-8 rounded-2xl relative shadow-inner">
                                <p className="text-white text-xl font-serif italic leading-relaxed tracking-tight group-hover:scale-[1.02] transition-transform duration-700">
                                   "{lastMove.notationText}"
                                </p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-auto pt-10">
                                {lastMove.capturedPiece && (
                                    <div className="p-6 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] uppercase font-black tracking-[0.3em] text-rose-500/60 leading-none mb-1">Decimated</span>
                                          <span className="text-white font-serif font-black text-lg uppercase tracking-tight italic">{getPieceName(lastMove.capturedPiece.type)}</span>
                                        </div>
                                        <Target size={24} className="text-rose-500/20" />
                                    </div>
                                )}
                                {lastMove.givesCheck && (
                                    <div className="p-6 bg-gold/5 border border-gold/20 rounded-3xl flex items-center justify-between">
                                        <div className="flex flex-col gap-1">
                                          <span className="text-[9px] uppercase font-black tracking-[0.3em] text-gold/60 leading-none mb-1">King Endangered</span>
                                          <span className="text-white font-serif font-black text-lg uppercase tracking-tight italic">{lastMove.checkedFactions?.join(', ')} Realm</span>
                                        </div>
                                        <ShieldAlert size={24} className="text-gold/20" />
                                    </div>
                                )}
                                {lastMove.checkmateHappened && (
                                    <div className="p-8 bg-zinc-900 border border-zinc-700 rounded-[2.5rem] flex flex-col gap-2 shadow-2xl relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-rose-600/5 group-hover:bg-rose-600/10 transition-colors" />
                                        <span className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-600 relative z-10 mb-2">Dynasty Collapse</span>
                                        <span className="text-rose-600 font-serif font-black text-2xl uppercase tracking-tighter leading-none relative z-10 italic">
                                            DYNASTY FALLEN
                                        </span>
                                        <p className="text-[11px] text-zinc-500 font-serif italic mt-2 relative z-10">
                                            The {lastMove.eliminatedAfterMove?.join(' and ')} empires have been erased from the archives.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-20 opacity-20 grayscale scale-90">
                            <RotateCcw size={80} strokeWidth={1} className="text-zinc-800 mb-8" />
                            <p className="text-zinc-400 font-serif italic text-lg uppercase tracking-[0.3em] text-center max-w-xs">
                              Awaiting the first signal from the archives.
                            </p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Performance Metrics */}
            <div className="glass-dark border border-white/5 p-10 rounded-[3rem] shadow-2xl">
                <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-10">Historical Context</h3>
                <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:bg-white/[0.04] transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center">
                               <Activity size={18} className="text-gold group-hover:scale-125 transition-transform" />
                            </div>
                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Tempo</span>
                        </div>
                        <span className="text-white font-mono font-black text-xl tracking-tighter">{match.matchStats.totalMoves} Nodes</span>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-white/[0.02] rounded-[2rem] border border-white/5 hover:bg-white/[0.04] transition-all group">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                               <Target size={18} className="text-rose-500 group-hover:scale-125 transition-transform" />
                            </div>
                            <span className="text-[11px] font-black text-zinc-500 uppercase tracking-[0.2em]">Shattered</span>
                        </div>
                        <span className="text-white font-mono font-black text-xl tracking-tighter">{match.matchStats.totalCaptures} Units</span>
                    </div>
                </div>
            </div>

            {/* Retreat Button */}
            <button 
                onClick={() => navigate('/archive')}
                className="w-full py-6 rounded-[2rem] border border-white/10 glass-dark text-zinc-500 hover:text-white hover:border-gold/30 transition-all font-black uppercase text-[11px] tracking-[0.5em] flex items-center justify-center gap-4 group"
            >
               <ChevronLeft size={20} className="group-hover:-translate-x-2 transition-transform" />
               Exit Archive Access
            </button>
        </div>
      </div>
    </div>
  );
}
