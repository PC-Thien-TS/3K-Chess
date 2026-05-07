import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, RotateCcw, ScrollText, ShieldAlert, Trophy, Wrench } from 'lucide-react';
import { GAME_MODE_META } from '@/shared/gameModes';
import { cn } from '@/src/lib/utils';
import {
  applyAuthenticMove,
  AUTHENTIC_ALLIANCE_POINTS,
  AUTHENTIC_BOARD_NOTE,
  AUTHENTIC_COLS,
  AUTHENTIC_FACTIONS,
  AUTHENTIC_GLYPHS,
  AUTHENTIC_LABELS,
  AUTHENTIC_LOCAL_ONLY_MESSAGE,
  AUTHENTIC_MODE_STATUS,
  AUTHENTIC_MOVE_BLOCKED_MESSAGE,
  AUTHENTIC_PLAYER_FACTIONS,
  AUTHENTIC_POINT_ACCENTS,
  AUTHENTIC_ROWS,
  createInitialAuthenticState,
  findAuthenticPieceAt,
  getAlliancePointFaction,
  getAllianceStatus,
  getAuthenticFactionLabel,
  getAuthenticLegalMoves,
  getAuthenticTerritory,
  getHanStatus,
  isAuthenticPalacePoint,
  validateAuthenticMove,
  type AuthenticBoardState,
  type AuthenticCapturedPieceRecord,
  type AuthenticFaction,
  type AuthenticFactionOrNeutral,
  type AuthenticPiece,
} from '@/src/rules/authenticThreeKingdomRules';

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
    shadow: 'shadow-[0_10px_20px_rgba(127,29,29,0.14)]',
  },
  Wei: {
    rim: 'border-slate-700/80',
    ink: 'text-slate-800',
    chip: 'bg-slate-100/70',
    shadow: 'shadow-[0_10px_20px_rgba(30,41,59,0.16)]',
  },
  Wu: {
    rim: 'border-emerald-700/80',
    ink: 'text-emerald-800',
    chip: 'bg-emerald-100/70',
    shadow: 'shadow-[0_10px_20px_rgba(5,150,105,0.14)]',
  },
  Han: {
    rim: 'border-amber-700/80',
    ink: 'text-amber-900',
    chip: 'bg-amber-100/80',
    shadow: 'shadow-[0_10px_20px_rgba(180,120,20,0.18)]',
  },
};

function PieceToken({
  piece,
  selected,
  ownedByCurrentTurn,
}: {
  piece: AuthenticPiece;
  selected: boolean;
  ownedByCurrentTurn: boolean;
}) {
  const theme = PIECE_THEME[piece.visualFaction];
  const showOwnerBadge = piece.owner !== piece.visualFaction && piece.owner !== 'Han';

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center rounded-full border-[2.5px] bg-[radial-gradient(circle_at_32%_26%,rgba(255,255,255,0.95),rgba(255,247,230,0.96)_28%,rgba(231,214,184,0.97)_62%,rgba(185,157,121,0.99)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.75),inset_0_-8px_14px_rgba(120,90,52,0.16)] transition-all',
        theme.rim,
        theme.shadow,
        selected && 'scale-[1.08] shadow-[0_0_0_3px_rgba(250,204,21,0.26),0_14px_20px_rgba(120,90,52,0.16)]',
        ownedByCurrentTurn && !selected && 'shadow-[0_0_0_2px_rgba(255,255,255,0.3),0_10px_20px_rgba(120,90,52,0.16)]'
      )}
    >
      <div className="absolute inset-[8%] rounded-full border border-black/10" />
      <div className="absolute inset-x-[18%] top-[10%] h-[16%] rounded-full bg-white/70 blur-[1px]" />
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
      {piece.owner !== piece.visualFaction ? ` · ${piece.owner}` : ''}
    </span>
  );
}

