import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown, ScrollText, ShieldAlert, Wrench } from 'lucide-react';
import { GAME_MODE_META } from '@/shared/gameModes';
import { cn } from '@/src/lib/utils';
import type { Faction, Piece, Point } from '@/src/rules/classicThreeKingdomRules';
import {
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
  findAuthenticPieceAt,
  getAuthenticFactionLabel,
  getAuthenticInitialPieces,
  getAuthenticPreviewTargets,
  getAuthenticTerritory,
  isAuthenticPalacePoint,
} from '@/src/rules/authenticThreeKingdomRules';

interface AuthenticBoardProps {
  roomCode?: string;
  roomMode?: 'local' | 'online';
  context?: 'practice' | 'replay';
}

const FACTION_CARD_THEME: Record<Faction, string> = {
  Shu: 'border-rose-300/55 bg-rose-100/55 text-rose-900',
  Wei: 'border-blue-300/55 bg-blue-100/55 text-blue-900',
  Wu: 'border-emerald-300/55 bg-emerald-100/55 text-emerald-900',
  None: 'border-stone-300/55 bg-stone-100/55 text-stone-900',
};

const PIECE_THEME: Record<Faction, { rim: string; ink: string; shadow: string; chip: string }> = {
  Shu: {
    rim: 'border-rose-700/80',
    ink: 'text-rose-800',
    shadow: 'shadow-[0_10px_20px_rgba(127,29,29,0.14)]',
    chip: 'bg-rose-100/60',
  },
  Wei: {
    rim: 'border-blue-700/80',
    ink: 'text-blue-800',
    shadow: 'shadow-[0_10px_20px_rgba(30,64,175,0.14)]',
    chip: 'bg-blue-100/60',
  },
  Wu: {
    rim: 'border-emerald-700/80',
    ink: 'text-emerald-800',
    shadow: 'shadow-[0_10px_20px_rgba(5,150,105,0.14)]',
    chip: 'bg-emerald-100/60',
  },
  None: {
    rim: 'border-stone-700/80',
    ink: 'text-stone-800',
    shadow: 'shadow-[0_10px_20px_rgba(87,83,78,0.14)]',
    chip: 'bg-stone-100/60',
  },
};

