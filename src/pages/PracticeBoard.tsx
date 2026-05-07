import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Sword, History, Info, ShieldAlert, Settings, Award, Trophy, Activity, Skull, Target } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  validateMove, 
  Faction, 
  PieceType, 
  Piece, 
  Point,
  MOVE_ERRORS, 
  isFactionInCheck,
  isCheckmate,
  isCheckmateDetailed,
  Move,
  CheckmateResult,
  getPieceName,
  getPieceDescription,
  getLegalDestinationsForPiece,
  validateBoardIntegrity,
  MatchStats,
  RecordedMove,
  MatchRecord
} from '@/src/rules/threeKingdomRules';
import { chooseBotMove } from '@/src/ai/botAI';
import { runRuleEngineDevTests } from '@/src/rules/threeKingdomRules.devTests';
import { useMatchContext } from '@/src/context/MatchContext';
import { saveMatchRecord, exportMatchRecord } from '@/src/storage/localMatchArchive';
import { Save, Download, PlayCircle } from 'lucide-react';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';

const FACTIONS: Faction[] = ['Shu', 'Wei', 'Wu'];
const FACTION_COLORS = {
  Shu: 'text-rose-500 bg-black border-rose-500/50 shadow-rose-900/40',
  Wei: 'text-blue-500 bg-black border-blue-500/50 shadow-blue-900/40',
  Wu: 'text-emerald-500 bg-black border-emerald-500/50 shadow-emerald-900/40',
  None: 'text-zinc-500 bg-zinc-900 border-zinc-700'
};

const FACTION_NAMES = {
  Shu: 'Kingdom of Shu',
  Wei: 'Empire of Wei',
  Wu: 'Nation of Wu',
  None: 'Unaligned'
};

// --- Traditional 17x17 Grid for 3-Player Expansion ---
const ROWS = 17;
const COLS = 17;

const getInitialPieces = (): Piece[] => {
  const piecesList: Piece[] = [];

  // SHU (Top - Facing Down)
  const shuBack = ['R', 'H', 'E', 'A', 'G', 'A', 'E', 'H', 'R'] as PieceType[];
  shuBack.forEach((type, i) => piecesList.push({ id: `shu-${type}-${i}`, type, faction: 'Shu', x: 4 + i, y: 0 }));
  piecesList.push({ id: 'shu-P-1', type: 'P', faction: 'Shu', x: 5, y: 2 });
  piecesList.push({ id: 'shu-P-2', type: 'P', faction: 'Shu', x: 11, y: 2 });
  [4, 6, 8, 10, 12].forEach((x, i) => piecesList.push({ id: `shu-S-${i}`, type: 'S', faction: 'Shu', x, y: 3 }));

  // WU (Left - Facing Right)
  const wuBack = ['R', 'H', 'E', 'A', 'G', 'A', 'E', 'H', 'R'] as PieceType[];
  wuBack.forEach((type, i) => piecesList.push({ id: `wu-${type}-${i}`, type, faction: 'Wu', x: 0, y: 4 + i }));
  piecesList.push({ id: 'wu-P-1', type: 'P', faction: 'Wu', x: 2, y: 5 });
  piecesList.push({ id: 'wu-P-2', type: 'P', faction: 'Wu', x: 2, y: 11 });
  [4, 6, 8, 10, 12].forEach((y, i) => piecesList.push({ id: `wu-S-${i}`, type: 'S', faction: 'Wu', x: 3, y }));

  // WEI (Bottom - Facing Up)
  const weiBack = ['R', 'H', 'E', 'A', 'G', 'A', 'E', 'H', 'R'] as PieceType[];
  weiBack.forEach((type, i) => piecesList.push({ id: `wei-${type}-${i}`, type, faction: 'Wei', x: 4 + i, y: 16 }));
  piecesList.push({ id: 'wei-P-1', type: 'P', faction: 'Wei', x: 5, y: 14 });
  piecesList.push({ id: 'wei-P-2', type: 'P', faction: 'Wei', x: 11, y: 14 });
  [4, 6, 8, 10, 12].forEach((x, i) => piecesList.push({ id: `wei-S-${i}`, type: 'S', faction: 'Wei', x, y: 13 }));

  return piecesList;
};

