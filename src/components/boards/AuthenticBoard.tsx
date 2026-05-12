import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cpu, Crown, Download, RotateCcw, Save, ScrollText, ShieldAlert, Trophy, User, Wrench } from 'lucide-react';
import { GAME_MODE_META } from '@/shared/gameModes';
import { cn } from '@/src/lib/utils';
import { useMatchContext } from '@/src/context/MatchContext';
import { type AuthenticBotDecision } from '@/src/ai/authenticBotAI';
import { useAuthenticBotTurns } from '@/src/hooks/useAuthenticBotTurns';
import { createAuthenticMatchRecord } from '@/src/rules/authenticReplayReducer';
import { exportMatchRecord, saveMatchRecord } from '@/src/storage/localMatchArchive';
import {
  applyAuthenticMove,
  AUTHENTIC_BOARD_NOTE,
  AUTHENTIC_COLS,
  AUTHENTIC_FACTIONS,
  AUTHENTIC_GLYPHS,
  AUTHENTIC_LABELS,
  AUTHENTIC_LOCAL_ONLY_MESSAGE,
  AUTHENTIC_MODE_STATUS,
  AUTHENTIC_MOVE_BLOCKED_MESSAGE,
  AUTHENTIC_POINT_ACCENTS,
  AUTHENTIC_ROWS,
  createInitialAuthenticState,
  findAuthenticPieceAt,
  getAlliancePointFaction,
  getAllianceStatus,
  getAuthenticFactionLabel,
  getAuthenticLegalMoves,
  getHanStatus,
  validateAuthenticMove,
  type AuthenticBoardState,
  type AuthenticCapturedPieceRecord,
  type AuthenticFaction,
  type AuthenticFactionOrNeutral,
  type AuthenticPiece,
  type AuthenticSpecialMove,
} from '@/src/rules/authenticThreeKingdomRules';
import type { PlayerType } from '@/src/rules/classicThreeKingdomRules';

interface AuthenticBoardProps {
  roomCode?: string;
  roomMode?: 'local' | 'online';
  context?: 'practice' | 'replay';
}

const FACTION_CARD_THEME: Record<AuthenticFactionOrNeutral, string> = {
  Shu: 'border-rose-300/55 bg-rose-100/55 text-rose-900',
  Wei: 'border-slate-400/55 bg-blue-100/50 text-slate-900',
  Wu: 'border-emerald-300/55 bg-emerald-100/55 text-emerald-900',
  Han: 'border-amber-300/60 bg-amber-100/65 text-amber-900',
};

const OWNER_BADGE_THEME: Record<AuthenticFaction, string> = {
  Shu: 'bg-rose-500 text-white',
  Wei: 'bg-slate-700 text-white',
  Wu: 'bg-emerald-600 text-white',
};

const PIECE_THEME: Record<AuthenticFactionOrNeutral, { rim: string; ink: string; chip: string; shadow: string }> = {
  Shu: {
    rim: 'border-rose-700/80',
    ink: 'text-rose-800',
    chip: 'bg-rose-100/70',
    shadow: 'shadow-[0_3px_7px_rgba(127,29,29,0.10)]',
  },
  Wei: {
    rim: 'border-slate-700/80',
    ink: 'text-slate-800',
    chip: 'bg-slate-100/70',
    shadow: 'shadow-[0_3px_7px_rgba(30,41,59,0.12)]',
  },
  Wu: {
    rim: 'border-emerald-700/80',
    ink: 'text-emerald-800',
    chip: 'bg-emerald-100/70',
    shadow: 'shadow-[0_3px_7px_rgba(5,150,105,0.10)]',
  },
  Han: {
    rim: 'border-amber-700/80',
    ink: 'text-amber-900',
    chip: 'bg-amber-100/80',
    shadow: 'shadow-[0_3px_7px_rgba(180,120,20,0.12)]',
  },
};

const SPECIAL_EVENT_THEME: Record<AuthenticSpecialMove, string> = {
  ALLIANCE: 'border-emerald-300/55 bg-emerald-100/70 text-emerald-900',
  DEPOSE_EMPEROR: 'border-amber-300/60 bg-amber-100/75 text-amber-900',
  ABSORB_ARMY: 'border-rose-300/55 bg-rose-100/70 text-rose-900',
  CHECK: 'border-sky-300/55 bg-sky-100/70 text-sky-900',
  CHECKMATE: 'border-violet-300/55 bg-violet-100/75 text-violet-900',
};

const SPECIAL_EVENT_LABELS: Record<AuthenticSpecialMove, string> = {
  ALLIANCE: 'Alliance',
  DEPOSE_EMPEROR: 'Depose Emperor',
  ABSORB_ARMY: 'Absorb Army',
  CHECK: 'Check',
  CHECKMATE: 'Checkmate',
};

const CONTROL_BADGE_THEME: Record<PlayerType, string> = {
  Human: 'border-stone-300/60 bg-white/75 text-stone-800',
  Bot: 'border-amber-300/60 bg-amber-100/80 text-amber-950',
};

const DEFAULT_AUTHENTIC_CONTROLS: Record<AuthenticFaction, PlayerType> = {
  Wu: 'Human',
  Wei: 'Bot',
  Shu: 'Bot',
};

const AUTHENTIC_PIECE_HELP: Record<AuthenticPiece['type'], string> = {
  G: 'General moves one point orthogonally inside its palace.',
  A: 'Advisor moves one point diagonally inside its palace.',
  E: 'Elephant moves two points diagonally and ignores eye-blocks.',
  H: 'Horse moves in an L-shape and ignores leg-blocks in Modern 3K.',
  R: 'Chariot moves any distance orthogonally.',
  P: 'Cannon moves straight and captures by jumping one screen.',
  S: 'Soldier moves one orthogonal point with Authentic territory rules.',
};