export default function AuthenticBoard({
  roomCode,
  roomMode = 'local',
  context = 'practice'
}: AuthenticBoardProps) {
  const modeMeta = GAME_MODE_META.authentic;
  const returnHref = context === 'replay' ? '/archive' : roomCode ? `/rooms/${roomCode}` : '/setup?mode=authentic';
  const returnLabel = context === 'replay' ? 'Return to Archive' : roomCode ? 'Return to Lobby' : 'Return to Setup';
  const [pieces] = useState<Piece[]>(() => getAuthenticInitialPieces());
  const [activeFaction, setActiveFaction] = useState<Faction>('Shu');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewPoint, setPreviewPoint] = useState<Point | null>(null);
  const [status, setStatus] = useState(
    roomMode === 'online' ? AUTHENTIC_LOCAL_ONLY_MESSAGE : AUTHENTIC_MODE_STATUS
  );

  const selectedPiece = useMemo(
    () => pieces.find((piece) => piece.id === selectedId) || null,
    [pieces, selectedId]
  );
  const previewTargets = useMemo(
    () => (selectedPiece ? getAuthenticPreviewTargets(selectedPiece) : []),
    [selectedPiece]
  );
  const isInteractive = context === 'practice' && roomMode === 'local';

  const handlePointClick = (x: number, y: number) => {
    const targetPoint = { x, y };
    const pieceAtPoint = findAuthenticPieceAt(pieces, targetPoint);

    if (!isInteractive) {
      setStatus(AUTHENTIC_LOCAL_ONLY_MESSAGE);
      return;
    }

    if (!selectedPiece) {
      if (pieceAtPoint?.faction === activeFaction) {
        setSelectedId(pieceAtPoint.id);
        setPreviewPoint(null);
        setStatus(
          `${getAuthenticFactionLabel(activeFaction)} ${AUTHENTIC_LABELS[pieceAtPoint.type]} selected. Preview markers are illustrative only.`
        );
        return;
      }

      setStatus(
        `${getAuthenticFactionLabel(activeFaction)} is the active command. Select one of its pieces to inspect local preview targets.`
      );
      return;
    }

    if (pieceAtPoint?.id === selectedPiece.id) {
      setSelectedId(null);
      setPreviewPoint(null);
      setStatus(`${AUTHENTIC_LABELS[selectedPiece.type]} inspection cleared.`);
      return;
    }

    if (pieceAtPoint?.faction === activeFaction) {
      setSelectedId(pieceAtPoint.id);
      setPreviewPoint(null);
      setStatus(
        `${getAuthenticFactionLabel(activeFaction)} ${AUTHENTIC_LABELS[pieceAtPoint.type]} selected. Preview markers updated.`
      );
      return;
    }

    if (previewTargets.some((point) => point.x === x && point.y === y)) {
      setPreviewPoint(targetPoint);
      setStatus(AUTHENTIC_MOVE_BLOCKED_MESSAGE);
      return;
    }

    setPreviewPoint(targetPoint);
    setStatus('Authentic preview only. Select a piece or a highlighted preview point; moves are not executed yet.');
  };

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_22rem] gap-10 items-start">
        <div className="space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-[#6b4a26]">
            <span className="px-4 py-2 rounded-full border border-[#8c6331]/25 bg-[#f3e4be]">{modeMeta.shortLabel}</span>
            <span className="px-4 py-2 rounded-full border border-[#8c6331]/20 bg-[#efe2c6] text-[#8b7755]">{roomMode} mode</span>
            {context === 'replay' && (
              <span className="px-4 py-2 rounded-full border border-[#8c6331]/20 bg-[#efe2c6] text-[#8b7755]">Replay</span>
            )}
            <span className="px-4 py-2 rounded-full border border-[#8c6331]/20 bg-[#efe2c6] text-[#8b7755]">Local Preview</span>
          </div>

          <div className="rounded-[3rem] border border-[#8c6331]/25 bg-[linear-gradient(180deg,#f4ead1_0%,#ead7af_48%,#ddc18d_100%)] p-4 sm:p-6 md:p-8 shadow-[0_28px_90px_rgba(66,45,20,0.22)]">
            <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] border border-[#74502e]/30 bg-[radial-gradient(circle_at_28%_16%,rgba(255,255,255,0.48),transparent_20%),radial-gradient(circle_at_80%_82%,rgba(120,82,38,0.18),transparent_28%),linear-gradient(180deg,#f7edd8_0%,#ecd9b2_52%,#dfc18f_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.5),inset_0_-18px_28px_rgba(102,74,36,0.08)]">
              <div className="absolute inset-0 opacity-[0.18] mix-blend-multiply bg-[repeating-linear-gradient(112deg,rgba(112,76,40,0.16)_0,rgba(112,76,40,0.16)_2px,transparent_2px,transparent_12px),repeating-linear-gradient(24deg,rgba(255,255,255,0.12)_0,rgba(255,255,255,0.12)_1px,transparent_1px,transparent_8px)]" />
              <div className="absolute left-[16%] top-[5%] h-[28%] w-[68%] rounded-[45%] bg-rose-300/18 blur-3xl" />
              <div className="absolute left-[5%] top-[21%] h-[58%] w-[22%] rounded-[45%] bg-emerald-300/18 blur-3xl" />
              <div className="absolute left-[16%] bottom-[5%] h-[28%] w-[68%] rounded-[45%] bg-blue-300/18 blur-3xl" />
              <div className="absolute inset-[4.5%] rounded-[2.2rem] border border-[#704c28]/18" />

              <div className="relative z-10 h-full w-full grid grid-cols-17 grid-rows-17">
                {Array.from({ length: AUTHENTIC_ROWS * AUTHENTIC_COLS }).map((_, i) => {
                  const x = i % AUTHENTIC_COLS;
                  const y = Math.floor(i / AUTHENTIC_COLS);
                  const territory = getAuthenticTerritory(x, y);
                  const piece = findAuthenticPieceAt(pieces, { x, y });
                  const isSelected = piece?.id === selectedId;
                  const isPreview =
                    previewTargets.some((point) => point.x === x && point.y === y) ||
                    (previewPoint?.x === x && previewPoint?.y === y);
                  const isPalaceCell =
                    isAuthenticPalacePoint(x, y, 'Shu') ||
                    isAuthenticPalacePoint(x, y, 'Wei') ||
                    isAuthenticPalacePoint(x, y, 'Wu');
                  const isAccent = AUTHENTIC_POINT_ACCENTS.some((point) => point.x === x && point.y === y);

                  return (
                    <button
                      key={`${x}-${y}`}
                      type="button"
                      onClick={() => handlePointClick(x, y)}
                      className={cn(
                        'relative min-h-0 min-w-0 border border-[#55391d]/[0.18] transition-all',
                        territory === 'Shu' && 'bg-rose-100/22',
                        territory === 'Wei' && 'bg-blue-100/18',
                        territory === 'Wu' && 'bg-emerald-100/18',
                        territory === 'river' && 'bg-[#ccb389]/38',
                        isInteractive ? 'cursor-pointer' : 'cursor-default',
                        isPreview && 'bg-amber-200/30'
                      )}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_49%,rgba(71,45,22,0.09)_50%,transparent_51%),linear-gradient(180deg,transparent_49%,rgba(71,45,22,0.09)_50%,transparent_51%)]" />
                      {isPalaceCell && (
                        <>
                          <div className="absolute left-[18%] right-[18%] top-1/2 h-px -translate-y-1/2 rotate-45 bg-[#593918]/55" />
                          <div className="absolute left-[18%] right-[18%] top-1/2 h-px -translate-y-1/2 -rotate-45 bg-[#593918]/55" />
                        </>
                      )}
                      <div
                        className={cn(
                          'absolute left-1/2 top-1/2 h-[16%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5f4225]/60',
                          isAccent && 'h-[22%] w-[22%] bg-[#4b3018]/75'
                        )}
                      />
                      {isPreview && (
                        <div className="absolute inset-[18%] rounded-full border border-amber-700/45 bg-amber-100/15" />
                      )}
                      {piece && (
                        <div className="absolute inset-[5%] flex items-center justify-center">
                          <div
                            className={cn(
                              'relative flex h-full w-full items-center justify-center rounded-full border-[2.5px] bg-[radial-gradient(circle_at_32%_26%,rgba(255,255,255,0.94),rgba(255,247,230,0.95)_26%,rgba(231,214,184,0.96)_62%,rgba(185,157,121,0.98)_100%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.75),inset_0_-8px_14px_rgba(120,90,52,0.16)] transition-all',
                              PIECE_THEME[piece.faction].rim,
                              PIECE_THEME[piece.faction].shadow,
                              isSelected && 'scale-[1.08] shadow-[0_0_0_3px_rgba(250,204,21,0.26),0_14px_20px_rgba(120,90,52,0.16)]'
                            )}
                          >
                            <div className="absolute inset-[8%] rounded-full border border-black/10" />
                            <div className="absolute inset-x-[18%] top-[10%] h-[16%] rounded-full bg-white/70 blur-[1px]" />
                            <div className="relative z-10 flex flex-col items-center justify-center leading-none">
                              <span className={cn('font-serif text-[clamp(0.7rem,1vw,1.12rem)] font-black', PIECE_THEME[piece.faction].ink)}>
                                {AUTHENTIC_GLYPHS[piece.type]}
                              </span>
                              <span
                                className={cn(
                                  'mt-[1px] rounded-full px-1 py-[1px] text-[0.34rem] font-black uppercase tracking-[0.18em]',
                                  PIECE_THEME[piece.faction].chip,
                                  PIECE_THEME[piece.faction].ink
                                )}
                              >
                                {piece.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[33.5%] right-[33.5%] top-[8.9%] h-px bg-[#4d3317]/70" />
                <div className="absolute left-[8.9%] top-[33.5%] bottom-[33.5%] w-px bg-[#4d3317]/70" />
                <div className="absolute left-[33.5%] right-[33.5%] bottom-[8.9%] h-px bg-[#4d3317]/70" />
                <div className="absolute left-[36%] top-[36%] h-[28%] w-[28%] rounded-full border border-[#6b4926]/16" />
                <div className="absolute left-[36%] top-[36%] h-[28%] w-[28%] rounded-full border border-[#6b4926]/10 scale-[1.24]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {AUTHENTIC_FACTIONS.map((faction) => (
              <button
                key={faction}
                type="button"
                onClick={() => {
                  setActiveFaction(faction);
                  setSelectedId(null);
                  setPreviewPoint(null);
                  setStatus(`${getAuthenticFactionLabel(faction)} is now the active command for local board inspection.`);
                }}
                className={cn(
                  'rounded-[2rem] border p-5 text-left shadow-sm transition-all',
                  FACTION_CARD_THEME[faction],
                  activeFaction === faction ? 'ring-2 ring-amber-300/60 scale-[1.01]' : 'hover:scale-[1.01]'
                )}
              >
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
                  Inspect this faction's ivory pieces and local preview markers.
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[2.5rem] border border-[#8b6433]/25 bg-[linear-gradient(180deg,#f4ead3_0%,#ead7b0_100%)] p-8 shadow-[0_18px_50px_rgba(57,32,15,0.18)]">
            <div className="flex items-center gap-3 text-[#6f4c28] mb-4">
              <Crown size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">{modeMeta.label}</span>
            </div>
            <h1 className="text-3xl font-serif font-black text-[#35210f] uppercase leading-tight">
              Local Board Preview
            </h1>
            <p className="mt-4 text-sm font-serif italic leading-relaxed text-[#6f5737]">
              {AUTHENTIC_MODE_STATUS}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
            <div className="flex items-center gap-3 text-[#6f4c28] mb-3">
              <ShieldAlert size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Board Status</span>
            </div>
            <p className="text-sm font-serif italic leading-relaxed text-[#6d5334]">
              {status}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
            <div className="flex items-center gap-3 text-[#6f4c28] mb-3">
              <ScrollText size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Implementation Note</span>
            </div>
            <p className="text-sm font-serif italic leading-relaxed text-[#6d5334]">
              {AUTHENTIC_BOARD_NOTE}
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-6">
            <span className="text-[10px] font-black uppercase tracking-[0.35em] text-[#6f4c28]">Current Command</span>
            <div className="mt-4 flex items-center justify-between rounded-[1.5rem] border border-[#8b6433]/15 bg-white/40 px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-[#90714a] font-black">Active Faction</p>
                <p className="text-xl font-serif font-black uppercase text-[#35210f]">{activeFaction}</p>
              </div>
              <div className={cn('rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.25em]', FACTION_CARD_THEME[activeFaction])}>
                Local Only
              </div>
            </div>
            {selectedPiece && (
              <div className="mt-4 rounded-[1.5rem] border border-[#8b6433]/15 bg-white/40 px-5 py-4">
                <p className="text-xs uppercase tracking-[0.25em] text-[#90714a] font-black">Selected Piece</p>
                <p className="mt-1 text-lg font-serif font-black uppercase text-[#35210f]">
                  {AUTHENTIC_LABELS[selectedPiece.type]}
                </p>
                <p className="text-sm text-[#6d5334]">
                  {selectedPiece.faction} at ({selectedPiece.x}, {selectedPiece.y})
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Link
              to="/setup?mode=classic"
              className="bg-[#5f4021] text-[#f8edd6] px-8 py-5 rounded-2xl text-center font-black uppercase tracking-[0.3em] text-xs hover:bg-[#4d341b] transition-all"
            >
              Launch Classic
            </Link>
            <Link
              to={returnHref}
              className="bg-white/40 border border-[#8b6433]/20 text-[#35210f] px-8 py-5 rounded-2xl text-center font-black uppercase tracking-[0.3em] text-xs hover:bg-white/55 transition-all flex items-center justify-center gap-3"
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