export default function AuthenticBoard({
  roomCode,
  roomMode = 'local',
  context = 'practice',
}: AuthenticBoardProps) {
  const modeMeta = GAME_MODE_META.authentic;
  const returnHref = context === 'replay' ? '/archive' : roomCode ? `/rooms/${roomCode}` : '/setup?mode=authentic';
  const returnLabel = context === 'replay' ? 'Return to Archive' : roomCode ? 'Return to Lobby' : 'Return to Setup';
  const [gameState, setGameState] = useState<AuthenticBoardState>(createInitialAuthenticState);
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  const isInteractive = context === 'practice' && roomMode === 'local';
  const checkedPriorityText = gameState.checkedPriorityQueue.length
    ? gameState.checkedPriorityQueue.join(' -> ')
    : 'None';

  const resetBoard = () => {
    setGameState(createInitialAuthenticState());
    setSelectedId(null);
    setStatus('Wu / Green opens the match. The first move cannot capture.');
  };

  const handlePointClick = (x: number, y: number) => {
    const point = { x, y };
    const pieceAtPoint = findAuthenticPieceAt(gameState.pieces, point);

    if (!isInteractive) {
      setStatus(AUTHENTIC_LOCAL_ONLY_MESSAGE);
      return;
    }

    if (gameState.winner) {
      setStatus(`${gameState.winner} already controls the last surviving command. Reset to start again.`);
      return;
    }

    if (!selectedPiece) {
      if (pieceAtPoint?.owner === gameState.currentTurn) {
        setSelectedId(pieceAtPoint.id);
        setStatus(`${getAuthenticFactionLabel(gameState.currentTurn)} ${AUTHENTIC_LABELS[pieceAtPoint.type]} selected.`);
        return;
      }
      setStatus(`${getAuthenticFactionLabel(gameState.currentTurn)} must move next.`);
      return;
    }

    if (pieceAtPoint?.id === selectedPiece.id) {
      setSelectedId(null);
      setStatus(`${AUTHENTIC_LABELS[selectedPiece.type]} stood down.`);
      return;
    }

    if (pieceAtPoint?.owner === gameState.currentTurn) {
      setSelectedId(pieceAtPoint.id);
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

    if (!validation.legal) {
      setStatus(validation.reason || AUTHENTIC_MOVE_BLOCKED_MESSAGE);
      return;
    }

    const resolution = applyAuthenticMove(gameState, selectedPiece, point);
    if (!resolution) {
      setStatus(AUTHENTIC_MOVE_BLOCKED_MESSAGE);
      return;
    }

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
    setStatus(resolution.status);
  };

  return (
    <div className="min-h-screen container mx-auto px-6 pb-12 pt-24">
      <div className="grid grid-cols-1 items-start gap-10 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-[#6b4a26]">
            <span className="rounded-full border border-[#8c6331]/25 bg-[#f3e4be] px-4 py-2">{modeMeta.shortLabel}</span>
            <span className="rounded-full border border-[#8c6331]/20 bg-[#efe2c6] px-4 py-2 text-[#8b7755]">{roomMode} mode</span>
            <span className="rounded-full border border-[#8c6331]/20 bg-[#efe2c6] px-4 py-2 text-[#8b7755]">Local Only</span>
          </div>

          <div className="rounded-[3rem] border border-[#8c6331]/25 bg-[linear-gradient(180deg,#f4ead1_0%,#ead7af_48%,#ddc18d_100%)] p-4 shadow-[0_28px_90px_rgba(66,45,20,0.22)] sm:p-6 md:p-8">
            <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-[#74502e]/30 bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.48),transparent_20%),radial-gradient(circle_at_80%_82%,rgba(120,82,38,0.18),transparent_28%),linear-gradient(180deg,#f7edd8_0%,#ecd9b2_52%,#dfc18f_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-18px_28px_rgba(102,74,36,0.08)]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(112deg,rgba(112,76,40,0.16)_0,rgba(112,76,40,0.16)_2px,transparent_2px,transparent_12px),repeating-linear-gradient(24deg,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_8px)] opacity-[0.18] mix-blend-multiply" />
              <div className="absolute left-[16%] top-[5%] h-[28%] w-[68%] rounded-[45%] bg-rose-300/18 blur-3xl" />
              <div className="absolute left-[5%] top-[21%] h-[58%] w-[22%] rounded-[45%] bg-emerald-300/18 blur-3xl" />
              <div className="absolute bottom-[5%] left-[16%] h-[28%] w-[68%] rounded-[45%] bg-slate-300/18 blur-3xl" />
              <div className="absolute left-[34%] top-[34%] h-[32%] w-[32%] rounded-[45%] bg-amber-300/12 blur-3xl" />
              <div className="absolute inset-[4.5%] rounded-[2.2rem] border border-[#704c28]/18" />

              <div className="relative z-10 grid h-full w-full grid-cols-17 grid-rows-17">
                {Array.from({ length: AUTHENTIC_ROWS * AUTHENTIC_COLS }).map((_, i) => {
                  const x = i % AUTHENTIC_COLS;
                  const y = Math.floor(i / AUTHENTIC_COLS);
                  const point = { x, y };
                  const territory = getAuthenticTerritory(x, y);
                  const piece = findAuthenticPieceAt(gameState.pieces, point);
                  const allianceFaction = getAlliancePointFaction(point);
                  const isSelected = piece?.id === selectedId;
                  const isLegalMove = legalMoves.some((move) => move.x === x && move.y === y);
                  const isLastMove =
                    !!gameState.lastMove &&
                    (samePoint(gameState.lastMove.from, point) || samePoint(gameState.lastMove.to, point));
                  const isPalaceCell =
                    isAuthenticPalacePoint(x, y, 'Shu') ||
                    isAuthenticPalacePoint(x, y, 'Wu') ||
                    isAuthenticPalacePoint(x, y, 'Wei');
                  const isAccent = AUTHENTIC_POINT_ACCENTS.some((accent) => samePoint(accent, point));
                  const isHanEmperorSeat = x === 8 && y === 8;

                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      onClick={() => handlePointClick(x, y)}
                      className={cn(
                        'relative min-h-0 min-w-0 border border-[#55391d]/[0.18] transition-all',
                        territory === 'Shu' && 'bg-rose-100/22',
                        territory === 'Wei' && 'bg-slate-100/18',
                        territory === 'Wu' && 'bg-emerald-100/18',
                        territory === 'Han' && 'bg-amber-100/24',
                        isInteractive ? 'cursor-pointer' : 'cursor-default',
                        isLastMove && 'bg-amber-200/22'
                      )}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(71,45,22,0.09)_50%,transparent_51%),linear-gradient(180deg,transparent_49%,rgba(71,45,22,0.09)_50%,transparent_51%)]" />
                      {isPalaceCell && (
                        <>
                          <div className="absolute left-[18%] right-[18%] top-1/2 h-px -translate-y-1/2 rotate-45 bg-[#593918]/55" />
                          <div className="absolute left-[18%] right-[18%] top-1/2 h-px -translate-y-1/2 -rotate-45 bg-[#593918]/55" />
                        </>
                      )}
                      {allianceFaction && (
                        <div className="absolute inset-[23%] rotate-45 rounded-[0.25rem] border border-[#7a521f]/45 bg-amber-200/25">
                          <div className="absolute inset-0 flex -rotate-45 items-center justify-center text-[0.38rem] font-black uppercase tracking-[0.1em] text-[#6a4517]">
                            {allianceFaction[0]}
                          </div>
                        </div>
                      )}
                      {isHanEmperorSeat && (
                        <div className="absolute inset-[12%] rounded-full border border-amber-700/40" />
                      )}
                      <div
                        className={cn(
                          'absolute left-1/2 top-1/2 h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5f4225]/60',
                          isAccent && 'h-[22%] w-[22%] bg-[#4b3018]/75'
                        )}
                      />
                      {isLegalMove && (
                        <div className="absolute inset-[17%] rounded-full border border-amber-700/45 bg-amber-100/15 shadow-[0_0_16px_rgba(180,120,20,0.24)]" />
                      )}
                      {piece && (
                        <div className="absolute inset-[5%] flex items-center justify-center">
                          <PieceToken piece={piece} selected={isSelected} ownedByCurrentTurn={piece.owner === gameState.currentTurn} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[33.5%] right-[33.5%] top-[8.9%] h-px bg-[#4d3317]/70" />
                <div className="absolute bottom-[33.5%] left-[8.9%] top-[33.5%] w-px bg-[#4d3317]/70" />
                <div className="absolute bottom-[8.9%] left-[33.5%] right-[33.5%] h-px bg-[#4d3317]/70" />
                <div className="absolute left-[36%] top-[36%] h-[28%] w-[28%] rounded-full border border-[#6b4926]/18" />
                <div className="absolute left-[36%] top-[36%] h-[28%] w-[28%] scale-[1.24] rounded-full border border-[#6b4926]/10" />
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
            <div className="flex items-center gap-3 text-[#6f4c28]">
              <ShieldAlert size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Board Status</span>
            </div>
            <p className="mt-3 text-sm font-serif italic leading-relaxed text-[#6d5334]">{status}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[#8b6433]/25 bg-[linear-gradient(180deg,#f4ead3_0%,#ead7b0_100%)] p-8 shadow-[0_18px_50px_rgba(57,32,15,0.18)]">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <Crown size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">{modeMeta.label}</span>
            </div>
            <h1 className="text-3xl font-serif font-black uppercase leading-tight text-[#35210f]">
              Authentic Modern Three Kingdoms Xiangqi
            </h1>
            <p className="mt-4 text-sm font-serif italic leading-relaxed text-[#6f5737]">{AUTHENTIC_MODE_STATUS}</p>
            <p className="mt-4 text-xs font-serif italic leading-relaxed text-[#826744]">{AUTHENTIC_BOARD_NOTE}</p>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
            <div className="mb-3 flex items-center gap-3 text-[#6f4c28]">
              <ScrollText size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Turn & Priority</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-[1.5rem] border border-[#8b6433]/15 bg-white/40 px-5 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.25em] text-[#90714a]">Current Turn</p>
                  <p className="text-xl font-serif font-black uppercase text-[#35210f]">{gameState.currentTurn}</p>
                </div>
                <div className={cn('rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', FACTION_CARD_THEME[gameState.currentTurn])}>
                  Move {gameState.moveNumber + 1}
                </div>
              </div>
              <div className="rounded-[1.5rem] border border-[#8b6433]/15 bg-white/40 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#90714a]">Checked Priority</p>
                <p className="mt-1 text-lg font-serif font-black uppercase text-[#35210f]">{checkedPriorityText}</p>
              </div>
              <div className="rounded-[1.5rem] border border-[#8b6433]/15 bg-white/40 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#90714a]">Han Court</p>
                <p className="mt-1 text-lg font-serif font-black uppercase text-[#35210f]">
                  {getHanStatus(gameState.hanController)}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-[#8b6433]/15 bg-white/40 px-5 py-4">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#90714a]">Alliance Status</p>
                <p className="mt-1 text-sm font-serif font-black uppercase text-[#35210f]">
                  {getAllianceStatus(gameState.allianceState)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
            {AUTHENTIC_FACTIONS.map((faction) => (
              <div key={faction} className={cn('rounded-[2rem] border p-5 shadow-sm', FACTION_CARD_THEME[faction])}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">{getAuthenticFactionLabel(faction)}</p>
                    <h3 className="text-lg font-serif font-black uppercase">{faction}</h3>
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

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
            <div className="mb-3 flex items-center gap-3 text-[#6f4c28]">
              <Trophy size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Winner</span>
            </div>
            <p className="text-sm font-serif italic leading-relaxed text-[#6d5334]">
              {gameState.winner ? `${gameState.winner} controls the last surviving command.` : 'No winner yet.'}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <ScrollText size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Move History</span>
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
              {gameState.history.length === 0 ? (
                <p className="text-sm font-serif italic text-[#6d5334]">No moves recorded yet.</p>
              ) : (
                gameState.history.map((entry) => (
                  <div key={entry.id} className="rounded-[1.5rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#90714a]">
                      Turn {entry.turnNumber} · {entry.faction}
                    </p>
                    <p className="mt-1 text-sm font-serif text-[#35210f]">{entry.note}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
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

          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={resetBoard}
              className="flex items-center justify-center gap-3 rounded-2xl bg-[#5f4021] px-8 py-5 text-center text-xs font-black uppercase tracking-[0.3em] text-[#f8edd6] transition-all hover:bg-[#4d341b]"
            >
              <RotateCcw size={16} />
              Reset Board
            </button>
            <Link
              to="/setup?mode=classic"
              className="rounded-2xl border border-[#8b6433]/20 bg-white/40 px-8 py-5 text-center text-xs font-black uppercase tracking-[0.3em] text-[#35210f] transition-all hover:bg-white/55"
            >
              Launch Classic
            </Link>
            <Link
              to={returnHref}
              className="flex items-center justify-center gap-3 rounded-2xl border border-[#8b6433]/20 bg-white/40 px-8 py-5 text-center text-xs font-black uppercase tracking-[0.3em] text-[#35210f] transition-all hover:bg-white/55"
            >
              <Wrench size={16} />
              {returnLabel}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function samePoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return a.x === b.x && a.y === b.y;
}