const BOARD_MIN = 8.75;
const BOARD_MAX = 91.25;
const BOARD_SPAN = BOARD_MAX - BOARD_MIN;
const GRID_INTERVALS = 16;
const HALF_STEP = BOARD_SPAN / GRID_INTERVALS / 2;

function coordinateToPercent(coord: number) {
  return BOARD_MIN + (coord / GRID_INTERVALS) * BOARD_SPAN;
}

function coordinateToStyle(x: number, y: number) {
  return {
    left: `${coordinateToPercent(x)}%`,
    top: `${coordinateToPercent(y)}%`,
  };
}

function regionBounds(minCoord: number, maxCoord: number) {
  const min = coordinateToPercent(minCoord);
  const max = coordinateToPercent(maxCoord);
  const start = Math.max(BOARD_MIN, min - HALF_STEP);
  const end = Math.min(BOARD_MAX, max + HALF_STEP);
  return {
    start,
    size: end - start,
  };
}

function svgPoint(coord: number) {
  return coordinateToPercent(coord);
}

const SHU_X = regionBounds(3, 13);
const SHU_Y = regionBounds(0, 4);
const WEI_X = regionBounds(3, 13);
const WEI_Y = regionBounds(12, 16);
const WU_X = regionBounds(0, 4);
const WU_Y = regionBounds(3, 13);
const HAN_X = regionBounds(6, 10);
const HAN_Y = regionBounds(6, 10);

function PieceToken({
  piece,
  selected,
  ownedByCurrentTurn,
  selectable,
  muted,
}: {
  piece: AuthenticPiece;
  selected: boolean;
  ownedByCurrentTurn: boolean;
  selectable: boolean;
  muted: boolean;
}) {
  const theme = PIECE_THEME[piece.visualFaction];
  const showOwnerBadge = piece.owner !== piece.visualFaction && piece.owner !== 'Han';

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center rounded-full border-[2px] bg-[radial-gradient(circle_at_35%_32%,rgba(255,255,255,0.95),rgba(248,239,220,0.98)_58%,rgba(219,196,161,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_5px_rgba(120,90,52,0.10)] transition-all',
        theme.rim,
        theme.shadow,
        selected && 'scale-[1.06] shadow-[0_0_0_2px_rgba(250,204,21,0.3),0_0_0_6px_rgba(250,204,21,0.12),0_6px_14px_rgba(120,90,52,0.18)]',
        ownedByCurrentTurn && !selected && 'shadow-[0_0_0_1px_rgba(255,255,255,0.28),0_0_0_4px_rgba(255,248,220,0.08),0_4px_10px_rgba(120,90,52,0.14)]',
        selectable && !selected && 'group-hover:scale-[1.03]',
        muted && !selected && 'opacity-72 saturate-90'
      )}
    >
      <div className="absolute inset-[8%] rounded-full border border-black/10" />
      <div className="absolute inset-x-[20%] top-[11%] h-[10%] rounded-full bg-white/45" />
      {showOwnerBadge && (
        <div
          className={cn(
            'absolute right-[7%] top-[7%] flex h-[18%] w-[18%] items-center justify-center rounded-full border border-white/70 text-[0.42rem] font-black uppercase',
            OWNER_BADGE_THEME[piece.owner]
          )}
        >
          {piece.owner[0]}
        </div>
      )}
      <div className="relative z-10 flex flex-col items-center justify-center leading-none">
        <span className={cn('font-serif text-[clamp(0.7rem,1vw,1.12rem)] font-black', theme.ink)}>
          {AUTHENTIC_GLYPHS[piece.type]}
        </span>
        <span
          className={cn(
            'mt-[1px] rounded-full px-1 py-[1px] text-[0.34rem] font-black uppercase tracking-[0.18em]',
            theme.chip,
            theme.ink
          )}
        >
          {piece.type}
        </span>
      </div>
      {selected && <div className="pointer-events-none absolute inset-[-8%] rounded-full border-2 border-amber-500/55" />}
    </div>
  );
}

function CapturedBadge({ piece }: { piece: AuthenticCapturedPieceRecord }) {
  return (
    <span
      className={cn(
        'rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]',
        FACTION_CARD_THEME[piece.visualFaction]
      )}
    >
      {piece.visualFaction} {AUTHENTIC_LABELS[piece.type]}
      {piece.owner !== piece.visualFaction ? ` / ${piece.owner}` : ''}
    </span>
  );
}

function formatPoint(point: { x: number; y: number }) {
  return `${point.x},${point.y}`;
}

function formatSelectedPiece(piece: AuthenticPiece | null) {
  if (!piece) return 'None';
  const controller = piece.owner !== piece.visualFaction ? ` / ${piece.owner}` : '';
  return `${piece.visualFaction} ${AUTHENTIC_LABELS[piece.type]}${controller} @ ${formatPoint(piece)}`;
}

function formatPriorityStatus(queue: AuthenticFaction[]) {
  if (queue.length === 0) return 'Base turn order active.';
  return `${queue.join(' -> ')} has check priority.`;
}

function ControlBadge({ control }: { control: PlayerType }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em]',
        CONTROL_BADGE_THEME[control]
      )}
    >
      {control === 'Bot' ? <Cpu size={12} /> : <User size={12} />}
      {control}
    </span>
  );
}

