import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';
import BoardPieceToken from '@/src/components/BoardPieceToken';
import { Faction, Move, Piece, PlayerType, Point } from '@/src/rules/classicThreeKingdomRules';

const ROWS = 17;
const COLS = 17;

type ClassicBoardProps = {
  pieces: Piece[];
  selectedId: string | null;
  legalMoves: Move[];
  latestMove: Move | null;
  turn: Faction;
  playerFaction?: Faction | null;
  roomMode: 'local' | 'online';
  controlModes: Record<Faction, PlayerType>;
  winner: Faction | null;
  checkedGeneralIds: Set<string>;
  attackerIds: Set<string>;
  onHoverPoint: (point: Point | null) => void;
  onPointClick: (x: number, y: number) => void;
};

export default function ClassicBoard({
  pieces,
  selectedId,
  legalMoves,
  latestMove,
  turn,
  playerFaction,
  roomMode,
  controlModes,
  winner,
  checkedGeneralIds,
  attackerIds,
  onHoverPoint,
  onPointClick,
}: ClassicBoardProps) {
  const isRemoteWaiting =
    roomMode === 'online' &&
    !!playerFaction &&
    turn !== playerFaction &&
    controlModes[turn] !== 'Bot' &&
    !winner;
  const isLockedTurn = isRemoteWaiting || controlModes[turn] === 'Bot' || !!winner;

  return (
    <div data-testid="classic-board" className="relative mx-auto aspect-square w-full max-w-[820px] min-w-0 overflow-hidden rounded-[1.8rem] border border-[#5d4926]/40 bg-[#100d09] p-2 sm:rounded-[2.25rem] sm:p-4 md:p-7 shadow-[0_28px_80px_rgba(0,0,0,0.82)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_14%,rgba(244,213,141,0.12),transparent_34%),radial-gradient(circle_at_18%_48%,rgba(20,83,45,0.14),transparent_26%),radial-gradient(circle_at_82%_82%,rgba(30,64,175,0.16),transparent_26%),linear-gradient(180deg,#2f2418_0%,#19120d_22%,#0d0a08_100%)]" />
      <div className="absolute inset-[1.25%] rounded-[2rem] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.03),transparent_18%,transparent_82%,rgba(0,0,0,0.35))]" />
      <div className="absolute inset-[2.2%] rounded-[1.8rem] border border-black/35 shadow-[inset_0_0_80px_rgba(0,0,0,0.72)]" />
      <div className="absolute left-[24%] top-[4%] h-[22%] w-[52%] rounded-full bg-rose-500/[0.08] blur-3xl pointer-events-none" />
      <div className="absolute left-[4%] top-[24%] h-[52%] w-[22%] rounded-full bg-emerald-500/[0.08] blur-3xl pointer-events-none" />
      <div className="absolute left-[24%] bottom-[4%] h-[22%] w-[52%] rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.09] mix-blend-overlay [background-image:linear-gradient(120deg,rgba(255,255,255,0.16)_0,transparent_22%,rgba(255,255,255,0.08)_36%,transparent_52%,rgba(0,0,0,0.18)_72%,transparent_100%)]" />

      <div className="absolute inset-0 pointer-events-none p-2 sm:p-4 md:p-7">
        <svg viewBox="0 0 170 170" className="w-full h-full fill-none" strokeWidth="0.52">
          <defs>
            <linearGradient id="board-grid-v1" x1="0%" x2="100%">
              <stop offset="0%" stopColor="rgba(244, 215, 160, 0.10)" />
              <stop offset="50%" stopColor="rgba(225, 194, 136, 0.45)" />
              <stop offset="100%" stopColor="rgba(244, 215, 160, 0.10)" />
            </linearGradient>
          </defs>
          <rect x="5" y="5" width="160" height="160" rx="2" stroke="rgba(212,175,55,0.18)" />
          {[...Array(17)].map((_, i) => (
            <line key={`v-${i}`} x1={i * 10 + 5} y1={5} x2={i * 10 + 5} y2={165} stroke="url(#board-grid-v1)" opacity={i < 4 || i > 12 ? 0.35 : 1} />
          ))}
          {[...Array(17)].map((_, i) => (
            <line key={`h-${i}`} x1={5} y1={i * 10 + 5} x2={165} y2={i * 10 + 5} stroke="url(#board-grid-v1)" opacity={i < 4 || i > 12 ? 0.35 : 1} />
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

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center p-20 select-none overflow-hidden opacity-0">
        <div className="text-[180px] font-serif text-rose-900/10 -mt-16 blur-[1px]">èœ€</div>
        <div className="flex justify-between w-full">
          <div className="text-[180px] font-serif text-emerald-900/10 -ml-20 blur-[1px]">å´</div>
          <div className="text-[180px] font-serif text-blue-900/10 -mr-20 blur-[1px] invisible">é­</div>
        </div>
        <div className="text-[180px] font-serif text-blue-900/10 -mb-16 blur-[1px]">é­</div>
      </div>

      <div className="absolute inset-0 pointer-events-none flex flex-col justify-between items-center p-6 sm:p-14 md:p-20 select-none overflow-hidden">
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
        className="relative z-10 grid h-full w-full gap-0 touch-manipulation"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
      >
        {[...Array(ROWS)].map((_, y) => (
          [...Array(COLS)].map((_, x) => {
            const piece = pieces.find((entry) => entry.x === x && entry.y === y);
            const isSelected = selectedId === piece?.id;
              const isLegalMove = legalMoves.some((move) => move.to.x === x && move.to.y === y);
              const isLastMoveFrom = !!latestMove && latestMove.from.x === x && latestMove.from.y === y;
              const isLastMoveTo = !!latestMove && latestMove.to.x === x && latestMove.to.y === y;
              const isCheckedGeneral = !!piece && checkedGeneralIds.has(piece.id);
              const isAttacker = !!piece && attackerIds.has(piece.id);
              const isTurnOwnedPiece = !!piece && piece.faction === turn;
              const isSelectablePiece = !!piece && isTurnOwnedPiece && !isLockedTurn;
              const showCaptureMarker = isLegalMove && !!piece;
              const showQuietMarker = isLegalMove && !piece;

              return (
                <div
                  key={`${x}-${y}`}
                  onClick={() => onPointClick(x, y)}
                  className={cn(
                    'group relative flex min-h-0 items-center justify-center overflow-hidden rounded-[0.7rem] transition-transform duration-150 active:scale-[0.97] sm:rounded-[0.9rem]',
                    isLockedTurn ? 'cursor-not-allowed' : 'cursor-pointer active:bg-gold/[0.05]',
                  )}
                >
                {(isLastMoveFrom || isLastMoveTo) && (
                  <div
                    className={cn(
                      'absolute inset-[7%] z-[1] rounded-[0.7rem] border sm:inset-[9%] sm:rounded-[0.9rem]',
                      isLastMoveTo
                        ? 'border-gold/60 bg-gold/10 shadow-[0_0_18px_rgba(212,175,55,0.18)]'
                        : 'border-sky-200/35 bg-sky-200/5',
                    )}
                  />
                )}

                <div className="absolute h-[2px] w-3 rounded-full bg-[#6f5b3d]/45 transition-colors group-hover:bg-gold/55 group-active:bg-gold/70" />
                <div className="absolute h-3 w-[2px] rounded-full bg-[#6f5b3d]/45 transition-colors group-hover:bg-gold/55 group-active:bg-gold/70" />
                <div className="absolute h-[4px] w-[4px] rounded-full bg-[#8a734b]/65 shadow-[0_0_6px_rgba(212,175,55,0.18)]" />

                {showQuietMarker && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    data-testid="legal-move-marker"
                    className="absolute z-40 h-6 w-6 rounded-full border border-gold/75 bg-[radial-gradient(circle,rgba(244,211,94,0.82)_0,rgba(244,211,94,0.36)_32%,rgba(244,211,94,0.08)_70%,transparent_100%)] shadow-[0_0_18px_rgba(212,175,55,0.35)] sm:h-5 sm:w-5"
                  >
                    <div className="absolute inset-[32%] rounded-full bg-black/30" />
                  </motion.div>
                )}

                {showCaptureMarker && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    data-testid="capture-marker"
                    className="absolute z-40 h-8 w-8 rounded-full border-2 border-rose-300/85 bg-rose-500/[0.18] shadow-[0_0_22px_rgba(244,63,94,0.42)] sm:h-7 sm:w-7"
                  >
                    <div className="absolute inset-[22%] rotate-45 border border-rose-100/80" />
                    <div className="absolute inset-x-[46%] top-[14%] h-[72%] w-px bg-rose-100/65" />
                    <div className="absolute inset-y-[46%] left-[14%] h-px w-[72%] bg-rose-100/65" />
                  </motion.div>
                )}

                {piece && (
                  <motion.div
                    layoutId={piece.id}
                    onMouseEnter={() => onHoverPoint({ x, y })}
                    onMouseLeave={() => onHoverPoint(null)}
                    className={cn(
                      'absolute z-20 h-[94%] w-[94%] transition-all sm:h-[90%] sm:w-[90%]',
                      isSelectablePiece ? 'cursor-grab active:cursor-grabbing active:scale-[0.97]' : 'cursor-default',
                    )}
                  >
                    <BoardPieceToken
                      faction={piece.faction}
                      pieceType={piece.type}
                      selected={isSelected}
                      inCheck={isCheckedGeneral}
                      attacker={isAttacker}
                      dimmed={!isTurnOwnedPiece || (isRemoteWaiting && piece.faction === playerFaction)}
                      interactive={isSelectablePiece}
                      turnOwned={isTurnOwnedPiece}
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
  );
}
