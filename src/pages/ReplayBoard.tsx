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
  Download
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  Faction, 
  Piece, 
  MatchRecord, 
  RecordedMove, 
  getPieceName,
  validateBoardIntegrity
} from '@/src/rules/threeKingdomRules';
import { getSavedMatchRecords, exportMatchRecord } from '@/src/storage/localMatchArchive';

const FACTION_COLORS = {
  Shu: 'text-rose-500 bg-black border-rose-500/50 shadow-rose-900/40',
  Wei: 'text-blue-500 bg-black border-blue-500/50 shadow-blue-900/40',
  Wu: 'text-emerald-500 bg-black border-emerald-500/50 shadow-emerald-900/40',
  None: 'text-zinc-500 bg-zinc-900 border-zinc-700'
};

const ROWS = 17;
const COLS = 17;

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

  const boardPieces = currentPieces();

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link to="/archive" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ChevronLeft size={16} /> Return to Library
          </Link>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-widest uppercase">
            REPLAY: <span className="text-gold italic">THE BATTLE OF {new Date(match.createdAt).getFullYear()}</span>
          </h1>
          <div className="flex items-center gap-4 mt-2">
             {match.source?.mode === 'war-room-sim' && (
                <span className="text-[10px] font-bold text-gold uppercase tracking-widest bg-gold/10 border border-gold/20 px-3 py-1 rounded-full">
                  War Room {match.source.roomCode}
                </span>
             )}
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Trophy size={14} className="text-gold" /> Winner: <span className={match.winner ? FACTION_COLORS[match.winner] : "text-white"}>{match.winner || "None"}</span>
             </span>
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2 border-l border-white/10 pl-4">
                <Sword size={14} className="text-rose-500" /> Maneuvers: <span className="text-white">{match.moves.length}</span>
             </span>
          </div>
        </div>

        <div className="flex gap-4">
            <button 
                onClick={() => exportMatchRecord(match)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all"
            >
                <Download size={14} className="text-gold" /> Export Log
            </button>
            <button 
                onClick={() => navigate('/setup')}
                className="bg-gold text-black px-6 py-3 rounded-2xl flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
            >
                <Settings size={14} /> New Battle
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Board Area */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="relative aspect-square w-full max-w-[800px] mx-auto glass-dark border border-white/10 rounded-[2rem] p-4 p-md-8 shadow-2xl overflow-hidden shadow-gold/5">
             {/* Grid Background */}
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                  style={{ backgroundImage: 'radial-gradient(circle, #D4AF37 1px, transparent 1px)', backgroundSize: '2.5rem 2.5rem' }} />
             
             <div className="relative w-full h-full grid grid-cols-17 grid-rows-17">
                {Array.from({ length: ROWS * COLS }).map((_, i) => {
                  const x = i % COLS;
                  const y = Math.floor(i / COLS);
                  const isHighlighted = lastMove && (
                    (lastMove.from.x === x && lastMove.from.y === y) || 
                    (lastMove.to.x === x && lastMove.to.y === y)
                  );
                  const isCapture = lastMove?.capturedPiece && lastMove.to.x === x && lastMove.to.y === y;

                  return (
                    <div 
                      key={i} 
                      className={cn(
                        "relative border-[0.5px] border-white/5 flex items-center justify-center transition-all",
                        isHighlighted && "bg-gold/5",
                        isCapture && "bg-rose-500/10"
                      )}
                    >
                      {isHighlighted && (
                          <div className={cn(
                              "absolute inset-0 border-2",
                              isCapture ? "border-rose-500/30" : "border-gold/20"
                          )} />
                      )}
                    </div>
                  );
                })}

                {/* Pieces */}
                {boardPieces.map(piece => (
                    <motion.div
                      key={piece.id}
                      layoutId={piece.id}
                      transition={{ type: "spring", damping: 25, stiffness: 120 }}
                      className={cn(
                        "absolute w-[5.88%] h-[5.88%] flex items-center justify-center z-10",
                        FACTION_COLORS[piece.faction]
                      )}
                      style={{ 
                        left: `${(piece.x / COLS) * 100}%`, 
                        top: `${(piece.y / ROWS) * 100}%` 
                      }}
                    >
                       <div className={cn(
                         "w-4 h-4 md:w-8 md:h-8 rounded-full border-2 flex items-center justify-center font-serif font-black text-[8px] md:text-sm shadow-xl bg-black relative transition-all",
                         piece.faction === 'Shu' && "border-rose-500/50 shadow-rose-900/40",
                         piece.faction === 'Wei' && "border-blue-500/50 shadow-blue-900/40",
                         piece.faction === 'Wu' && "border-emerald-500/50 shadow-emerald-900/40"
                       )}>
                         <div className="absolute inset-0 rounded-full border border-white/10" />
                         {piece.type}
                       </div>
                    </motion.div>
                ))}
             </div>
          </div>

          {/* Replay Controls */}
          <div className="glass-dark border border-white/5 p-6 rounded-[2rem] flex flex-col gap-6">
              <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                       <span className="text-xl font-mono text-gold font-bold">{currentStep}</span>
                       <span className="text-zinc-600 text-xs font-bold uppercase tracking-widest">/ {match.moves.length} Maneuvers</span>
                  </div>
                  <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                      <button 
                        onClick={() => setCurrentStep(0)}
                        className="p-3 text-zinc-400 hover:text-white transition-all rounded-xl hover:bg-white/5"
                      >
                        <RotateCcw size={20} />
                      </button>
                      <button 
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="p-3 text-zinc-400 hover:text-white disabled:opacity-20 transition-all rounded-xl hover:bg-white/5"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button 
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-14 h-14 bg-gold text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl"
                      >
                        {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="translate-x-0.5" fill="currentColor" />}
                      </button>
                      <button 
                        onClick={nextStep}
                        disabled={currentStep === match.moves.length}
                        className="p-3 text-zinc-400 hover:text-white disabled:opacity-20 transition-all rounded-xl hover:bg-white/5"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <button 
                        onClick={() => setCurrentStep(match.moves.length)}
                        className="p-3 text-gold/40 hover:text-gold transition-all rounded-xl hover:bg-gold/5 px-4 font-mono font-bold text-xs"
                      >
                        FINALE
                      </button>
                  </div>
              </div>
              
              {/* Progress Bar */}
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden relative border border-white/5">
                  <motion.div 
                    initial={false}
                    animate={{ width: `${(currentStep / match.moves.length) * 100}%` }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-gold/50 to-gold shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                  />
              </div>
          </div>
        </div>

        {/* Right Panel: Logistics */}
        <div className="lg:col-span-4 space-y-6">
            {/* Last Move Detail */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="glass-dark border border-gold/20 p-8 rounded-[2rem] shadow-xl relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] flex items-center gap-2">
                            <History size={14} /> Tactical Chronograph
                        </h3>
                        {(() => {
                            const integrity = validateBoardIntegrity(boardPieces);
                            return (
                                <div className={cn(
                                    "flex items-center gap-1.5 px-2 py-0.5 rounded border text-[8px] font-bold uppercase tracking-widest",
                                    integrity.valid ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-rose-500 border-rose-500/20 bg-rose-500/5"
                                )}>
                                    <div className={cn("w-1 h-1 rounded-full", integrity.valid ? "bg-emerald-500" : "bg-rose-500 animate-pulse")} />
                                    {integrity.valid ? "Sync OK" : "Sync Error"}
                                </div>
                            );
                        })()}
                    </div>
                    
                    {lastMove ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                               <div className={cn("w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-lg shadow-xl bg-black transition-all", FACTION_COLORS[lastMove.faction])}>
                                 {lastMove.pieceType}
                               </div>
                               <div>
                                  <h4 className={cn("text-xl font-serif font-black uppercase", FACTION_COLORS[lastMove.faction])}>{lastMove.faction}</h4>
                                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Initiated maneuver</p>
                               </div>
                            </div>
                            
                            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                <p className="text-white text-lg font-serif italic leading-relaxed">"{lastMove.notationText}"</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {lastMove.capturedPiece && (
                                    <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl flex flex-col gap-1">
                                        <span className="text-[8px] uppercase tracking-widest text-rose-500 font-bold">Captivity</span>
                                        <span className="text-white font-serif font-bold text-xs">{getPieceName(lastMove.capturedPiece.type)}</span>
                                    </div>
                                )}
                                {lastMove.givesCheck && (
                                    <div className="p-4 bg-gold/5 border border-gold/20 rounded-2xl flex flex-col gap-1">
                                        <span className="text-[8px] uppercase tracking-widest text-gold font-bold">Pressure</span>
                                        <span className="text-white font-serif font-bold text-xs">CHECK on {lastMove.checkedFactions?.join(', ')}</span>
                                    </div>
                                )}
                                {lastMove.checkmateHappened && (
                                    <div className="col-span-2 p-4 bg-zinc-800 border border-zinc-700 rounded-2xl flex flex-col gap-1">
                                        <span className="text-[8px] uppercase tracking-widest text-zinc-400 font-bold">History Made</span>
                                        <span className="text-rose-500 font-serif font-black text-xs uppercase tracking-widest">
                                            CHECKMATE! {lastMove.eliminatedAfterMove?.join(' & ')} Exterminated
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <RotateCcw size={40} className="text-zinc-800 mx-auto mb-4" />
                            <p className="text-zinc-600 font-serif italic text-sm">"The armies are deployed. Awaiting the first command of the Unifier."</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Match Stats Snapshot */}
            <div className="glass-dark border border-white/5 p-8 rounded-[2rem]">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Battle Stats Snapshot</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Activity size={16} className="text-gold" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Tempo</span>
                        </div>
                        <span className="text-white font-mono font-bold text-sm">{match.matchStats.totalMoves} Total</span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <Target size={16} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Casualties</span>
                        </div>
                        <span className="text-white font-mono font-bold text-sm">{match.matchStats.totalCaptures} Total</span>
                    </div>
                </div>
            </div>

            {/* Return Link */}
            <button 
                onClick={() => navigate('/archive')}
                className="w-full py-5 rounded-2xl border border-white/5 text-zinc-500 hover:text-white transition-all uppercase text-[10px] font-bold tracking-[0.3em] font-serif italic"
            >
               Exit Replay Session
            </button>
        </div>
      </div>
    </div>
  );
}