export default function PracticeBoard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config } = useMatchContext();

  const [pieces, setPieces] = useState<Piece[]>(getInitialPieces());
  const [turn, setTurn] = useState<Faction>('Shu');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<Move[]>([]);
  const [history, setHistory] = useState<Move[]>([]);
  const [captured, setCaptured] = useState<Piece[]>([]);
  const [eliminated, setEliminated] = useState<Faction[]>([]);
  const [winner, setWinner] = useState<Faction | null>(null);
  const [status, setStatus] = useState<string>("Strategic deployment initialized.");
  const [lastCheckmateDebug, setLastCheckmateDebug] = useState<Record<string, CheckmateResult>>({});
  const [showDebug, setShowDebug] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<Point | null>(null);
  const [controlModes, setControlModes] = useState<Record<Faction, 'Human' | 'Bot'>>({
    Shu: config.factions.Shu.control,
    Wei: config.factions.Wei.control,
    Wu: config.factions.Wu.control,
    None: config.factions.None.control
  });
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [lastBotDecision, setLastBotDecision] = useState<any>(null);
  const [matchStats, setMatchStats] = useState<MatchStats>({
    totalMoves: 0,
    totalCaptures: 0,
    totalChecks: 0,
    totalCheckmates: 0,
    capturesByFaction: { Shu: 0, Wei: 0, Wu: 0, None: 0 },
    eliminationOrder: []
  });
  const [showSummary, setShowSummary] = useState(false);
  const [recordedMoves, setRecordedMoves] = useState<RecordedMove[]>([]);
  const [initialPieces] = useState<Piece[]>(getInitialPieces());
  const [isSaved, setIsSaved] = useState(false);
  const roomCode = (location.state as any)?.roomCode;
  const roomMode = (location.state as any)?.mode || 'local';
  const playerFaction = (location.state as any)?.playerFaction;
  const isHost = (location.state as any)?.isHost;
  const lastProcessedMoveId = React.useRef<string | null>(null);

  React.useEffect(() => {
    runRuleEngineDevTests();

    if (roomMode === 'online') {
      onlineRoomClient.connect();
      const unsubMove = onlineRoomClient.subscribeToMove((payload) => {
        if (payload.move.id === lastProcessedMoveId.current) return;
        
        // Find piece to move
        const piece = pieces.find(p => p.x === payload.move.from.x && p.y === payload.move.from.y);
        if (piece) {
          lastProcessedMoveId.current = payload.move.id;
          performMove(piece, payload.move.to.x, payload.move.to.y, payload.move.id.startsWith('bot-'), payload.move.id);
        }
      });

      return () => {
        unsubMove();
      };
    }
  }, [pieces, roomMode]);

  // Bot Turn Trigger
  React.useEffect(() => {
    if (winner || isBotThinking) return;
    
    // In online mode, only the host drives the bots to avoid double moves
    if (roomMode === 'online' && !isHost) return;
    
    if (controlModes[turn] === 'Bot') {
      setIsBotThinking(true);
      const delay = 600 + Math.random() * 400;
      
      const timer = setTimeout(() => {
        const difficulty = config.factions[turn].difficulty;
        const decision = chooseBotMove(turn, pieces, difficulty);
        if (decision) {
          setLastBotDecision({ ...decision, difficulty });
          const piece = pieces.find(p => p.x === decision.move.from.x && p.y === decision.move.from.y)!;
          // Enhancing status with bot reason
          const botPrefix = `BOT ${turn} (${difficulty})`;
          const actionText = decision.move.captured ? `captured enemy ${getPieceName(decision.move.captured)}` : `repositioned ${getPieceName(piece.type)}`;
          setStatus(`${botPrefix}: ${decision.reason}.`);
          performMove(piece, decision.move.to.x, decision.move.to.y, true);
        } else {
          setStatus(`${turn} has no legal maneuvers. Skipping turn.`);
          const nextFct = getNextFaction(turn, pieces, eliminated);
          if (nextFct) setTurn(nextFct);
        }
        setIsBotThinking(false);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [turn, controlModes, winner]);

  const getNextFaction = (currentTurn: Faction, currentPieces: Piece[], currentEliminated: Faction[]): Faction | null => {
    const activeFactions = FACTIONS.filter(f => !currentEliminated.includes(f));
    if (activeFactions.length <= 1) return null;

    let nextIdx = (FACTIONS.indexOf(currentTurn) + 1) % FACTIONS.length;
    while (currentEliminated.includes(FACTIONS[nextIdx] as Faction)) {
      nextIdx = (nextIdx + 1) % FACTIONS.length;
    }
    return FACTIONS[nextIdx] as Faction;
  };

  const selectedPiece = pieces.find(p => p.id === selectedId) || null;

  const handlePointClick = (x: number, y: number) => {
    if (winner || isBotThinking || controlModes[turn] === 'Bot') return;
    
    // In online mode, only allow moves for the local player's faction
    if (roomMode === 'online' && playerFaction && turn !== playerFaction) {
        setStatus(`Tactical Breach: You only command the ${playerFaction} kingdom.`);
        return;
    }

    const pieceAtPoint = pieces.find(p => p.x === x && p.y === y);

    if (selectedId) {
      if (selectedPiece && selectedPiece.x === x && selectedPiece.y === y) {
        setSelectedId(null);
        setLegalMoves([]);
        return;
      }

      if (pieceAtPoint && pieceAtPoint.faction === turn) {
        setSelectedId(pieceAtPoint.id);
        const legalDest = getLegalDestinationsForPiece(pieceAtPoint, pieces, turn);
        const pseudoMoves: Move[] = legalDest.all.map(d => ({
          id: 'hint-' + Math.random(),
          pieceType: pieceAtPoint.type,
          faction: turn,
          from: { x: pieceAtPoint.x, y: pieceAtPoint.y },
          to: d,
          timestamp: new Date()
        }));
        setLegalMoves(pseudoMoves);
        return;
      }

      if (selectedPiece) {
        performMove(selectedPiece, x, y);
      }
    } else {
      if (pieceAtPoint) {
        if (pieceAtPoint.faction === turn) {
          setSelectedId(pieceAtPoint.id);
          const legalDest = getLegalDestinationsForPiece(pieceAtPoint, pieces, turn);
          const pseudoMoves: Move[] = legalDest.all.map(d => ({
            id: 'hint-' + Math.random(),
            pieceType: pieceAtPoint.type,
            faction: turn,
            from: { x: pieceAtPoint.x, y: pieceAtPoint.y },
            to: d,
            timestamp: new Date()
          }));
          setLegalMoves(pseudoMoves);
          setStatus(`${getPieceName(pieceAtPoint.type)} ready. ${legalDest.all.length} maneuvers available.`);
        } else {
          setStatus(MOVE_ERRORS.NOT_YOUR_TURN);
        }
      }
    }
  };

  const performMove = (piece: Piece, x: number, y: number, isBot = false, remoteMoveId?: string) => {
    const pieceAtPoint = pieces.find(p => p.x === x && p.y === y);
    const validation = validateMove(piece, { x, y }, pieces, turn);
    
    if (!validation.legal) {
      if (!isBot) setStatus(validation.reason || "Illegal Move");
      return;
    }

    const moveId = remoteMoveId || (isBot ? 'bot-' : '') + Math.random().toString(36).substr(2, 9);
    lastProcessedMoveId.current = moveId;
    
    const newPieces = pieces.filter(p => p.id !== piece.id);
    let capturedType: PieceType | undefined;
    let captureMessage = "";

    if (pieceAtPoint) {
      setCaptured(prev => [...prev, pieceAtPoint]);
      capturedType = pieceAtPoint.type;
      newPieces.splice(newPieces.indexOf(pieceAtPoint), 1);
      captureMessage = `${isBot ? 'BOT ' : ''}${turn} ${getPieceName(piece.type)} captured ${pieceAtPoint.faction} ${getPieceName(pieceAtPoint.type)}.`;
      setStatus(captureMessage);
    } else {
      setStatus(`${isBot ? 'BOT ' : ''}${turn} ${getPieceName(piece.type)} moved to (${x}, ${y}).`);
    }

    const movedPiece = { ...piece, x, y };
    let finalPieces = [...newPieces, movedPiece];
    
    const newEliminated = [...eliminated];
    let checkmateHappened = false;
    const debugResults: Record<string, CheckmateResult> = {};
    
    FACTIONS.forEach(f => {
      if (f !== turn && !newEliminated.includes(f)) {
        const detail = isCheckmateDetailed(f, finalPieces);
        debugResults[f] = detail;
        if (detail.checkmated) {
          newEliminated.push(f);
          finalPieces = finalPieces.filter(p => p.faction !== f);
          checkmateHappened = true;
        }
      }
    });

    setLastCheckmateDebug(debugResults);
    setPieces(finalPieces);
    if (checkmateHappened) {
      setEliminated(newEliminated);
    }

    const nextWinner = FACTIONS.find(f => !newEliminated.includes(f) && FACTIONS.filter(f2 => !newEliminated.includes(f2)).length === 1) || null;
    
    // Update Stats
    const capturedThisMove = !!pieceAtPoint;
    setMatchStats(prev => {
      const newCapturesByFaction = { ...prev.capturesByFaction };
      if (capturedThisMove) {
        newCapturesByFaction[turn] = (newCapturesByFaction[turn] || 0) + 1;
      }
      
      const newElimOrder = [...prev.eliminationOrder];
      if (checkmateHappened) {
        FACTIONS.forEach(f => {
          if (debugResults[f]?.checkmated && !newElimOrder.includes(f)) {
            newElimOrder.push(f);
          }
        });
      }

      return {
        totalMoves: prev.totalMoves + 1,
        totalCaptures: capturedThisMove ? prev.totalCaptures + 1 : prev.totalCaptures,
        totalChecks: validation.givesCheck ? prev.totalChecks + 1 : prev.totalChecks,
        totalCheckmates: checkmateHappened ? prev.totalCheckmates + 1 : prev.totalCheckmates,
        capturesByFaction: newCapturesByFaction,
        eliminationOrder: newElimOrder,
        finalMoveText: `${isBot ? 'BOT ' : ''}${turn} ${getPieceName(piece.type)} ${capturedThisMove ? 'captured ' + getPieceName(pieceAtPoint.type) : 'moved'} to (${x}, ${y})`
      };
    });

    if (nextWinner) {
      setWinner(nextWinner);
      setStatus(`THE BATTLE IS OVER. ${nextWinner.toUpperCase()} UNITES THE LAND.`);
      // Show summary after a delay
      setTimeout(() => setShowSummary(true), 1500);
    } else if (checkmateHappened) {
      setStatus(`${isBot ? 'BOT: ' : ''}CHECKMATE! ${isBot ? turn + ' delivers a fatal strike.' : 'A faction has fallen.'}`);
    } else if (validation.givesCheck) {
      const checkedNames = validation.checkedFactions?.join(', ');
      setStatus(`${isBot ? 'BOT: ' : ''}CHECK! ${checkedNames} is under attack.`);
    }

    const newMove: Move = {
      id: moveId,
      pieceType: piece.type,
      faction: turn,
      from: { x: piece.x, y: piece.y },
      to: { x, y },
      captured: capturedType,
      check: validation.givesCheck,
      checkedFactions: validation.checkedFactions,
      checkmate: checkmateHappened,
      gameWinner: nextWinner,
      timestamp: new Date()
    };
    setHistory(prev => [newMove, ...prev]);

    // V4: RecordedMove for Replay
    const newRecordedMove: RecordedMove = {
      id: moveId,
      turnNumber: history.length + 1,
      actorType: isBot ? 'bot' : 'human',
      faction: turn,
      pieceId: piece.id,
      pieceType: piece.type,
      from: { x: piece.x, y: piece.y },
      to: { x, y },
      capturedPiece: pieceAtPoint ? { type: pieceAtPoint.type, faction: pieceAtPoint.faction } : undefined,
      givesCheck: validation.givesCheck,
      checkedFactions: validation.checkedFactions,
      checkmateHappened,
      eliminatedAfterMove: checkmateHappened ? debugResults ? Object.keys(debugResults).filter(f => debugResults[f].checkmated) as Faction[] : [] : [],
      winnerAfterMove: nextWinner,
      notationText: `${getPieceName(piece.type)} ${capturedType ? 'captures ' + getPieceName(capturedType) : 'moves'} from (${piece.x},${piece.y}) to (${x},${y})`
    };
    setRecordedMoves(prev => [...prev, newRecordedMove]);

    // Online Broadcast
    if (roomMode === 'online' && !remoteMoveId) {
      onlineRoomClient.submitMove({
        roomCode,
        move: newRecordedMove,
        clientGameState: {
          currentTurn: turn,
          eliminatedFactions: newEliminated,
          winner: nextWinner,
          status: nextWinner ? 'FINISHED' : 'PLAYING'
        }
      });
    }

    setSelectedId(null);
    setLegalMoves([]);
    
    if (!nextWinner) {
      const nextFct = getNextFaction(turn, finalPieces, newEliminated);
      if (nextFct) setTurn(nextFct);
    }

    const integrity = validateBoardIntegrity(finalPieces, newEliminated);
    if (!integrity.valid) {
      console.error("Board Integrity Breach detected:", integrity.errors);
    }
  };

  const resetGame = () => {
    if (history.length > 0 && !winner && !showResetConfirm) {
      setShowResetConfirm(true);
      return;
    }
    setPieces(getInitialPieces());
    setTurn('Shu');
    setSelectedId(null);
    setLegalMoves([]);
    setHistory([]);
    setCaptured([]);
    setEliminated([]);
    setWinner(null);
    setLastCheckmateDebug({});
    setStatus("Battlefield reset to initial state.");
    setShowResetConfirm(false);
    setShowSummary(false);
    setLastBotDecision(null);
    setRecordedMoves([]);
    setIsSaved(false);
    setMatchStats({
      totalMoves: 0,
      totalCaptures: 0,
      totalChecks: 0,
      totalCheckmates: 0,
      capturesByFaction: { Shu: 0, Wei: 0, Wu: 0, None: 0 },
      eliminationOrder: []
    });

    // V4: Reset control modes to the setup config (if user changed them during game)
    setControlModes({
      Shu: config.factions.Shu.control,
      Wei: config.factions.Wei.control,
      Wu: config.factions.Wu.control,
      None: config.factions.None.control
    });
  };

  const aggressiveFaction = (() => {
    let max = 0;
    let faction: Faction | "Contested" = "Contested";
    let count = 0;
    FACTIONS.forEach(f => {
      if (matchStats.capturesByFaction[f] > max) {
        max = matchStats.capturesByFaction[f];
        faction = f;
        count = 1;
      } else if (matchStats.capturesByFaction[f] === max && max > 0) {
        count++;
      }
    });
    return count > 1 ? "Contested" : faction;
  })();

  const createMatchRecord = (): MatchRecord => ({
    id: `match-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
    ruleset: "3K_CHESS_STANDARD_V1",
    setup: config,
    winner,
    eliminatedFactions: eliminated,
    matchStats,
    initialPieces,
    moves: recordedMoves,
    finalPieces: pieces,
    source: roomCode ? { mode: "war-room-sim", roomCode } : { mode: "local" }
  });

  const handleSaveLocally = () => {
    const record = createMatchRecord();
    saveMatchRecord(record);
    setIsSaved(true);
    setStatus("Match chronicles saved to local archives.");
  };

  const handleExportMatch = () => {
    const record = createMatchRecord();
    exportMatchRecord(record);
    setStatus("Match records exported for external archives.");
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col gap-8 relative">
      {/* Match Summary Modal */}
      <AnimatePresence>
        {showSummary && winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 40 }}
              className="w-full max-w-4xl glass-dark border border-gold/20 rounded-[3rem] p-8 md:p-12 shadow-[0_0_100px_rgba(212,175,55,0.15)] relative"
            >
              <div className="absolute top-12 right-12 opacity-5 pointer-events-none">
                <Trophy size={300} className="text-gold" />
              </div>

              <div className="text-center mb-12 relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, delay: 0.2 }}
                  className="w-20 h-20 bg-gold/10 rounded-full border border-gold/30 flex items-center justify-center mx-auto mb-6"
                >
                  <Award size={40} className="text-gold" />
                </motion.div>
                <h3 className="text-4xl md:text-6xl font-serif font-black text-white mb-2 uppercase tracking-[0.2em] drop-shadow-lg">
                  Battlefield <span className="text-gold">Summary</span>
                </h3>
                <p className="text-zinc-500 font-serif italic text-lg opacity-80">
                  "The final banner rises over the Three Kingdoms."
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 relative z-10">
                {/* Winner Card */}
                <div className={cn(
                  "p-8 rounded-3xl border flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden",
                  FACTION_COLORS[winner]
                )}>
                  <div className="absolute inset-0 bg-current opacity-[0.03]" />
                  <Trophy size={48} className="mb-4 text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60 mb-2">Dominant King</span>
                  <h4 className="text-2xl font-serif font-black uppercase mb-1">{winner}</h4>
                  <span className="text-[10px] font-bold opacity-60">Control: {controlModes[winner]}</span>
                </div>

                {/* Core Stats */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                  <div className="p-6 glass-dark border border-white/5 rounded-3xl flex flex-col gap-1 items-center justify-center">
                    <Activity size={24} className="text-gold opacity-50 mb-2" />
                    <span className="text-2xl font-mono text-white font-bold">{matchStats.totalMoves}</span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Total Maneuvers</span>
                  </div>
                  <div className="p-6 glass-dark border border-white/5 rounded-3xl flex flex-col gap-1 items-center justify-center">
                    <Target size={24} className="text-gold opacity-50 mb-2" />
                    <span className="text-2xl font-mono text-white font-bold">{matchStats.totalCaptures}</span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Armies Destroyed</span>
                  </div>
                  <div className="p-6 glass-dark border border-white/5 rounded-3xl flex flex-col gap-1 items-center justify-center">
                    <ShieldAlert size={24} className="text-rose-500 opacity-50 mb-2" />
                    <span className="text-2xl font-mono text-white font-bold">{matchStats.totalChecks}</span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">General Threats</span>
                  </div>
                  <div className="p-6 glass-dark border border-white/5 rounded-3xl flex flex-col gap-1 items-center justify-center">
                    <Skull size={24} className="text-zinc-600 mb-2" />
                    <span className="text-2xl font-mono text-white font-bold">{matchStats.totalCheckmates}</span>
                    <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold">Dynasties Ended</span>
                  </div>
                </div>

                {/* Aggression Card */}
                <div className="glass-dark border border-white/5 p-8 rounded-3xl flex flex-col items-center justify-center text-center">
                  <Sword size={24} className="text-gold mb-4" />
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 font-bold mb-2">Most Aggressive</span>
                  <h4 className={cn(
                    "text-xl font-serif font-bold uppercase",
                    aggressiveFaction !== "Contested" ? FACTION_COLORS[aggressiveFaction] : "text-white"
                  )}>
                    {aggressiveFaction}
                  </h4>
                  {aggressiveFaction !== "Contested" && (
                    <span className="text-[10px] text-zinc-500 mt-1">{matchStats.capturesByFaction[aggressiveFaction]} Captures</span>
                  )}
                </div>

                {/* Final Move */}
                <div className="glass-dark border border-gold/20 p-8 rounded-3xl flex flex-col gap-2 lg:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-gold font-bold">Tactical Finale</span>
                  </div>
                  <p className="text-white text-lg font-serif italic">"{matchStats.finalMoveText}"</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-widest border-t border-white/5 pt-4 mt-2">The fatal strike that unified the realm.</p>
                </div>

                {/* Elimination Track */}
                <div className="w-full lg:col-span-3 glass-dark border border-white/5 p-8 rounded-3xl">
                  <span className="text-[9px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-6 block">Order of Elimination</span>
                  <div className="flex items-center gap-8 px-4">
                    {matchStats.eliminationOrder.length > 0 ? (
                      matchStats.eliminationOrder.map((f, i) => (
                        <div key={f} className="flex items-center gap-8 flex-1 last:flex-none">
                          <div className="flex flex-col items-center gap-2">
                             <div className={cn("w-10 h-10 rounded-full border flex items-center justify-center font-bold text-xs shadow-xl", FACTION_COLORS[f])}>
                               {i + 1}
                             </div>
                             <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">{f}</span>
                          </div>
                          {i < matchStats.eliminationOrder.length - 1 && (
                            <div className="h-px flex-1 bg-white/5 relative">
                              <Sword size={12} className="absolute left-1/2 -top-1.5 -translate-x-1/2 text-zinc-800" />
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-600 font-serif italic">No major dynasties fell before the resolution.</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row gap-4 relative z-10 mb-6">
                <button 
                  onClick={() => navigate(`/replay/local`, { state: { match: createMatchRecord() } })}
                  className="flex-1 bg-gold/10 hover:bg-gold/20 border border-gold/30 text-gold py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2"
                >
                  <PlayCircle size={16} /> Replay Match
                </button>
                <button 
                  onClick={handleExportMatch}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2"
                >
                  <Download size={16} /> Export JSON
                </button>
                <button 
                  onClick={handleSaveLocally}
                  disabled={isSaved}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-2 border",
                    isSaved 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 opacity-60 cursor-default" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  )}
                >
                  <Save size={16} /> {isSaved ? "Saved" : "Save Locally"}
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 relative z-10">
                <button 
                  onClick={resetGame}
                  className="flex-1 bg-gold hover:bg-white text-black py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-xs shadow-[0_0_30px_rgba(212,175,55,0.3)] transition-all flex items-center justify-center gap-3"
                >
                  <RotateCcw size={16} /> Play Again
                </button>
                <button 
                  onClick={() => {
                    if (roomCode) {
                      navigate(`/rooms/${roomCode}`);
                    } else {
                      navigate('/setup');
                    }
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3"
                >
                  <Settings size={16} /> {roomCode ? "To Lobby" : "Change Setup"}
                </button>
                <button 
                  onClick={() => navigate(roomCode ? `/rooms/${roomCode}` : '/')}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white py-5 rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all"
                >
                  {roomCode ? "Back to Lobby" : "Return to Stronghold"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reset Confirmation Overlay */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-dark border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <RotateCcw size={48} className="text-gold mx-auto mb-6" />
              <h3 className="text-xl font-serif font-bold text-white mb-2 uppercase tracking-widest">Restore Armies?</h3>
              <p className="text-zinc-400 text-sm mb-8 font-serif italic">"The chronicle of this battle will be erased. Do you wish to restart the cycle?"</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
                >
                  Stay
                </button>
                <button 
                  onClick={resetGame}
                  className="flex-1 py-3 rounded-xl bg-gold text-black text-xs font-bold uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)]"
                >
                  Restore
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Victory Banner */}
      <AnimatePresence>
        {winner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
          >
            <div className="relative group">
              <div className="absolute inset-[-100px] bg-gold/10 blur-[100px] rounded-full animate-pulse" />
              <div className={cn(
                "glass-dark border-4 p-12 rounded-[3rem] text-center shadow-[0_0_100px_rgba(0,0,0,0.8)] relative z-10",
                FACTION_COLORS[winner]
              )}>
                <h2 className="text-6xl md:text-8xl font-serif font-black uppercase tracking-[0.2em] mb-4 drop-shadow-2xl">VICTORY</h2>
                <div className="w-[80%] h-px bg-current mx-auto opacity-20 mb-6" />
                <p className="text-xl md:text-2xl font-serif italic tracking-widest text-white/90">"{winner.toUpperCase()} UNITES THE SEAS AND RIVERS"</p>
                <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-500 animate-bounce pointer-events-auto cursor-pointer" onClick={resetGame}>Restore the cycle to begin anew</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Info Tooltip */}
      <AnimatePresence>
        {hoveredPoint && pieces.find(p => p.x === hoveredPoint.x && p.y === hoveredPoint.y) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[80] glass-dark border border-white/10 p-4 rounded-2xl shadow-2xl w-64 pointer-events-none"
          >
            {(() => {
              const p = pieces.find(p => p.x === hoveredPoint.x && p.y === hoveredPoint.y)!;
              return (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", FACTION_COLORS[p.faction])}>{p.faction}</span>
                    <span className="text-[10px] font-mono text-zinc-500">({p.x}, {p.y})</span>
                  </div>
                  <h4 className="text-sm font-serif font-bold text-white mb-1">{getPieceName(p.type)}</h4>
                  <p className="text-[10px] text-zinc-400 italic leading-relaxed">{getPieceDescription(p.type)}</p>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Debug Panel Toggle */}
      <button 
        onClick={() => setShowDebug(!showDebug)}
        className="fixed bottom-4 right-4 z-50 bg-ink/80 backdrop-blur-md border border-white/10 text-zinc-500 hover:text-gold p-2 rounded-lg text-[8px] uppercase tracking-widest transition-all"
      >
        {showDebug ? 'Hide Debug' : 'Debug'}
      </button>

      {/* Debug info */}
      <AnimatePresence>
        {showDebug && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-16 right-4 z-50 glass-dark border border-white/10 p-4 rounded-xl text-[10px] font-mono text-zinc-400 w-64 shadow-2xl"
          >
            <div className="flex justify-between border-b border-white/5 pb-2 mb-2">
              <span className="text-gold">DEBUG CONTEXT</span>
            </div>
            <div className="space-y-1">
              <p>Turn: <span className="text-white">{turn}</span></p>
              <p>Bot Thinking: <span className={isBotThinking ? "text-gold" : "text-white"}>{isBotThinking ? 'Yes' : 'No'}</span></p>
              {lastBotDecision && (
                <div className="bg-gold/5 border border-gold/10 p-2 rounded mt-2 mb-2">
                  <p className="text-gold text-[8px] mb-1 uppercase tracking-tighter">Last Bot Intel</p>
                  <p>Difficulty: <span className="text-white uppercase">{lastBotDecision.difficulty}</span></p>
                  <p>Reason: <span className="text-white italic">"{lastBotDecision.reason}"</span></p>
                  <p>Score: <span className="text-white">{lastBotDecision.score.toFixed(2)}</span></p>
                </div>
              )}
              <p>Selected: <span className="text-white">{selectedId || 'None'}</span></p>
              {selectedPiece && (
                <>
                  <p>Type: <span className="text-white">{selectedPiece.type}</span></p>
                  <p>From: <span className="text-white">({selectedPiece.x}, {selectedPiece.y})</span></p>
                </>
              )}
              <p>Total Pieces: <span className="text-white">{pieces.length}</span></p>
              <p>History: <span className="text-white">{history.length}</span></p>
              
              {(() => {
                const integrity = validateBoardIntegrity(pieces, eliminated);
                return (
                  <div className="mt-2 text-[8px]">
                    <p className={integrity.valid ? "text-emerald-500" : "text-rose-500 font-bold"}>
                      INTEGRITY: {integrity.valid ? "SYNCHRONIZED" : "BREACHED"}
                    </p>
                    {!integrity.valid && integrity.errors.map((e, i) => <p key={i} className="text-rose-400 mt-0.5">• {e}</p>)}
                  </div>
                );
              })()}

              <div className="border-t border-white/5 pt-2 mt-2">
                <p className="text-gold mb-1">CHECKMATE DIAGNOSTICS</p>
                {FACTIONS.map(f => {
                  const res = lastCheckmateDebug[f];
                  if (!res) return null;
                  return (
                    <div key={f} className="mb-2 last:mb-0 border-l border-white/10 pl-2">
                      <p className="font-bold">{f}: <span className={res.checkmated ? "text-rose-500" : "text-emerald-500"}>{res.checkmated ? "MATED" : "SAFE"}</span></p>
                      <p>In Check: {res.inCheck ? "Yes" : "No"}</p>
                      <p>Legal Escapes: {res.totalLegalEscapeMoves}</p>
                      {res.reason && <p className="text-[8px] italic text-zinc-500">{res.reason}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <Link 
            to={roomCode ? `/rooms/${roomCode}` : "/"} 
            className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4"
          >
            <ChevronLeft size={16} /> {roomCode ? "Retreat to Council" : "Retreat to Stronghold"}
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-widest uppercase">
              3-PLAYER <span className="text-gold italic">TACTICAL BOARD</span>
            </h1>
            {roomCode && (
               <div className="bg-gold/10 border border-gold/30 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                  <span className="text-[10px] font-black text-gold uppercase tracking-[0.2em]">War Room: {roomCode}</span>
               </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/archive')}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <History size={14} className="text-gold" /> Archive
          </button>
          
          <button 
            onClick={() => {
              if (roomCode) {
                navigate(`/rooms/${roomCode}`);
              } else {
                navigate('/setup');
              }
            }}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <Settings size={14} className="text-gold" /> {roomCode ? "To Lobby" : "Change Setup"}
          </button>

          <button 
            onClick={resetGame}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
          >
            <RotateCcw size={14} className="text-gold" /> Restore Armies
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Panel: Faction Status */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-dark border border-white/5 p-6 rounded-[2rem]">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Sword size={14} className="text-gold" /> Initiative Order
            </h3>
            <div className="space-y-4">
              {FACTIONS.map((f) => {
                const isEliminated = eliminated.includes(f);
                const inCheck = !isEliminated && isFactionInCheck(f, pieces).inCheck;
                const isActive = turn === f && !winner;

                return (
                  <div 
                    key={f}
                    className={cn(
                      "flex flex-col gap-2 p-4 rounded-2xl border transition-all relative overflow-hidden",
                      isActive ? FACTION_COLORS[f] : "border-white/5 opacity-40",
                      isEliminated && "grayscale opacity-20 border-dashed"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", isEliminated ? "bg-zinc-800" : "bg-current")} />
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-bold tracking-widest uppercase text-[10px]",
                            isEliminated && "line-through text-zinc-600"
                          )}>
                            {f} {isEliminated && "(Fallen)"}
                          </span>
                          {inCheck && (
                            <span className="text-[6.5px] font-bold text-rose-500 uppercase tracking-tighter animate-pulse flex items-center gap-1">
                              <ShieldAlert size={8} /> Under Attack
                            </span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <motion.div 
                          animate={{ scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] }} 
                          transition={{ repeat: Infinity, duration: 1.5 }}
                        >
                          {isBotThinking && controlModes[f] === 'Bot' ? (
                            <div className="flex gap-1">
                              <div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:-0.3s]" />
                              <div className="w-1 h-1 bg-gold rounded-full animate-bounce [animation-delay:-0.15s]" />
                              <div className="w-1 h-1 bg-gold rounded-full animate-bounce" />
                            </div>
                          ) : (
                            <Zap size={16} className="text-gold fill-gold drop-shadow-[0_0_8px_rgba(212,175,55,0.5)]" fill="currentColor" />
                          )}
                        </motion.div>
                      )}
                    </div>

                    {!isEliminated && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-current/10">
                        <span className="text-[8px] uppercase tracking-widest opacity-60">Control</span>
                        <button 
                          onClick={() => setControlModes(prev => ({
                            ...prev,
                            [f]: prev[f] === 'Human' ? 'Bot' : 'Human'
                          }))}
                          className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-bold transition-all",
                            controlModes[f] === 'Bot' ? "bg-gold text-black shadow-lg" : "bg-white/5 text-current hover:bg-white/10"
                          )}
                        >
                          {controlModes[f].toUpperCase()}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-dark border border-white/5 p-6 rounded-[2rem]">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <ShieldAlert size={14} className="text-gold" /> Fallen Warriors
            </h3>
            <div className="flex flex-wrap gap-2 min-h-[60px]">
              <AnimatePresence>
                {captured.map((p, idx) => (
                  <motion.div
                    key={`${p.id}-${idx}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[8px] font-bold border",
                      FACTION_COLORS[p.faction]
                    )}
                  >
                    {p.type}
                  </motion.div>
                ))}
              </AnimatePresence>
              {captured.length === 0 && <span className="text-[10px] text-zinc-700 uppercase tracking-widest font-serif italic">The field is clean</span>}
            </div>
          </div>
        </div>

        {/* Main Board Area */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[750px] aspect-square p-2 md:p-6 bg-[#0a0a0a] border-4 border-[#1a1a1a] rounded-sm shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Wooden/Parchment Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
            <div className="absolute inset-0 shadow-[inset_0_0_120px_rgba(0,0,0,0.9)] pointer-events-none" />

            {/* Traditional Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none p-2 md:p-6">
              <svg viewBox="0 0 170 170" className="w-full h-full stroke-zinc-700/60 fill-none" strokeWidth="0.5">
                {/* Vertical Lines */}
                {[...Array(17)].map((_, i) => (
                  <line key={`v-${i}`} x1={i * 10 + 5} y1={5} x2={i * 10 + 5} y2={165} opacity={i < 4 || i > 12 ? 0.3 : 1} />
                ))}
                {/* Horizontal Lines */}
                {[...Array(17)].map((_, i) => (
                  <line key={`h-${i}`} x1={5} y1={i * 10 + 5} x2={165} y2={i * 10 + 5} opacity={i < 4 || i > 12 ? 0.3 : 1} />
                ))}
                
                {/* Palace Diagonals - Shu (Top) */}
                <g className="stroke-rose-900/40">
                  <line x1={75} y1={5} x2={95} y2={25} />
                  <line x1={95} y1={5} x2={75} y2={25} />
                </g>
                
                {/* Palace Diagonals - Wu (Left) */}
                <g className="stroke-emerald-900/40">
                  <line x1={5} y1={75} x2={25} y2={95} />
                  <line x1={25} y1={75} x2={5} y2={95} />
                </g>
                
                {/* Palace Diagonals - Wei (Bottom) */}
                <g className="stroke-blue-900/40">
                  <line x1={75} y1={145} x2={95} y2={165} />
                  <line x1={95} y1={145} x2={75} y2={165} />
                </g>

                {/* River Boundary Decorations */}
                <g className="stroke-gold/20 stroke-[0.4] stroke-dash-2">
                  {/* Vertical River */}
                  <line x1={65} y1={45} x2={65} y2={125} />
                  {/* Horizontal River Top */}
                  <line x1={45} y1={65} x2={125} y2={65} />
                  {/* Horizontal River Bottom */}
                  <line x1={45} y1={105} x2={125} y2={105} />
                </g>
              </svg>
            </div>

            {/* Faction Large Aesthetic Character Labels */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center p-16 select-none">
              <div className="text-[120px] font-serif text-rose-900/10 -mt-8">蜀</div>
              <div className="flex justify-between w-full">
                <div className="text-[120px] font-serif text-emerald-900/10 -ml-8">吴</div>
                <div className="text-[120px] font-serif text-blue-900/10 -mr-8 invisible">魏</div>
              </div>
              <div className="text-[120px] font-serif text-blue-900/10 -mb-8">魏</div>
            </div>

            {/* Central Battlefield Legend */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <span className="text-[8px] uppercase tracking-[1em] text-zinc-800 font-serif translate-y-[-40px]">Inter-Kingdom River</span>
              <span className="text-[8px] uppercase tracking-[1em] text-zinc-800 font-serif translate-y-[40px]">Chasm of Three Fates</span>
            </div>

            {/* Interactive Grid Points */}
            <div 
              className="grid gap-0 w-full h-full relative z-10"
              style={{ 
                gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                gridTemplateRows: `repeat(${ROWS}, 1fr)` 
              }}
            >
              {[...Array(ROWS)].map((_, y) => (
                [...Array(COLS)].map((_, x) => {
                  const piece = pieces.find(p => p.x === x && p.y === y);
                  const isSelected = selectedId === piece?.id;
                  
                  // Check if this piece is an attacker for any faction in check
                  let isAttacker = false;
                  FACTIONS.forEach(f => {
                    const check = isFactionInCheck(f, pieces);
                    if (check.inCheck && check.attackers.some(a => a.id === piece?.id)) {
                      isAttacker = true;
                    }
                  });

                  return (
                    <div 
                      key={`${x}-${y}`}
                      onClick={() => handlePointClick(x, y)}
                      className="relative flex items-center justify-center cursor-pointer group"
                    >
                      {/* Grid Intersection Crosshair */}
                      <div className="absolute w-2 h-0.5 bg-zinc-800/20 group-hover:bg-gold/20" />
                      <div className="absolute h-2 w-0.5 bg-zinc-800/20 group-hover:bg-gold/20" />
                      
                      {/* Legal Move Indicators */}
                      {legalMoves.some(m => m.to.x === x && m.to.y === y) && (
                        <div className={cn(
                          "absolute w-3 h-3 rounded-full z-40",
                          pieces.some(p => p.x === x && p.y === y) 
                            ? "border-2 border-rose-500 animate-pulse bg-rose-500/20 scale-150 shadow-[0_0_10px_rgba(244,63,94,0.5)]" 
                            : "bg-gold/40 border border-gold/60"
                        )} />
                      )}

                      {piece && (
                        <motion.div 
                          layoutId={piece.id}
                          onMouseEnter={() => setHoveredPoint({ x, y })}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className={cn(
                            "absolute w-[80%] h-[80%] rounded-full flex flex-col items-center justify-center font-serif font-bold text-[9px] md:text-sm shadow-[0_5px_15px_rgba(0,0,0,0.5)] border-2 transition-all cursor-grab active:cursor-grabbing",
                            FACTION_COLORS[piece.faction],
                            isSelected ? "scale-125 border-gold shadow-gold/30 z-30 ring-4 ring-gold/10" : "hover:scale-110 z-20",
                            "ring-1 ring-white/10",
                            (piece.type === 'G' && isFactionInCheck(piece.faction, pieces).inCheck) && "animate-pulse ring-4 ring-rose-500/40 border-rose-500 shadow-rose-500/50",
                            isAttacker && "ring-2 ring-gold/50 shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                          )}
                        >
                          <span className="relative z-10 leading-none">{piece.type}</span>
                          <span className="text-[6px] opacity-40 mt-0.5 uppercase tracking-tighter">{piece.faction[0]}</span>
                          
                          {/* Polished token depth effect */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/20 via-transparent to-white/10" />
                          <div className="absolute inset-1 rounded-full border border-white/5 opacity-30 shadow-inner" />
                          
                          {isSelected && (
                            <motion.div 
                              layoutId="selection-glow"
                              className="absolute inset-[-4px] rounded-full border border-gold/40 animate-pulse" 
                            />
                          )}
                        </motion.div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex items-center gap-4 py-4 px-8 glass-dark border border-white/5 rounded-2xl text-zinc-400 text-[10px] font-bold uppercase tracking-widest shadow-xl max-w-lg text-center">
            <Info size={14} className="text-gold flex-shrink-0" />
            <span>{status}</span>
          </div>
        </div>

        {/* Right Panel: History */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-dark border border-white/5 p-6 rounded-[2rem] h-[500px] overflow-hidden flex flex-col">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <History size={14} className="text-gold" /> Battlefield Chronology
            </h3>
            <div className="space-y-3 overflow-y-auto flex-grow pr-2 scrollbar-none">
              {history.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col gap-2 group hover:bg-white/[0.04] transition-colors relative transition-all first:bg-white/[0.05] first:border-gold/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn("px-2 py-0.5 rounded text-[8px] font-bold uppercase", FACTION_COLORS[m.faction])}>
                        {m.id.startsWith('bot-') ? 'BOT ' : ''}{m.faction}
                      </span>
                      <div className="text-xs font-bold text-zinc-200">{getPieceName(m.pieceType)}</div>
                    </div>
                    <div className="text-[9px] text-zinc-600 font-mono">
                      ({m.from.x},{m.from.y}) → ({m.to.x},{m.to.y})
                    </div>
                  </div>
                  
                  <div className="text-[10px] text-zinc-500 font-serif italic">
                    {m.captured ? (
                      <span>Destroyed {m.captured} at ({m.to.x}, {m.to.y}).</span>
                    ) : (
                      <span>Advanced position.</span>
                    )}
                    {m.check && <span className="text-gold font-bold ml-1 flex items-center gap-1"><ShieldAlert size={8} /> KING IN PERIL!</span>}
                    {m.checkmate && <span className="text-rose-500 font-bold ml-1 block mt-1 uppercase tracking-widest text-[8px]">Checkmate: Dominion Fallen</span>}
                    {m.gameWinner && <span className="text-gold font-bold block mt-1 uppercase tracking-[0.2em] animate-pulse">Unity Achieved: {m.gameWinner} Wins</span>}
                  </div>
                </div>
              ))}
              {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <History size={32} className="mb-4" />
                  <p className="text-[10px] uppercase tracking-widest italic font-serif">Silence before the storm</p>
                </div>
              )}
            </div>
          </div>

          <div className="p-8 glass-dark border border-gold/10 rounded-[2rem] text-center shadow-lg">
            <h4 className="text-[10px] font-bold text-gold uppercase tracking-[0.4em] mb-4">Tactical Insight</h4>
            <p className="text-zinc-500 text-[11px] leading-relaxed italic font-serif">
              "The Three Kingdoms are locked. Advancing into the center river boundary exposes your flanks to the third dominion."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Zap({ size, className, fill }: { size: number, className?: string, fill?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill={fill || "none"} 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