export default function AuthenticBoard({
  roomCode,
  roomMode = 'local',
  context = 'practice',
}: AuthenticBoardProps) {
  const { config } = useMatchContext();
  const modeMeta = GAME_MODE_META.authentic;
  const returnHref = context === 'replay' ? '/archive' : roomCode ? `/rooms/${roomCode}` : '/setup?mode=authentic';
  const returnLabel = context === 'replay' ? 'Return to Archive' : roomCode ? 'Return to Lobby' : 'Return to Setup';
  const [gameState, setGameState] = useState<AuthenticBoardState>(createInitialAuthenticState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [lastValidationReason, setLastValidationReason] = useState<string | null>(null);
  const [savedReplayId, setSavedReplayId] = useState<string | null>(null);
  const [status, setStatus] = useState(
    roomMode === 'online'
      ? AUTHENTIC_LOCAL_ONLY_MESSAGE
      : 'Wu / Green opens the match. The first move cannot capture.'
  );

  const selectedPiece = useMemo(
    () => gameState.pieces.find((piece) => piece.id === selectedId) || null,
    [gameState.pieces, selectedId]
  );
  const legalMoves = useMemo(
    () =>
      getAuthenticLegalMoves(
        selectedPiece,
        gameState.pieces,
        gameState.currentTurn,
        gameState.moveNumber,
        gameState.hanController,
        gameState.allianceState
      ),
    [selectedPiece, gameState]
  );

  const controlModes = useMemo<Record<AuthenticFaction, PlayerType>>(
    () =>
      config.gameMode === 'authentic'
        ? {
            Wu: config.factions.Wu.control,
            Wei: config.factions.Wei.control,
            Shu: config.factions.Shu.control,
          }
        : DEFAULT_AUTHENTIC_CONTROLS,
    [config]
  );
  const isInteractive = context === 'practice' && roomMode === 'local';
  const checkedPriorityText = formatPriorityStatus(gameState.checkedPriorityQueue);
  const selectedPieceText = formatSelectedPiece(selectedPiece);
  const currentTurnControl = controlModes[gameState.currentTurn];
  const isBotTurn = isInteractive && !gameState.winner && currentTurnControl === 'Bot';
  const latestMoveRecord = gameState.history[0] || null;
  const finalEventSummary = latestMoveRecord?.note || status;
  const legalMoveMeta = useMemo(() => {
    const meta = new Map<string, { capture: boolean; special?: AuthenticSpecialMove }>();
    if (!selectedPiece) {
      return meta;
    }

    legalMoves.forEach((point) => {
      const validation = validateAuthenticMove(
        selectedPiece,
        point,
        gameState.pieces,
        gameState.currentTurn,
        gameState.moveNumber,
        gameState.hanController,
        gameState.allianceState
      );

      if (validation.legal) {
        meta.set(`${point.x},${point.y}`, {
          capture: !!validation.isCapture,
          special: validation.special,
        });
      }
    });

    return meta;
  }, [gameState.allianceState, gameState.currentTurn, gameState.hanController, gameState.moveNumber, gameState.pieces, legalMoves, selectedPiece]);
  const authenticSetupHref = '/setup?mode=authentic';
  const devLog = (...args: unknown[]) => {
    if ((import.meta as any).env.DEV) {
      console.log(...args);
    }
  };

  const createArchiveRecord = React.useCallback(
    () =>
      createAuthenticMatchRecord({
        config,
        initialState: createInitialAuthenticState(),
        finalState: gameState,
      }),
    [config, gameState]
  );

  const resetBoard = () => {
    setGameState(createInitialAuthenticState());
    setSelectedId(null);
    setLastValidationReason(null);
    setSavedReplayId(null);
    setStatus('Wu / Green opens the match. The first move cannot capture.');
  };

  const handleSaveLocally = React.useCallback(() => {
    const record = createArchiveRecord();
    saveMatchRecord(record);
    setSavedReplayId(record.id);
    setStatus('Modern 3K chronicle saved to local archives.');
    return record;
  }, [createArchiveRecord]);

  const handleExportMatch = React.useCallback(() => {
    const record = createArchiveRecord();
    exportMatchRecord(record);
    setStatus('Modern 3K chronicle exported for external archives.');
    return record;
  }, [createArchiveRecord]);

  const commitResolution = React.useCallback(
    (
      selectedActingPiece: AuthenticPiece,
      resolution: NonNullable<ReturnType<typeof applyAuthenticMove>>,
      nextStatus?: string
    ) => {
      setLastValidationReason(null);
      setSavedReplayId(null);
      setGameState((prev) => ({
        pieces: resolution.pieces,
        currentTurn: resolution.nextTurn || prev.currentTurn,
        moveNumber: prev.moveNumber + 1,
        factionMoveCounts: resolution.factionMoveCounts,
        hanController: resolution.hanController,
        allianceState: resolution.allianceState,
        checkedPriorityQueue: resolution.checkedPriorityQueue,
        eliminated: resolution.eliminated,
        history: [resolution.moveRecord, ...prev.history],
        captured: [...resolution.capturedPieces, ...prev.captured],
        winner: resolution.winner,
        lastMove: resolution.lastMove,
      }));
      setSelectedId(null);
      setStatus(nextStatus || resolution.status);
      devLog('[Authentic Move Commit]', {
        actor: selectedActingPiece.id,
        to: resolution.lastMove.to,
        nextTurn: resolution.nextTurn,
      });
    },
    []
  );

  const executeBotMove = React.useCallback(
    (decision: AuthenticBotDecision) => {
      const actingPiece = gameState.pieces.find((piece) => piece.id === decision.pieceId);
      if (!actingPiece) {
        setStatus(`${gameState.currentTurn} Bot lost track of ${decision.pieceId}.`);
        return false;
      }

      const resolution = applyAuthenticMove(gameState, actingPiece, decision.to);
      if (!resolution) {
        setLastValidationReason(AUTHENTIC_MOVE_BLOCKED_MESSAGE);
        setStatus(`${gameState.currentTurn} Bot attempted an illegal move.`);
        return false;
      }

      commitResolution(
        actingPiece,
        resolution,
        resolution.winner ? undefined : `${gameState.currentTurn} Bot: ${decision.reason}.`
      );
      return true;
    },
    [commitResolution, gameState]
  );

  const { isBotThinking } = useAuthenticBotTurns({
    enabled: isInteractive,
    gameState,
    controlModes,
    executeBotMove,
    setStatus,
  });
  const boardLocked = !isInteractive || isBotTurn || isBotThinking || !!gameState.winner;

  React.useEffect(() => {
    if (!gameState.winner) {
      return;
    }

    setSelectedId(null);
    setLastValidationReason(null);
  }, [gameState.winner]);

  const authenticTurnTitle = gameState.winner
    ? `${gameState.winner} wins`
    : isBotThinking && isBotTurn
      ? 'Bot thinking...'
      : `${gameState.currentTurn} to move`;
  const authenticTurnDetail = gameState.winner
    ? `${gameState.winner} controls the last surviving command.`
    : `${getAuthenticFactionLabel(gameState.currentTurn)} is active under ${currentTurnControl} control.`;

  const handlePointClick = (x: number, y: number) => {
    const point = { x, y };
    const pieceAtPoint = findAuthenticPieceAt(gameState.pieces, point);

    devLog('[Authentic Click]', {
      x,
      y,
      selectedPiece: selectedPiece
        ? {
            id: selectedPiece.id,
            type: selectedPiece.type,
            owner: selectedPiece.owner,
            x: selectedPiece.x,
            y: selectedPiece.y,
          }
        : null,
      currentTurn: gameState.currentTurn,
      legalMoveCount: legalMoves.length,
    });

    if (!isInteractive) {
      setStatus(AUTHENTIC_LOCAL_ONLY_MESSAGE);
      return;
    }

    if (isBotTurn || isBotThinking) {
      setStatus(`${gameState.currentTurn} Bot thinking...`);
      return;
    }

    if (gameState.winner) {
      setStatus(`${gameState.winner} already controls the last surviving command. Reset to start again.`);
      return;
    }

    if (!selectedPiece) {
      if (pieceAtPoint?.owner === gameState.currentTurn) {
        devLog('[Authentic Click] select', {
          pieceId: pieceAtPoint.id,
          type: pieceAtPoint.type,
          owner: pieceAtPoint.owner,
        });
        setSelectedId(pieceAtPoint.id);
        setLastValidationReason(null);
        setStatus(`${getAuthenticFactionLabel(gameState.currentTurn)} ${AUTHENTIC_LABELS[pieceAtPoint.type]} selected.`);
        return;
      }
      setStatus(`${getAuthenticFactionLabel(gameState.currentTurn)} must move next.`);
      return;
    }

    if (pieceAtPoint?.id === selectedPiece.id) {
      setSelectedId(null);
      setLastValidationReason(null);
      setStatus(`${AUTHENTIC_LABELS[selectedPiece.type]} stood down.`);
      return;
    }

    if (pieceAtPoint?.owner === gameState.currentTurn) {
      setSelectedId(pieceAtPoint.id);
      setLastValidationReason(null);
      setStatus(`${getAuthenticFactionLabel(gameState.currentTurn)} ${AUTHENTIC_LABELS[pieceAtPoint.type]} selected.`);
      return;
    }

    const validation = validateAuthenticMove(
      selectedPiece,
      point,
      gameState.pieces,
      gameState.currentTurn,
      gameState.moveNumber,
      gameState.hanController,
      gameState.allianceState
    );

    devLog('[Authentic Click] validation', {
      legal: validation.legal,
      reason: validation.reason,
      targetOccupied: !!pieceAtPoint,
    });

    if (!validation.legal) {
      const reason = validation.reason || AUTHENTIC_MOVE_BLOCKED_MESSAGE;
      setLastValidationReason(reason);
      setStatus(reason);
      return;
    }

    const resolution = applyAuthenticMove(gameState, selectedPiece, point);
    if (!resolution) {
      devLog('[Authentic Click] move result', {
        success: false,
      });
      setLastValidationReason(AUTHENTIC_MOVE_BLOCKED_MESSAGE);
      setStatus(AUTHENTIC_MOVE_BLOCKED_MESSAGE);
      return;
    }

    devLog('[Authentic Click] move result', {
      success: true,
      move: resolution.moveRecord,
      nextTurn: resolution.nextTurn,
    });

    setLastValidationReason(null);
    commitResolution(selectedPiece, resolution);
  };

  return (
    <div data-testid="authentic-board" className="min-h-screen container mx-auto overflow-x-hidden px-4 pb-12 pt-24 sm:px-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.28em] text-[#6b4a26] sm:gap-3 sm:text-[10px] sm:tracking-[0.35em]">
            <span className="rounded-full border border-[#8c6331]/25 bg-[#f3e4be] px-4 py-2">{modeMeta.shortLabel}</span>
            <span className="rounded-full border border-[#8c6331]/20 bg-[#efe2c6] px-4 py-2 text-[#8b7755]">Tabletop Local</span>
            <span className="rounded-full border border-[#8c6331]/20 bg-[#efe2c6] px-4 py-2 text-[#8b7755]">Human + Bot</span>
          </div>

          <div
            data-testid="current-turn-banner"
            className="overflow-hidden rounded-[2rem] border border-[#8c6331]/18 bg-[linear-gradient(135deg,rgba(244,234,211,0.96),rgba(234,215,176,0.92))] px-5 py-5 shadow-[0_18px_44px_rgba(66,45,20,0.12)] sm:px-8 sm:py-6"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.35em] text-[#8d7048]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#8b6433]" />
                  Table Command
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-serif font-black uppercase tracking-[0.12em] text-[#35210f] sm:text-3xl">
                    {authenticTurnTitle}
                  </h2>
                  {gameState.winner ? (
                    <span className={cn('rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em]', FACTION_CARD_THEME[gameState.winner])}>
                      {gameState.winner} wins
                    </span>
                  ) : (
                    <ControlBadge control={currentTurnControl} />
                  )}
                </div>
                <p className="max-w-3xl text-sm font-serif italic leading-relaxed text-[#6d5334]">
                  {authenticTurnDetail}
                </p>
              </div>

              <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="rounded-full border border-[#8b6433]/18 bg-white/45 px-4 py-2 text-[#6f4c28]">
                  Han Court: {getHanStatus(gameState.hanController)}
                </span>
                {gameState.checkedPriorityQueue.length > 0 && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-100/70 px-4 py-2 text-[#8b5d17]">
                    Priority: {gameState.checkedPriorityQueue.join(' -> ')}
                  </span>
                )}
                {isBotThinking && !gameState.winner && (
                  <span className="rounded-full border border-amber-500/20 bg-amber-100/70 px-4 py-2 text-[#8b5d17]">
                    Bot thinking...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[820px] rounded-[2rem] border border-[#8c6331]/22 bg-[#ead7b0] p-3 shadow-[0_18px_44px_rgba(66,45,20,0.16)] sm:rounded-[3rem] sm:p-6 md:p-8">
            <div className="relative aspect-square w-full overflow-hidden rounded-[1.65rem] border border-[#7a5730]/28 bg-[#f4e7c9] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] sm:rounded-[2.2rem]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(120,86,46,0.025)_0,rgba(120,86,46,0.025)_2px,transparent_2px,transparent_18px),repeating-linear-gradient(0deg,rgba(120,86,46,0.018)_0,rgba(120,86,46,0.018)_1px,transparent_1px,transparent_12px)] opacity-70" />
              <div className="absolute inset-[4.8%] rounded-[2rem] border border-[#7a5730]/18" />
              <div
                className="absolute rounded-[1.2rem] bg-rose-200/10"
                style={{
                  left: `${SHU_X.start}%`,
                  top: `${SHU_Y.start}%`,
                  width: `${SHU_X.size}%`,
                  height: `${SHU_Y.size}%`,
                }}
              />
              <div
                className="absolute rounded-[1.2rem] bg-emerald-200/10"
                style={{
                  left: `${WU_X.start}%`,
                  top: `${WU_Y.start}%`,
                  width: `${WU_X.size}%`,
                  height: `${WU_Y.size}%`,
                }}
              />
              <div
                className="absolute rounded-[1.2rem] bg-slate-200/10"
                style={{
                  left: `${WEI_X.start}%`,
                  top: `${WEI_Y.start}%`,
                  width: `${WEI_X.size}%`,
                  height: `${WEI_Y.size}%`,
                }}
              />
              <div
                className="absolute rounded-[1rem] bg-amber-200/12"
                style={{
                  left: `${HAN_X.start}%`,
                  top: `${HAN_Y.start}%`,
                  width: `${HAN_X.size}%`,
                  height: `${HAN_Y.size}%`,
                }}
              />

              <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                {Array.from({ length: AUTHENTIC_COLS }).map((_, x) => {
                  const pos = svgPoint(x);
                  return (
                    <line
                      key={`v-${x}`}
                      x1={pos}
                      y1={BOARD_MIN}
                      x2={pos}
                      y2={BOARD_MAX}
                      stroke="rgba(71,45,22,0.48)"
                      strokeWidth="0.34"
                    />
                  );
                })}
                {Array.from({ length: AUTHENTIC_ROWS }).map((_, y) => {
                  const pos = svgPoint(y);
                  return (
                    <line
                      key={`h-${y}`}
                      x1={BOARD_MIN}
                      y1={pos}
                      x2={BOARD_MAX}
                      y2={pos}
                      stroke="rgba(71,45,22,0.48)"
                      strokeWidth="0.34"
                    />
                  );
                })}

                <line x1={svgPoint(7)} y1={svgPoint(0)} x2={svgPoint(9)} y2={svgPoint(2)} stroke="rgba(89,57,24,0.62)" strokeWidth="0.28" />
                <line x1={svgPoint(9)} y1={svgPoint(0)} x2={svgPoint(7)} y2={svgPoint(2)} stroke="rgba(89,57,24,0.62)" strokeWidth="0.28" />
                <line x1={svgPoint(0)} y1={svgPoint(7)} x2={svgPoint(2)} y2={svgPoint(9)} stroke="rgba(89,57,24,0.62)" strokeWidth="0.28" />
                <line x1={svgPoint(2)} y1={svgPoint(7)} x2={svgPoint(0)} y2={svgPoint(9)} stroke="rgba(89,57,24,0.62)" strokeWidth="0.28" />
                <line x1={svgPoint(7)} y1={svgPoint(14)} x2={svgPoint(9)} y2={svgPoint(16)} stroke="rgba(89,57,24,0.62)" strokeWidth="0.28" />
                <line x1={svgPoint(9)} y1={svgPoint(14)} x2={svgPoint(7)} y2={svgPoint(16)} stroke="rgba(89,57,24,0.62)" strokeWidth="0.28" />

                <circle cx={svgPoint(8)} cy={svgPoint(8)} r="10.8" fill="none" stroke="rgba(107,73,38,0.18)" strokeWidth="0.22" />
                <circle cx={svgPoint(8)} cy={svgPoint(8)} r="13.6" fill="none" stroke="rgba(107,73,38,0.12)" strokeWidth="0.18" />
              </svg>

              <div className="absolute inset-0">
                {Array.from({ length: AUTHENTIC_ROWS * AUTHENTIC_COLS }).map((_, i) => {
                  const x = i % AUTHENTIC_COLS;
                  const y = Math.floor(i / AUTHENTIC_COLS);
                  const point = { x, y };
                  const piece = findAuthenticPieceAt(gameState.pieces, point);
                  const allianceFaction = getAlliancePointFaction(point);
                  const moveMeta = legalMoveMeta.get(`${x},${y}`);
                  const isLegalMove = !!moveMeta;
                  const isLastMoveFrom = !!gameState.lastMove && samePoint(gameState.lastMove.from, point);
                  const isLastMoveTo = !!gameState.lastMove && samePoint(gameState.lastMove.to, point);
                  const isAccent = AUTHENTIC_POINT_ACCENTS.some((accent) => samePoint(accent, point));
                  const markerOnPiece = !!moveMeta?.capture;
                  const showAllianceHint = moveMeta?.special === 'ALLIANCE';
                  const showDeposeHint = moveMeta?.special === 'DEPOSE_EMPEROR';

                  return (
                    <React.Fragment key={`${x}-${y}`}>
                      <button
                        type="button"
                        onClick={() => handlePointClick(x, y)}
                        disabled={boardLocked}
                        className={cn(
                          'absolute z-10 h-[6.8%] w-[6.8%] rounded-full bg-transparent touch-manipulation transition-transform sm:h-[5.8%] sm:w-[5.8%] lg:h-[4.8%] lg:w-[4.8%]',
                          !boardLocked
                            ? 'cursor-pointer active:scale-[1.1] active:bg-[#7a5730]/10 active:ring-2 active:ring-[#8b6433]/20'
                            : 'cursor-default'
                        )}
                        style={{
                          ...coordinateToStyle(x, y),
                          transform: 'translate(-50%, -50%)',
                        }}
                        aria-label={`Point ${x}, ${y}`}
                      />

                      {(isAccent || isLastMoveFrom || isLastMoveTo || isLegalMove || allianceFaction || (x === 8 && y === 8)) && (
                        <div
                          className="pointer-events-none absolute z-20"
                          style={{
                            ...coordinateToStyle(x, y),
                            transform: 'translate(-50%, -50%)',
                          }}
                        >
                          {isLastMoveFrom && (
                            <div className="absolute left-1/2 top-1/2 h-[1.45rem] w-[1.45rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/35 bg-sky-100/8 sm:h-[1.65rem] sm:w-[1.65rem]" />
                          )}
                          {isLastMoveTo && (
                            <div className="absolute left-1/2 top-1/2 h-[1.65rem] w-[1.65rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-600/48 bg-amber-200/10 sm:h-[1.9rem] sm:w-[1.9rem]" />
                          )}
                          {allianceFaction && (
                            <div className="absolute left-1/2 top-1/2 flex h-[1rem] w-[1rem] -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center rounded-[0.14rem] border border-[#7a521f]/45 bg-amber-200/28">
                              <span className="-rotate-45 text-[0.42rem] font-black uppercase tracking-[0.1em] text-[#6a4517]">
                                {allianceFaction[0]}
                              </span>
                            </div>
                          )}
                          {x === 8 && y === 8 && (
                            <div className="absolute left-1/2 top-1/2 h-[1.15rem] w-[1.15rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-700/42 sm:h-[1.35rem] sm:w-[1.35rem]" />
                          )}
                          {isAccent && (
                            <div
                              className={cn(
                                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5f4225]/60',
                                isAccent ? 'h-[0.28rem] w-[0.28rem]' : 'h-[0.22rem] w-[0.22rem]'
                              )}
                            />
                          )}
                          {isLegalMove && !markerOnPiece && (
                            <div
                              data-testid="legal-move-marker"
                              className={cn(
                                'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border sm:h-[0.82rem] sm:w-[0.82rem]',
                                showAllianceHint
                                  ? 'h-[1.02rem] w-[1.02rem] border-emerald-700/45 bg-emerald-100/28 shadow-[0_0_16px_rgba(16,185,129,0.18)]'
                                  : showDeposeHint
                                    ? 'h-[1.08rem] w-[1.08rem] border-amber-700/50 bg-amber-100/28 shadow-[0_0_18px_rgba(217,119,6,0.16)]'
                                    : 'h-[0.98rem] w-[0.98rem] border-amber-700/45 bg-amber-100/24 shadow-[0_0_14px_rgba(120,86,46,0.14)]'
                              )}
                            >
                              <div className="absolute inset-[32%] rounded-full bg-[#7a521f]/22" />
                              {showAllianceHint && <div className="absolute inset-[22%] rotate-45 rounded-[0.16rem] border border-emerald-800/45" />}
                              {showDeposeHint && (
                                <>
                                  <div className="absolute inset-x-[48%] top-[18%] h-[64%] w-px bg-amber-900/35" />
                                  <div className="absolute inset-y-[48%] left-[18%] h-px w-[64%] bg-amber-900/35" />
                                </>
                              )}
                            </div>
                          )}
                          {markerOnPiece && (
                            <div
                              data-testid="capture-marker"
                              className={cn(
                                'absolute left-1/2 top-1/2 h-[2.45rem] w-[2.45rem] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] bg-rose-100/8 sm:h-[2.25rem] sm:w-[2.25rem]',
                                showDeposeHint ? 'border-amber-600/70 shadow-[0_0_18px_rgba(217,119,6,0.18)]' : 'border-rose-500/70 shadow-[0_0_18px_rgba(225,29,72,0.18)]'
                              )}
                            >
                              <div className={cn('absolute inset-[18%] rotate-45 border', showDeposeHint ? 'border-amber-700/55' : 'border-rose-400/60')} />
                            </div>
                          )}
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {gameState.pieces.map((piece) => {
                  const isSelected = piece.id === selectedId;
                  const isSelectablePiece = piece.owner === gameState.currentTurn && !boardLocked;
                  const isMuted =
                    piece.owner !== 'Han' &&
                    piece.owner !== gameState.currentTurn &&
                    !isSelected;
                  return (
                    <div
                      key={piece.id}
                      className={cn(
                        'pointer-events-none absolute z-30 h-[8.1%] w-[8.1%] transition-transform sm:h-[6.8%] sm:w-[6.8%] lg:h-[6.1%] lg:w-[6.1%]',
                        isSelectablePiece && 'group-hover:scale-[1.02]'
                      )}
                      style={{
                        ...coordinateToStyle(piece.x, piece.y),
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <PieceToken
                        piece={piece}
                        selected={isSelected}
                        ownedByCurrentTurn={piece.owner === gameState.currentTurn}
                        selectable={isSelectablePiece}
                        muted={isMuted}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6">
            <div className="flex items-center gap-3 text-[#6f4c28]">
              <ShieldAlert size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Command Status</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Current Turn</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="text-base font-serif font-black uppercase text-[#35210f]">{gameState.currentTurn}</p>
                  <ControlBadge control={currentTurnControl} />
                </div>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Selected Piece</p>
                <p className="mt-1 text-sm font-serif font-black text-[#35210f]">{selectedPieceText}</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Last Validation</p>
                <p className="mt-1 text-sm font-serif text-[#35210f]">
                  {lastValidationReason || 'No blocked move.'}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Han Court</p>
                <p className="mt-1 text-sm font-serif font-black text-[#35210f]">{getHanStatus(gameState.hanController)}</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Alliance</p>
                <p className="mt-1 text-sm font-serif text-[#35210f]">{getAllianceStatus(gameState.allianceState)}</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Check Priority</p>
                <p className="mt-1 text-sm font-serif text-[#35210f]">{checkedPriorityText}</p>
              </div>
            </div>
            <div className="mt-4 rounded-[1.4rem] border border-[#8b6433]/15 bg-[#f2e6ce] px-4 py-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Field Note</p>
              <p className="mt-2 text-sm font-serif italic leading-relaxed text-[#6d5334]">{status}</p>
              {isBotThinking && (
                <p className="mt-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#8b5d17]">
                  Bot thinking...
                </p>
              )}
            </div>
          </div>

          <div
            data-testid="selected-piece-info"
            className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6"
          >
            <div className="mb-3 flex items-center gap-3 text-[#6f4c28]">
              <Crown size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Selected Piece</span>
            </div>
            {selectedPiece ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em]', FACTION_CARD_THEME[selectedPiece.visualFaction])}>
                    {selectedPiece.visualFaction}
                  </span>
                  <span className="rounded-full border border-[#8b6433]/15 bg-white/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-[#35210f]">
                    {AUTHENTIC_LABELS[selectedPiece.type]}
                  </span>
                  <span className="rounded-full border border-[#8b6433]/15 bg-white/50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-[#6d5334]">
                    Owner: {selectedPiece.owner}
                  </span>
                </div>
                <p className="text-sm font-serif italic leading-relaxed text-[#6d5334]">
                  {AUTHENTIC_PIECE_HELP[selectedPiece.type]}
                </p>
                <p className="text-xs font-serif text-[#6d5334]">
                  {selectedPiece.owner === 'Han'
                    ? 'Neutral Han objective piece.'
                    : `${selectedPiece.owner} currently commands this piece.`}
                </p>
              </div>
            ) : (
              <p className="text-sm font-serif italic leading-relaxed text-[#6d5334]">
                Select a piece to review its faction, current owner, and movement rule.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-[2rem] border border-[#8b6433]/25 bg-[linear-gradient(180deg,#f4ead3_0%,#ead7b0_100%)] p-5 shadow-[0_18px_50px_rgba(57,32,15,0.18)] sm:rounded-[2.5rem] sm:p-8">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <Crown size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">{modeMeta.label}</span>
            </div>
            <h1 className="text-2xl font-serif font-black uppercase leading-tight text-[#35210f] sm:text-3xl">
              Authentic Modern Three Kingdoms Xiangqi
            </h1>
            <p className="mt-4 text-sm font-serif italic leading-relaxed text-[#6f5737]">{AUTHENTIC_MODE_STATUS}</p>
            <p className="mt-4 text-xs font-serif italic leading-relaxed text-[#826744]">{AUTHENTIC_BOARD_NOTE}</p>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-3 text-[#6f4c28]">
              <ShieldAlert size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Rules Help</span>
            </div>
            <ul className="grid gap-3 text-sm font-serif text-[#6d5334] sm:grid-cols-2 2xl:grid-cols-1">
              <li className="rounded-[1.2rem] border border-[#8b6433]/12 bg-white/45 px-4 py-3">Wu moves first.</li>
              <li className="rounded-[1.2rem] border border-[#8b6433]/12 bg-white/45 px-4 py-3">Horse ignores leg-blocks.</li>
              <li className="rounded-[1.2rem] border border-[#8b6433]/12 bg-white/45 px-4 py-3">Elephant ignores eye-blocks.</li>
              <li className="rounded-[1.2rem] border border-[#8b6433]/12 bg-white/45 px-4 py-3">Only a Horse can depose the Han Emperor.</li>
              <li className="rounded-[1.2rem] border border-[#8b6433]/12 bg-white/45 px-4 py-3">Authentic mode is local-only.</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-1">
            {AUTHENTIC_FACTIONS.map((faction) => (
              <div key={faction} className={cn('rounded-[2rem] border p-5 shadow-sm', FACTION_CARD_THEME[faction])}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">{getAuthenticFactionLabel(faction)}</p>
                    <h3 className="text-lg font-serif font-black uppercase">{faction}</h3>
                    {faction !== 'Han' && (
                      <div className="mt-3">
                        <ControlBadge control={controlModes[faction]} />
                      </div>
                    )}
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-current/25 bg-white/35 font-serif text-xl font-black">
                    {faction[0]}
                  </div>
                </div>
                <p className="mt-3 text-xs font-serif italic opacity-80">
                  {faction === 'Han'
                    ? gameState.hanController
                      ? `Military controlled by ${gameState.hanController}.`
                      : 'Neutral court with static military until triggered.'
                    : gameState.eliminated.includes(faction)
                      ? 'Command eliminated from direct play.'
                      : `Moves taken: ${gameState.factionMoveCounts[faction]}`}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-3 text-[#6f4c28]">
              <Trophy size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Winner</span>
            </div>
            <p className="text-sm font-serif italic leading-relaxed text-[#6d5334]">
              {gameState.winner ? `${gameState.winner} controls the last surviving command.` : 'No winner yet.'}
            </p>
          </div>

          {gameState.winner && (
            <div className="rounded-[2rem] border border-[#8b6433]/25 bg-[linear-gradient(180deg,#f4ead3_0%,#ead7b0_100%)] p-5 shadow-[0_18px_50px_rgba(57,32,15,0.18)] sm:rounded-[2.5rem] sm:p-8">
              <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
                <Trophy size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.35em]">Final Result</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-serif font-black uppercase tracking-[0.12em] text-[#35210f] sm:text-3xl">
                  {gameState.winner} wins
                </h2>
                <span className={cn('rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em]', FACTION_CARD_THEME[gameState.winner])}>
                  Last active kingdom
                </span>
              </div>
              <p className="mt-4 text-sm font-serif italic leading-relaxed text-[#6d5334]">
                {finalEventSummary}
              </p>
              {!savedReplayId && (
                <p className="mt-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#8b5d17]">
                  Save the match to unlock replay from this board.
                </p>
              )}
            </div>
          )}

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <ScrollText size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Move History</span>
            </div>
            <div className="max-h-72 space-y-3 overflow-y-auto pr-1 sm:max-h-80">
              {gameState.history.length === 0 ? (
                <p className="text-sm font-serif italic text-[#6d5334]">No moves recorded yet.</p>
              ) : (
                gameState.history.map((entry) => (
                  <div key={entry.id} className="rounded-[1.5rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#8b6433]/18 bg-[#f2e6ce] px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-[#7b5d36]">
                        Turn {entry.turnNumber}
                      </span>
                      <span className={cn('rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em]', FACTION_CARD_THEME[entry.faction])}>
                        {entry.faction}
                      </span>
                      <span className="rounded-full border border-[#8b6433]/15 bg-white/55 px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em] text-[#35210f]">
                        {AUTHENTIC_LABELS[entry.pieceType]}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4 rounded-[1.1rem] border border-[#8b6433]/10 bg-[#f8f0df] px-3 py-2">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#90714a]">From</p>
                        <p className="font-mono text-sm text-[#35210f]">{formatPoint(entry.from)}</p>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#90714a]">to</div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#90714a]">To</p>
                        <p className="font-mono text-sm text-[#35210f]">{formatPoint(entry.to)}</p>
                      </div>
                    </div>
                    {entry.captured && (
                      <p className="mt-3 text-xs font-serif text-[#6d5334]">
                        Capture: {entry.captured.visualFaction} {AUTHENTIC_LABELS[entry.captured.type]}
                        {entry.captured.owner !== entry.captured.visualFaction ? ` / ${entry.captured.owner}` : ''}
                      </p>
                    )}
                    {entry.special && entry.special.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {entry.special.map((special) => (
                          <span
                            key={`${entry.id}-${special}`}
                            className={cn(
                              'rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em]',
                              SPECIAL_EVENT_THEME[special]
                            )}
                          >
                            {SPECIAL_EVENT_LABELS[special]}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="mt-3 text-xs font-serif italic leading-relaxed text-[#6d5334]">{entry.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <ShieldAlert size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Captured Pieces</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {gameState.captured.length === 0 ? (
                <p className="text-sm font-serif italic text-[#6d5334]">No captures yet.</p>
              ) : (
                gameState.captured.map((piece) => <CapturedBadge key={piece.id} piece={piece} />)
              )}
            </div>
          </div>

          <div data-testid="quick-actions" className="flex flex-col gap-3 sm:gap-4">
            {context === 'practice' && (
              <button
                type="button"
                onClick={resetBoard}
                className="flex items-center justify-center gap-3 rounded-2xl bg-[#5f4021] px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#f8edd6] transition-all hover:bg-[#4d341b] active:scale-[0.98] sm:px-8 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
              >
                <RotateCcw size={16} />
                Restart Match
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveLocally}
              data-testid="authentic-save-archive-button"
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#7b5325] px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#f8edd6] transition-all hover:bg-[#69461f] active:scale-[0.98] sm:px-8 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
            >
              <Save size={16} />
              Save Match
            </button>
            {savedReplayId && (
              <Link
                to={`/replay/${savedReplayId}`}
                className="flex items-center justify-center gap-3 rounded-2xl border border-[#8b6433]/20 bg-white/40 px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#35210f] transition-all hover:bg-white/55 active:scale-[0.98] sm:px-8 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
              >
                <ScrollText size={16} />
                Replay Battle
              </Link>
            )}
            {context === 'practice' ? (
              <Link
                to={authenticSetupHref}
                className="flex items-center justify-center gap-3 rounded-2xl border border-[#8b6433]/20 bg-white/40 px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#35210f] transition-all hover:bg-white/55 active:scale-[0.98] sm:px-8 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
              >
                <Wrench size={16} />
                Return to Setup
              </Link>
            ) : (
              <Link
                to={returnHref}
                className="flex items-center justify-center gap-3 rounded-2xl border border-[#8b6433]/20 bg-white/40 px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#35210f] transition-all hover:bg-white/55 active:scale-[0.98] sm:px-8 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
              >
                <Wrench size={16} />
                {returnLabel}
              </Link>
            )}
            <button
              type="button"
              onClick={handleExportMatch}
              className="flex items-center justify-center gap-3 rounded-2xl border border-[#8b6433]/20 bg-white/40 px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#35210f] transition-all hover:bg-white/55 active:scale-[0.98] sm:px-8 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
            >
              <Download size={16} />
              Export Record
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function samePoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return a.x === b.x && a.y === b.y;
}
