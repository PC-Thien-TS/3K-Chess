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
} from '@/src/rules/classicThreeKingdomRules';
import { chooseBotMove } from '@/src/ai/botAI';
import { runRuleEngineDevTests } from '@/src/rules/threeKingdomRules.devTests';
import { useMatchContext } from '@/src/context/MatchContext';
import { saveMatchRecord, exportMatchRecord } from '@/src/storage/localMatchArchive';
import { Save, Download, PlayCircle } from 'lucide-react';
import { onlineRoomClient } from '@/src/services/onlineRoomClient';
import BoardPieceToken from '@/src/components/BoardPieceToken';
import AuthenticBoard from '@/src/components/boards/AuthenticBoard';
import { DEFAULT_GAME_MODE, GAME_MODE_RULESETS, normalizeGameMode } from '@/shared/gameModes';

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

function ClassicPracticeBoard() {
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
  const [appliedMoveIds, setAppliedMoveIds] = useState<Set<string>>(new Set());
  const [lastSyncEvent, setLastSyncEvent] = useState<string | null>(null);

  const roomCode = (location.state as any)?.roomCode;
  const roomMode = (location.state as any)?.mode || 'local';
  const playerFaction = (location.state as any)?.playerFaction;
  const isHost = (location.state as any)?.isHost;
  const lastProcessedMoveId = React.useRef<string | null>(null);
  const botTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestMove = history[0] || null;
  const isRemoteWaiting =
    roomMode === 'online' &&
    !!playerFaction &&
    turn !== playerFaction &&
    controlModes[turn] !== 'Bot' &&
    !winner;
  const devLog = (...args: unknown[]) => {
    if ((import.meta as any).env.DEV) {
      console.log(...args);
    }
  };

  const getNextFaction = (currentTurn: Faction, currentPieces: Piece[], currentEliminated: Faction[]): Faction | null => {
    const activeFactions = FACTIONS.filter(f => !currentEliminated.includes(f));
    if (activeFactions.length <= 1) return null;

    let nextIdx = (FACTIONS.indexOf(currentTurn) + 1) % FACTIONS.length;
    while (currentEliminated.includes(FACTIONS[nextIdx] as Faction)) {
      nextIdx = (nextIdx + 1) % FACTIONS.length;
    }
    return FACTIONS[nextIdx] as Faction;
  };

  const performMove = (piece: Piece, x: number, y: number, isBot = false, remoteMoveId?: string) => {
    const pieceAtPoint = pieces.find(p => p.x === x && p.y === y);
    const validation = validateMove(piece, { x, y }, pieces, turn);
    
    if (!validation.legal) {
      if (!isBot) setStatus(validation.reason || "Illegal Move");
      return null;
    }

    const moveId = remoteMoveId || (isBot ? 'bot-' : '') + Math.random().toString(36).substr(2, 9);
    lastProcessedMoveId.current = moveId;
    setAppliedMoveIds(prev => new Set(prev).add(moveId));
    
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

    return moveId;
  };

  const handlePointClick = (x: number, y: number) => {
    if (winner || isBotThinking || controlModes[turn] === 'Bot') return;
    
    // In online mode, only allow moves for the local player's faction
    if (roomMode === 'online' && playerFaction && turn !== playerFaction) {
        setStatus(`Tactical Breach: You only command the ${playerFaction} kingdom.`);
        return;
    }

    const pieceAtPoint = pieces.find(p => p.x === x && p.y === y);

    if (selectedId) {
      const selectedPieceCurrent = pieces.find(p => p.id === selectedId) || null;
      if (selectedPieceCurrent && selectedPieceCurrent.x === x && selectedPieceCurrent.y === y) {
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

      if (selectedPieceCurrent) {
        performMove(selectedPieceCurrent, x, y);
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

  const performMoveRef = React.useRef(performMove);
  React.useEffect(() => {
    performMoveRef.current = performMove;
  }, [performMove]);

  const piecesRef = React.useRef<Piece[]>(pieces);
  React.useEffect(() => {
    piecesRef.current = pieces;
  }, [pieces]);

  const turnRef = React.useRef<Faction>(turn);
  React.useEffect(() => {
    turnRef.current = turn;
  }, [turn]);

  const controlModesRef = React.useRef(controlModes);
  React.useEffect(() => {
    controlModesRef.current = controlModes;
  }, [controlModes]);

  const winnerRef = React.useRef<Faction | null>(winner);
  React.useEffect(() => {
    winnerRef.current = winner;
  }, [winner]);

  const eliminatedRef = React.useRef<Faction[]>(eliminated);
  React.useEffect(() => {
    eliminatedRef.current = eliminated;
  }, [eliminated]);

  const configRef = React.useRef(config);
  React.useEffect(() => {
    configRef.current = config;
  }, [config]);

  const appliedMoveIdsRef = React.useRef(appliedMoveIds);
  React.useEffect(() => {
    appliedMoveIdsRef.current = appliedMoveIds;
  }, [appliedMoveIds]);

  React.useEffect(() => {
    runRuleEngineDevTests();

    if (roomMode === 'online') {
      const wsUrl = (import.meta as any).env.VITE_WS_URL;
      if (!wsUrl) {
         setStatus("Tactical Breach: WebSocket server not configured. Online synchrony unavailable.");
         return;
      }
      onlineRoomClient.connect();
      const unsubMove = onlineRoomClient.subscribeToMove((payload) => {
        const syncServerState = () => {
          if (!payload.serverState) return;
          setTurn(payload.serverState.currentTurn as Faction);
          setEliminated(payload.serverState.eliminatedFactions as Faction[]);
          setWinner(payload.serverState.winner as Faction | null);
        };

        setLastSyncEvent('MOVE_RECEIVED');
        if (payload.move.id === lastProcessedMoveId.current || appliedMoveIdsRef.current.has(payload.move.id)) {
           syncServerState();
           if ((import.meta as any).env.DEV) {
              console.log(`[Strategic Sync] Skipping already applied move: ${payload.move.id}`);
           }
           return;
        }
        
        // Find piece to move using ref to avoid stale state in subscription
        const piece = piecesRef.current.find(p => p.x === payload.move.from.x && p.y === payload.move.from.y);
        if (piece) {
          lastProcessedMoveId.current = payload.move.id;
          setAppliedMoveIds(prev => new Set(prev).add(payload.move.id));
          performMoveRef.current(piece, payload.move.to.x, payload.move.to.y, payload.move.id.startsWith('bot-'), payload.move.id);
          syncServerState();
        }
      });

      return () => {
        unsubMove();
      };
    }
  }, [roomMode]); // Only re-run if roomMode changes

  // Bot Turn Trigger
  React.useEffect(() => {
    if (botTimerRef.current) {
      clearTimeout(botTimerRef.current);
      botTimerRef.current = null;
    }

    const currentControl = controlModes[turn];
    devLog('[Bot Turn] detected', {
      roomMode,
      turn,
      controlMode: currentControl,
      isHost,
      playerFaction,
      botThinking: isBotThinking,
      pieceCount: pieces.length
    });

    if (winner || isBotThinking || currentControl !== 'Bot') {
      return;
    }

    if (roomMode === 'online' && !isHost) {
      devLog('[Bot Turn] skipped non-host online bot', {
        roomMode,
        turn,
        controlMode: currentControl,
        isHost,
        playerFaction,
        botThinking: isBotThinking,
        pieceCount: pieces.length
      });
      return;
    }

    setIsBotThinking(true);
    const delay = 600 + Math.random() * 400;

    botTimerRef.current = setTimeout(() => {
      const activeTurn = turnRef.current;
      const activeWinner = winnerRef.current;
      const activeControl = controlModesRef.current[activeTurn];

      if (activeWinner || activeControl !== 'Bot') {
        setIsBotThinking(false);
        return;
      }

      try {
        const difficulty = configRef.current.factions[activeTurn].difficulty;
        const currentPieces = piecesRef.current;
        const decision = chooseBotMove(activeTurn, currentPieces, difficulty);

        if (!decision) {
          devLog('[Bot Turn] no legal moves', {
            roomMode,
            turn: activeTurn,
            controlMode: activeControl,
            isHost,
            playerFaction,
            botThinking: true,
            pieceCount: currentPieces.length
          });
          setStatus(`${activeTurn} has no legal maneuvers. Skipping turn.`);
          const nextFct = getNextFaction(activeTurn, currentPieces, eliminatedRef.current);
          if (nextFct) {
            setTurn(nextFct);
          }
          return;
        }

        setLastBotDecision({ ...decision, difficulty });
        const piece = currentPieces.find(p => p.x === decision.move.from.x && p.y === decision.move.from.y);
        if (!piece) {
          setStatus(`Bot execution failed: unable to locate ${activeTurn} unit at (${decision.move.from.x}, ${decision.move.from.y}).`);
          return;
        }

        const botPrefix = `BOT ${activeTurn} (${difficulty})`;
        setStatus(`${botPrefix}: ${decision.reason}.`);
        devLog('[Bot Turn] selected move', {
          turn: activeTurn,
          from: decision.move.from,
          to: decision.move.to,
          captured: decision.move.captured,
          score: decision.score,
          reason: decision.reason
        });

        const executionLabel = roomMode === 'online'
          ? '[Bot Turn] host submitting online move'
          : '[Bot Turn] running locally';
        const moveId = performMoveRef.current(piece, decision.move.to.x, decision.move.to.y, true);
        devLog(executionLabel, {
          moveId,
          turn: activeTurn,
          from: decision.move.from,
          to: decision.move.to
        });
      } finally {
        botTimerRef.current = null;
        setIsBotThinking(false);
      }
    }, delay);

    return () => {
      if (botTimerRef.current) {
        clearTimeout(botTimerRef.current);
        botTimerRef.current = null;
      }
    };
  }, [turn, controlModes, winner, roomMode, isHost, playerFaction, pieces.length]);

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
    ruleset: GAME_MODE_RULESETS.classic,
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

  const selectedPiece = pieces.find(p => p.id === selectedId) || null;

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex flex-col gap-8 relative">
      {/* Match Summary Modal */}
      <AnimatePresence>
        {showSummary && winner && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/98 backdrop-blur-3xl p-4 overflow-y-auto"
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 100 }}
              className="w-full max-w-5xl glass-dark border border-gold/30 rounded-[4rem] p-10 md:p-16 shadow-[0_0_150px_rgba(212,175,55,0.2)] relative"
            >
              {/* Background Crest (Extreme Subtle) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-serif font-black opacity-[0.015] pointer-events-none select-none">
                {winner[0]}
              </div>

              <div className="text-center mb-16 relative z-10">
                <motion.div
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, delay: 0.3 }}
                  className="w-24 h-24 bg-gold/10 rounded-3xl border-2 border-gold/30 flex items-center justify-center mx-auto mb-8 shadow-2xl"
                >
                  <Trophy size={48} className="text-gold drop-shadow-[0_0_15px_rgba(212,175,55,0.8)]" />
                </motion.div>
                <h3 className="text-5xl md:text-8xl font-serif font-black text-white mb-4 uppercase tracking-[0.25em] drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                   REALM <span className="text-gold italic">UNITED</span>
                </h3>
                <div className="flex items-center justify-center gap-4 opacity-50">
                   <div className="w-12 h-px bg-white" />
                   <p className="text-zinc-400 font-serif italic text-xl tracking-widest leading-none">
                      The {winner} Dynasty reigns supreme
                   </p>
                   <div className="w-12 h-px bg-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16 relative z-10">
                {/* Winner Card (Hero) */}
                <div className={cn(
                  "lg:col-span-4 p-10 rounded-[3rem] border-2 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group",
                  FACTION_COLORS[winner]
                )}>
                  <div className="absolute inset-0 bg-current opacity-[0.05] group-hover:scale-110 transition-transform duration-1000" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/60 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10">
                    <span className="text-[12px] font-black uppercase tracking-[0.5em] opacity-60 mb-6 block">Lord Commander</span>
                    <div className="w-32 h-32 rounded-full border-4 border-current/30 flex items-center justify-center mb-6 shadow-2xl bg-black/40">
                       <span className="text-6xl font-serif font-black">{winner[0]}</span>
                    </div>
                    <h4 className="text-4xl font-serif font-black uppercase mb-2 tracking-tighter italic">{winner}</h4>
                    <div className="w-8 h-1 bg-current mx-auto mb-4 opacity-30" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 bg-current/10 px-4 py-1.5 rounded-full border border-current/20">
                      Control: {controlModes[winner]}
                    </span>
                  </div>
                </div>

                {/* Tactical Analytics Grid */}
                <div className="lg:col-span-8 space-y-6">
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-8 glass-dark border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-2 group hover:bg-white/[0.05] transition-all">
                        <Activity size={24} className="text-gold opacity-50 mb-1 group-hover:scale-125 transition-transform" />
                        <span className="text-3xl font-mono text-white font-black">{matchStats.totalMoves}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Maneuvers</span>
                      </div>
                      <div className="p-8 glass-dark border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-2 group hover:bg-white/[0.05] transition-all">
                        <Target size={24} className="text-gold opacity-50 mb-1 group-hover:scale-125 transition-transform" />
                        <span className="text-3xl font-mono text-white font-black">{matchStats.totalCaptures}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Captures</span>
                      </div>
                      <div className="p-8 glass-dark border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-2 group hover:bg-white/[0.05] transition-all">
                        <ShieldAlert size={24} className="text-rose-500 opacity-50 mb-1 group-hover:scale-125 transition-transform" />
                        <span className="text-3xl font-mono text-white font-black">{matchStats.totalChecks}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Threats</span>
                      </div>
                      <div className="p-8 glass-dark border border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-2 group hover:bg-white/[0.05] transition-all">
                        <Skull size={24} className="text-zinc-600 mb-1 group-hover:scale-125 transition-transform" />
                        <span className="text-3xl font-mono text-white font-black">{matchStats.totalCheckmates}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Checkmates</span>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Elimination Flow */}
                      <div className="p-8 glass-dark border border-white/5 rounded-[2rem] flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 mb-6 font-sans">Elimination Sequence</span>
                        <div className="flex-1 flex items-center justify-around gap-2 px-2">
                           {matchStats.eliminationOrder.length > 0 ? (
                             matchStats.eliminationOrder.map((f, i) => (
                               <React.Fragment key={f}>
                                  <div className="flex flex-col items-center gap-2">
                                     <div className={cn("w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-xs shadow-xl", FACTION_COLORS[f])}>
                                       {i + 1}
                                     </div>
                                     <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{f[0]}</span>
                                  </div>
                                  {i < matchStats.eliminationOrder.length - 1 && (
                                    <div className="w-8 h-px bg-white/10" />
                                  )}
                               </React.Fragment>
                             ))
                           ) : (
                             <span className="text-zinc-700 italic text-[10px] uppercase font-black font-serif tracking-widest">No major collapses</span>
                           )}
                        </div>
                      </div>

                      {/* Final Blow Lore */}
                      <div className="p-8 glass-dark border border-gold/20 rounded-[2rem] flex flex-col gap-3 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gold/[0.01] pointer-events-none" />
                        <div className="flex items-center gap-3 mb-1">
                           <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gold">Final Chronicle</span>
                        </div>
                        <p className="text-white text-lg font-serif italic leading-relaxed tracking-tight group-hover:scale-[1.02] transition-transform duration-700">
                           "{matchStats.finalMoveText}"
                        </p>
                        <p className="text-zinc-600 text-[8px] font-black uppercase tracking-[0.4em] border-t border-white/5 pt-4 mt-1">
                           Archived in the Imperial Library
                        </p>
                      </div>
                   </div>
                </div>
              </div>

              <div className="flex flex-col xl:flex-row gap-4 relative z-10 mb-8">
                 <button 
                  onClick={() => navigate(`/replay/local`, { state: { match: createMatchRecord() } })}
                  className="flex-[1.5] bg-gold text-black py-4 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-[0_10px_40px_rgba(212,175,55,0.3)] hover:bg-white hover:scale-[1.02] active:scale-95"
                >
                  <PlayCircle size={18} /> Replay Battle
                </button>
                <button 
                  onClick={handleSaveLocally}
                  disabled={isSaved}
                  className={cn(
                    "flex-1 py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 border shadow-xl hover:scale-[1.02] active:scale-95",
                    isSaved 
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 opacity-60 cursor-default" 
                      : "bg-white/5 hover:bg-white/10 border-white/10 text-white"
                  )}
                >
                  <Save size={18} /> {isSaved ? "Chronicle Saved" : "Archive Domination"}
                </button>
                <button 
                  onClick={handleExportMatch}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95"
                >
                  <Download size={18} className="text-gold" /> Export JSON
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-4 relative z-10">
                <button 
                  onClick={resetGame}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-xs transition-all flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95"
                >
                  <RotateCcw size={20} className="text-gold" /> Begin New Cycle
                </button>
                <button 
                  onClick={() => {
                    if (roomCode) {
                      navigate(`/rooms/${roomCode}`);
                    } else {
                      navigate(`/setup?mode=${config.gameMode}`);
                    }
                  }}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-xs transition-all flex items-center justify-center gap-4 hover:scale-[1.02] active:scale-95"
                >
                  <Settings size={20} className="text-gold" /> {roomCode ? "Modify Council" : "Adjust Strategy"}
                </button>
                <button 
                  onClick={() => navigate(roomCode ? `/rooms/${roomCode}` : '/')}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-500 hover:text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all hover:scale-[1.02] active:scale-95"
                >
                  {roomCode ? "Retreat to Lobby" : "Return to Stronghold"}
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
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex-1">
          <Link 
            to={roomCode ? `/rooms/${roomCode}` : "/"} 
            className="group flex items-center gap-2 text-zinc-500 hover:text-gold transition-all text-[10px] font-black uppercase tracking-[0.3em] mb-4"
          >
            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> 
            {roomCode ? "Retreat to Council" : "Retreat to Stronghold"}
          </Link>
          <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
            <h1 className="text-4xl md:text-6xl font-serif font-black text-white tracking-widest uppercase leading-none">
              3-PLAYER <span className="text-gold italic block md:inline">TACTICAL BOARD</span>
            </h1>
            {roomCode && (
               <div className="bg-gold/5 border border-gold/20 px-6 py-3 rounded-2xl flex items-center gap-4 shadow-[0_0_40px_rgba(212,175,55,0.05)] backdrop-blur-sm self-start md:self-auto">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 rounded-full bg-gold animate-ping absolute inset-0" />
                    <div className="w-2.5 h-2.5 rounded-full bg-gold relative z-10" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">War Room Chamber</span>
                    <span className="text-sm font-mono font-black text-gold uppercase tracking-[0.2em]">{roomCode}</span>
                  </div>
               </div>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            onClick={() => navigate('/archive')}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            <History size={16} className="text-gold" /> Archive
          </button>
          
          <button 
            onClick={() => {
              if (roomCode) {
                navigate(`/rooms/${roomCode}`);
              } else {
                navigate(`/setup?mode=${config.gameMode}`);
              }
            }}
            className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all"
          >
            <Settings size={16} className="text-gold" /> {roomCode ? "To Lobby" : "Change Setup"}
          </button>

          <button 
            onClick={resetGame}
            className="flex items-center gap-3 bg-gold/10 hover:bg-gold text-gold hover:text-black border border-gold/10 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_20px_rgba(212,175,55,0.1)]"
          >
            <RotateCcw size={16} /> Restore Armies
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Panel: Faction Status */}
        <div className="lg:col-span-3 space-y-8">
          <div className="glass-dark border border-white/5 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
            {/* Subtle Texture Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none" />
            
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-10 flex items-center gap-3 relative z-10">
              <Sword size={16} className="text-gold" /> Initiative Order
            </h3>
            <div className="space-y-6 relative z-10">
              {FACTIONS.map((f) => {
                const isEliminated = eliminated.includes(f);
                const inCheck = !isEliminated && isFactionInCheck(f, pieces).inCheck;
                const isActive = turn === f && !winner;

                return (
                  <div 
                    key={f}
                    className={cn(
                      "flex flex-col gap-3 p-5 rounded-[2rem] border transition-all duration-700 relative group overflow-hidden",
                      isActive 
                        ? cn("shadow-2xl translate-x-2", FACTION_COLORS[f]) 
                        : "border-white/5 bg-white/[0.02] opacity-40 hover:opacity-70",
                      isEliminated && "grayscale opacity-10 border-dashed border-zinc-800 scale-95"
                    )}
                  >
                    {/* Active Background Glow */}
                    {isActive && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.1 }}
                        className="absolute inset-0 bg-white"
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-3 h-3 rounded-full transition-all duration-500",
                          isEliminated ? "bg-zinc-800" : "bg-current",
                          isActive && "animate-pulse shadow-[0_0_12px_currentColor]"
                        )} />
                        <div className="flex flex-col">
                          <span className={cn(
                            "font-black tracking-[0.15em] uppercase text-sm font-serif",
                            isEliminated && "text-zinc-700"
                          )}>
                            {f} {isEliminated && "(Fallen)"}
                          </span>
                          {inCheck && (
                            <div className="flex items-center gap-1.5 mt-1">
                               <ShieldAlert size={10} className="text-rose-500" />
                               <span className="text-[8px] font-black text-rose-500 uppercase tracking-widest animate-pulse">
                                 Under Attack
                               </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <motion.div 
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="bg-black/20 p-2 rounded-xl"
                          >
                            {isBotThinking && controlModes[f] === 'Bot' ? (
                              <div className="flex gap-1 py-1">
                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1 h-1 bg-gold rounded-full" />
                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1 h-1 bg-gold rounded-full" />
                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1 h-1 bg-gold rounded-full" />
                              </div>
                            ) : (
                              <Zap size={18} className="text-gold drop-shadow-[0_0_12px_rgba(212,175,55,0.8)]" fill="currentColor" />
                            )}
                          </motion.div>
                        )}
                        <span className="w-8 h-8 rounded-full border border-current/10 flex items-center justify-center font-serif font-black text-[10px] opacity-20">
                          {f[0]}
                        </span>
                      </div>
                    </div>

                    {!isEliminated && (
                      <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-current/10">
                          <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.3em] opacity-40">
                             <span>Commander Unit</span>
                             <span>{controlModes[f]}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setControlModes(prev => ({
                                  ...prev,
                                  [f]: prev[f] === 'Human' ? 'Bot' : 'Human'
                                }));
                            }}
                            className={cn(
                              "w-full py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.25em] transition-all border",
                              controlModes[f] === 'Bot' 
                                ? "bg-gold text-black border-gold shadow-lg" 
                                : "bg-white/5 text-current hover:bg-white/10 border-current/10"
                            )}
                          >
                            Recruit {controlModes[f] === 'Bot' ? 'Warrior' : 'Bot'}
                          </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-dark border border-white/5 p-8 rounded-[3rem] shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-rose-500/[0.02] pointer-events-none" />
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-10 flex items-center gap-3 relative z-10">
              <Skull size={16} className="text-zinc-700" /> Fallen Warriors
            </h3>
            <div className="flex flex-wrap gap-3 min-h-[120px] relative z-10">
              <AnimatePresence>
                {captured.map((p, idx) => (
                  <motion.div
                    key={`${p.id}-${idx}`}
                    initial={{ scale: 0, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    className={cn(
                      "w-10 h-10 rounded-2xl flex items-center justify-center text-[10px] font-black border transition-all hover:scale-110 hover:z-20 shadow-lg",
                      FACTION_COLORS[p.faction]
                    )}
                  >
                     <div className="absolute inset-0 bg-black/40 rounded-2xl -z-10" />
                     {p.type}
                  </motion.div>
                ))}
              </AnimatePresence>
              {captured.length === 0 && (
                <div className="w-full flex flex-col items-center justify-center gap-4 py-6 opacity-20 filter grayscale">
                   <Target size={32} strokeWidth={1} />
                   <span className="text-[10px] font-black uppercase tracking-[0.4em]">The field is clean</span>
                </div>
              )}
            </div>
            <div className={cn(
              "mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[9px] font-black uppercase tracking-widest transition-opacity duration-700",
              captured.length > 0 ? "opacity-40" : "opacity-10"
            )}>
              <span>Casualty Count</span>
              <span className="text-white font-mono">{captured.length} Units</span>
            </div>
          </div>
        </div>

        {/* Main Board Area */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="relative w-full max-w-[820px] aspect-square overflow-hidden rounded-[2.25rem] border border-[#5d4926]/40 bg-[#100d09] p-3 sm:p-4 md:p-7 shadow-[0_28px_80px_rgba(0,0,0,0.82)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(244,213,141,0.12),transparent_34%),radial-gradient(circle_at_18%_48%,rgba(20,83,45,0.14),transparent_26%),radial-gradient(circle_at_82%_82%,rgba(30,64,175,0.16),transparent_26%),linear-gradient(180deg,#2f2418_0%,#19120d_22%,#0d0a08_100%)]" />
            <div className="absolute inset-[1.25%] rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(0,0,0,0.35))]" />
            <div className="absolute inset-[2.2%] rounded-[1.8rem] border border-black/35 shadow-[inset_0_0_80px_rgba(0,0,0,0.72)]" />
            <div className="absolute left-[24%] top-[4%] h-[22%] w-[52%] rounded-full bg-rose-500/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute left-[4%] top-[24%] h-[52%] w-[22%] rounded-full bg-emerald-500/[0.08] blur-3xl pointer-events-none" />
            <div className="absolute left-[24%] bottom-[4%] h-[22%] w-[52%] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
            <div className="absolute inset-0 pointer-events-none opacity-[0.09] mix-blend-overlay [background-image:linear-gradient(120deg,rgba(255,255,255,0.16)_0,transparent_22%,rgba(255,255,255,0.08)_36%,transparent_52%,rgba(0,0,0,0.18)_72%,transparent_100%)]" />

            {/* Traditional Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none p-3 sm:p-4 md:p-7">
              <svg viewBox="0 0 170 170" className="w-full h-full fill-none" strokeWidth="0.52">
                <defs>
                  <linearGradient id="board-grid-v1" x1="0%" x2="100%">
                    <stop offset="0%" stopColor="rgba(244, 215, 160, 0.10)" />
                    <stop offset="50%" stopColor="rgba(225, 194, 136, 0.45)" />
                    <stop offset="100%" stopColor="rgba(244, 215, 160, 0.10)" />
                  </linearGradient>
                </defs>
                <rect x="5" y="5" width="160" height="160" rx="2" stroke="rgba(212,175,55,0.18)" />
                {/* Vertical Lines */}
                {[...Array(17)].map((_, i) => (
                  <line key={`v-${i}`} x1={i * 10 + 5} y1={5} x2={i * 10 + 5} y2={165} stroke="url(#board-grid-v1)" opacity={i < 4 || i > 12 ? 0.35 : 1} />
                ))}
                {/* Horizontal Lines */}
                {[...Array(17)].map((_, i) => (
                  <line key={`h-${i}`} x1={5} y1={i * 10 + 5} x2={165} y2={i * 10 + 5} stroke="url(#board-grid-v1)" opacity={i < 4 || i > 12 ? 0.35 : 1} />
                ))}
                <rect x="71.5" y="1.5" width="27" height="27" rx="3" fill="rgba(127,29,29,0.08)" stroke="rgba(251,113,133,0.18)" />
                <rect x="1.5" y="71.5" width="27" height="27" rx="3" fill="rgba(6,95,70,0.08)" stroke="rgba(52,211,153,0.18)" />
                <rect x="71.5" y="141.5" width="27" height="27" rx="3" fill="rgba(30,64,175,0.08)" stroke="rgba(96,165,250,0.18)" />
                
                {/* Palace Diagonals - Shu (Top) */}
                <g className="stroke-[rgba(251,113,133,0.34)] stroke-[0.9]">
                  <line x1={75} y1={5} x2={95} y2={25} />
                  <line x1={95} y1={5} x2={75} y2={25} />
                </g>
                
                {/* Palace Diagonals - Wu (Left) */}
                <g className="stroke-[rgba(52,211,153,0.34)] stroke-[0.9]">
                  <line x1={5} y1={75} x2={25} y2={95} />
                  <line x1={25} y1={75} x2={5} y2={95} />
                </g>
                
                {/* Palace Diagonals - Wei (Bottom) */}
                <g className="stroke-[rgba(96,165,250,0.34)] stroke-[0.9]">
                  <line x1={75} y1={145} x2={95} y2={165} />
                  <line x1={95} y1={145} x2={75} y2={165} />
                </g>

                {/* River Boundary Decorations */}
                <g className="stroke-[rgba(212,175,55,0.34)] stroke-[0.8]" strokeDasharray="2.4 2.4">
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
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center p-20 select-none overflow-hidden opacity-0">
              <div className="text-[180px] font-serif text-rose-900/10 -mt-16 blur-[1px]">蜀</div>
              <div className="flex justify-between w-full">
                <div className="text-[180px] font-serif text-emerald-900/10 -ml-20 blur-[1px]">吴</div>
                <div className="text-[180px] font-serif text-blue-900/10 -mr-20 blur-[1px] invisible">魏</div>
              </div>
              <div className="text-[180px] font-serif text-blue-900/10 -mb-16 blur-[1px]">魏</div>
            </div>

            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center p-10 sm:p-14 md:p-20 select-none overflow-hidden">
              <div className="text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-rose-500/[0.06] -mt-6">SHU</div>
              <div className="flex justify-between w-full">
                <div className="-ml-10 text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-emerald-500/[0.06] -rotate-90">WU</div>
                <div className="invisible -mr-10 text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-blue-500/[0.06]">WEI</div>
              </div>
              <div className="text-[clamp(3.5rem,10vw,8rem)] font-serif font-black tracking-[0.28em] text-blue-500/[0.06] -mb-6">WEI</div>
            </div>

            {/* Central Battlefield Legend */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-55">
              <span className="translate-y-[-48px] text-[9px] font-black uppercase tracking-[1.2em] text-[#453726] sm:text-[10px]">Inter-Kingdom River</span>
              <span className="translate-y-[48px] text-[9px] font-black uppercase tracking-[1.2em] text-[#453726] sm:text-[10px]">Chasm of Three Fates</span>
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
                  const isLegalMove = legalMoves.some(m => m.to.x === x && m.to.y === y);
                  const isLastMoveFrom = !!latestMove && latestMove.from.x === x && latestMove.from.y === y;
                  const isLastMoveTo = !!latestMove && latestMove.to.x === x && latestMove.to.y === y;
                  const isCheckedGeneral = !!piece && piece.type === 'G' && isFactionInCheck(piece.faction, pieces).inCheck;
                  
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
                      className={cn(
                        "relative flex items-center justify-center group",
                        isRemoteWaiting ? "cursor-not-allowed" : "cursor-pointer",
                      )}
                    >
                      {(isLastMoveFrom || isLastMoveTo) && (
                        <div
                          className={cn(
                            "absolute inset-[9%] rounded-[0.9rem] border z-[1]",
                            isLastMoveTo
                              ? "border-gold/60 bg-gold/10 shadow-[0_0_18px_rgba(212,175,55,0.18)]"
                              : "border-sky-200/35 bg-sky-200/5",
                          )}
                        />
                      )}

                      <div className="absolute h-[2px] w-3 rounded-full bg-[#6f5b3d]/45 transition-colors group-hover:bg-gold/55" />
                      <div className="absolute h-3 w-[2px] rounded-full bg-[#6f5b3d]/45 transition-colors group-hover:bg-gold/55" />
                      <div className="absolute h-[4px] w-[4px] rounded-full bg-[#8a734b]/65 shadow-[0_0_6px_rgba(212,175,55,0.18)]" />
                      
                      {/* Legal Move Indicators */}
                      {isLegalMove && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className={cn(
                            "absolute z-40 transition-all",
                            piece
                              ? "h-7 w-7 rounded-full border-2 border-rose-400/80 bg-rose-500/[0.16] shadow-[0_0_20px_rgba(244,63,94,0.42)]"
                              : "h-5 w-5 rounded-full border border-gold/80 bg-gold/55 shadow-[0_0_18px_rgba(212,175,55,0.42)]",
                          )} 
                        >
                          {piece && <div className="absolute inset-[22%] rotate-45 border border-rose-200/70" />}
                        </motion.div>
                      )}

                      {piece && (
                        <motion.div 
                          layoutId={piece.id}
                          onMouseEnter={() => setHoveredPoint({ x, y })}
                          onMouseLeave={() => setHoveredPoint(null)}
                          className="absolute z-20 h-[90%] w-[90%] cursor-grab transition-all active:cursor-grabbing"
                        >
                          <BoardPieceToken
                            faction={piece.faction}
                            pieceType={piece.type}
                            selected={isSelected}
                            inCheck={isCheckedGeneral}
                            attacker={isAttacker}
                            dimmed={isRemoteWaiting && piece.faction === playerFaction}
                            interactive
                          />
                        </motion.div>
                      )}
                    </div>
                  );
                })
              ))}
            </div>

            {isRemoteWaiting && (
              <div className="pointer-events-none absolute inset-x-[9%] top-[3.5%] z-30 rounded-full border border-white/10 bg-black/55 px-4 py-2 text-center shadow-[0_12px_30px_rgba(0,0,0,0.4)] backdrop-blur-sm">
                <span className="text-[10px] font-black uppercase tracking-[0.32em] text-zinc-200">
                  Awaiting {turn} commander
                </span>
              </div>
            )}
          </div>
          
          <div className="mt-10 flex items-center gap-6 py-6 px-10 glass-dark border border-white/5 rounded-3xl shadow-2xl max-w-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gold/[0.02] pointer-events-none" />
            <div className="bg-gold/10 p-3 rounded-2xl flex-shrink-0 group-hover:scale-110 transition-transform duration-500">
               <Info size={20} className="text-gold" />
            </div>
            <p className="text-white text-sm font-serif italic leading-relaxed tracking-wide">
              {status}
            </p>
          </div>
              {/* Right Panel: History */}
        <div className="lg:col-span-3 space-y-8">
          <div className="glass-dark border border-white/5 p-8 rounded-[3rem] h-[650px] overflow-hidden flex flex-col shadow-2xl relative">
            <div className="absolute inset-0 bg-gold/[0.01] pointer-events-none" />
            <h3 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-10 flex items-center gap-3 relative z-10 font-sans">
              <History size={16} className="text-gold" /> Chronicle of Fates
            </h3>
            <div className="space-y-4 overflow-y-auto flex-grow pr-4 scrollbar-thin scrollbar-thumb-white/5 relative z-10 pb-8">
              {history.map((m, idx) => (
                <motion.div 
                  key={m.id} 
                  initial={idx === 0 ? { opacity: 0, x: 20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-5 rounded-2xl border transition-all duration-300 relative group",
                    idx === 0 
                      ? "bg-white/[0.05] border-gold/40 shadow-2xl shadow-gold/5" 
                      : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.02]"
                  )}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-1.5 h-1.5 rounded-full", FACTION_COLORS[m.faction])} />
                      <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", FACTION_COLORS[m.faction])}>
                        {m.id.startsWith('bot-') ? 'BOT ' : ''}{m.faction}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-zinc-700 tracking-tighter">
                      TURN {history.length - idx}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                     <div className={cn(
                       "w-10 h-10 rounded-xl border flex items-center justify-center font-serif font-black text-xs shadow-inner",
                       FACTION_COLORS[m.faction]
                     )}>
                        {m.pieceType}
                     </div>
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-white uppercase tracking-widest">{getPieceName(m.pieceType)}</span>
                        <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-mono">
                           <span>({m.from.x},{m.from.y})</span>
                           <ChevronLeft size={8} className="rotate-180 opacity-40" />
                           <span className="text-zinc-300">({m.to.x},{m.to.y})</span>
                        </div>
                     </div>
                  </div>
                  
                  <div className="text-[10px] text-zinc-500 font-serif italic leading-relaxed border-t border-white/5 pt-3">
                    {m.captured ? (
                      <span className="text-rose-400/80">Destroyed enemy {getPieceName(m.captured)} at ({m.to.x}, {m.to.y}).</span>
                    ) : (
                      <span>Repositioned for tactical advantage.</span>
                    )}
                    {m.check && <span className="text-gold font-black ml-1 block mt-1 animate-pulse uppercase tracking-[0.1em] text-[8px]">⚔️ KING IN PERIL!</span>}
                    {m.checkmate && <span className="text-rose-600 font-black ml-1 block mt-2 uppercase tracking-[0.2em] text-[10px] bg-rose-500/10 p-2 rounded-lg text-center border border-rose-500/20">Kingdom Fallen</span>}
                    {m.gameWinner && <span className="text-gold font-black block mt-3 uppercase tracking-[0.3em] animate-pulse bg-gold/10 p-3 rounded-lg text-center border border-gold/30">Realm United</span>}
                  </div>
                </motion.div>
              ))}
              {history.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-10 py-20 grayscale">
                   <History size={64} strokeWidth={1} className="mb-6" />
                   <p className="text-[10px] uppercase tracking-[0.5em] italic font-serif text-center">Silence Before the Storm</p>
                </div>
              )}
            </div>
            
            {/* Scroll Indicator Gradient */}
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent pointer-events-none z-20" />
          </div>

          {roomMode === 'online' && (
            <div className="glass-dark border border-gold/10 p-6 rounded-[2rem] flex flex-col gap-4 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gold/[0.01] pointer-events-none" />
                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 relative z-10">
                    <span>Synchrony Protocol</span>
                    <div className="flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.8)]" />
                       <span className="text-gold">Active</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3 relative z-10 mt-2">
                    <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl transition-all hover:bg-white/[0.05]">
                        <span className="text-[8px] text-zinc-600 uppercase font-black tracking-widest block mb-2">Tactical Intelligence</span>
                        <span className="text-[10px] text-zinc-300 font-mono tracking-tighter uppercase">{lastSyncEvent || 'Listening for Intel...'}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center">
                          <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Assigned Front</span>
                          <span className={cn("text-[10px] font-black font-mono tracking-widest uppercase", playerFaction && FACTION_COLORS[playerFaction])}>
                            {playerFaction || 'Neutral'}
                          </span>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex flex-col justify-center items-center">
                          <span className="text-[7px] text-zinc-600 uppercase font-black tracking-widest block mb-1">Archive Size</span>
                          <span className="text-[10px] text-white font-black font-mono tracking-widest">{appliedMoveIds.size}</span>
                      </div>
                    </div>
                </div>
            </div>
          )}

          <div className="p-10 glass-dark border border-gold/10 rounded-[3rem] text-center shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gold/[0.02] group-hover:scale-110 transition-transform duration-1000" />
            <h4 className="text-[10px] font-black text-gold uppercase tracking-[0.5em] mb-6 relative z-10">Tactical Insight</h4>
            <div className="w-8 h-px bg-gold/30 mx-auto mb-6 relative z-10" />
            <p className="text-zinc-500 text-xs leading-relaxed italic font-serif relative z-10 px-2">
              "When the three kingdoms clash at the river's edge, the wise commander keeps their reserve pieces in the palace shadows."
            </p>
          </div>
        </div>      </div>
      </div>
    </div>
  );
}

export default function PracticeBoard() {
  const location = useLocation();
  const { config } = useMatchContext();
  const requestedMode = normalizeGameMode((location.state as any)?.gameMode ?? config.gameMode, DEFAULT_GAME_MODE);

  if (requestedMode === 'authentic') {
    return (
      <AuthenticBoard
        roomCode={(location.state as any)?.roomCode}
        roomMode={(location.state as any)?.roomMode || (location.state as any)?.mode || 'local'}
        context="practice"
      />
    );
  }

  return <ClassicPracticeBoard />;
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
