import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Crown, ScrollText, ShieldAlert, Trophy } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import ReplayPlaybackPanel, { type ReplayPlaybackSpeed } from '@/src/components/replay/ReplayPlaybackPanel';
import type { MatchRecord } from '@/src/rules/threeKingdomRules';
import type { AuthenticReplaySnapshot } from '@/src/rules/authenticReplayReducer';
import {
  AUTHENTIC_ALLIANCE_POINTS,
  AUTHENTIC_COLS,
  AUTHENTIC_GLYPHS,
  AUTHENTIC_LABELS,
  AUTHENTIC_POINT_ACCENTS,
  AUTHENTIC_ROWS,
  getAllianceStatus,
  getAuthenticFactionLabel,
  getHanStatus,
  type AuthenticFaction,
  type AuthenticFactionOrNeutral,
  type AuthenticPiece,
  type AuthenticSpecialMove,
} from '@/src/rules/authenticThreeKingdomRules';

interface AuthenticReplayBoardProps {
  record: MatchRecord;
  snapshot: AuthenticReplaySnapshot;
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: ReplayPlaybackSpeed;
  onTogglePlay: () => void;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  onJumpToStep: (step: number) => void;
  onSpeedChange: (speed: ReplayPlaybackSpeed) => void;
}

const FACTION_CARD_THEME: Record<AuthenticFactionOrNeutral, string> = {
  Shu: 'border-rose-300/55 bg-rose-100/55 text-rose-900',
  Wei: 'border-slate-400/55 bg-blue-100/50 text-slate-900',
  Wu: 'border-emerald-300/55 bg-emerald-100/55 text-emerald-900',
  Han: 'border-amber-300/60 bg-amber-100/65 text-amber-900',
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

function samePoint(a: { x: number; y: number }, b: { x: number; y: number }) {
  return a.x === b.x && a.y === b.y;
}

function getAlliancePointFaction(point: { x: number; y: number }) {
  return (
    (Object.entries(AUTHENTIC_ALLIANCE_POINTS) as [AuthenticFaction, { x: number; y: number }][]).find(
      ([, alliancePoint]) => alliancePoint.x === point.x && alliancePoint.y === point.y
    )?.[0] || null
  );
}

function PieceToken({ piece }: { piece: AuthenticPiece }) {
  const theme = PIECE_THEME[piece.visualFaction];
  const showOwnerBadge = piece.owner !== piece.visualFaction && piece.owner !== 'Han';

  return (
    <div
      className={cn(
        'relative flex h-full w-full items-center justify-center rounded-full border-[2px] bg-[radial-gradient(circle_at_35%_32%,rgba(255,255,255,0.95),rgba(248,239,220,0.98)_58%,rgba(219,196,161,0.98)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_5px_rgba(120,90,52,0.10)] transition-all',
        theme.rim,
        theme.shadow
      )}
    >
      <div className="absolute inset-[8%] rounded-full border border-black/10" />
      <div className="absolute inset-x-[20%] top-[11%] h-[10%] rounded-full bg-white/45" />
      {showOwnerBadge && (
        <div className="absolute right-[7%] top-[7%] flex h-[18%] w-[18%] items-center justify-center rounded-full border border-white/70 bg-slate-800 text-[0.42rem] font-black uppercase text-white">
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

const SHU_X = regionBounds(3, 13);
const SHU_Y = regionBounds(0, 4);
const WEI_X = regionBounds(3, 13);
const WEI_Y = regionBounds(12, 16);
const WU_X = regionBounds(0, 4);
const WU_Y = regionBounds(3, 13);
const HAN_X = regionBounds(6, 10);
const HAN_Y = regionBounds(6, 10);

function formatPoint(point: { x: number; y: number }) {
  return `${point.x},${point.y}`;
}

export default function AuthenticReplayBoard({
  record,
  snapshot,
  currentStep,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onJumpToStep,
  onSpeedChange,
}: AuthenticReplayBoardProps) {
  const currentMove = snapshot.lastMoveRecord;
  const lastMove = snapshot.lastMove;
  const moveItems = [
    {
      step: 0,
      label: 'Initial deployment of Wu, Wei, Shu, and the Han court.',
      detail: 'Replay starts before the first local move is applied.',
    },
    ...((record.authenticReplay?.moves ?? []).map((move, index) => ({
      step: index + 1,
      label: move.note,
      detail: move.special?.length
        ? move.special
            .map((special) => SPECIAL_EVENT_LABELS[special])
            .join(' • ')
        : `${AUTHENTIC_LABELS[move.pieceType]} moved from ${formatPoint(move.from)} to ${formatPoint(move.to)}.`,
    })) ?? []),
  ];

  return (
    <div data-testid="authentic-replay-board" className="min-h-screen container mx-auto px-4 pb-12 pt-24 sm:px-6">
      <div className="grid grid-cols-1 items-start gap-6 lg:gap-8 2xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-[0.28em] text-[#6b4a26] sm:gap-3 sm:text-[10px] sm:tracking-[0.35em]">
            <span className="rounded-full border border-[#8c6331]/25 bg-[#f3e4be] px-4 py-2">Modern 3K Replay</span>
            <span className="rounded-full border border-[#8c6331]/20 bg-[#efe2c6] px-4 py-2 text-[#8b7755]">Read Only</span>
            <span className="rounded-full border border-[#8c6331]/20 bg-[#efe2c6] px-4 py-2 text-[#8b7755]">
              {record.matchStats.totalMoves} Recorded Moves
            </span>
          </div>

          <div className="mx-auto w-full max-w-[820px] rounded-[2rem] border border-[#8c6331]/22 bg-[#ead7b0] p-3 shadow-[0_18px_44px_rgba(66,45,20,0.16)] sm:rounded-[3rem] sm:p-6 md:p-8">
            <div className="relative aspect-square w-full overflow-hidden rounded-[1.65rem] border border-[#7a5730]/28 bg-[#f4e7c9] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.22)] sm:rounded-[2.2rem]">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(120,86,46,0.025)_0,rgba(120,86,46,0.025)_2px,transparent_2px,transparent_18px),repeating-linear-gradient(0deg,rgba(120,86,46,0.018)_0,rgba(120,86,46,0.018)_1px,transparent_1px,transparent_12px)] opacity-70" />
              <div className="absolute inset-[4.8%] rounded-[2rem] border border-[#7a5730]/18" />
              <div className="absolute rounded-[1.2rem] bg-rose-200/10" style={{ left: `${SHU_X.start}%`, top: `${SHU_Y.start}%`, width: `${SHU_X.size}%`, height: `${SHU_Y.size}%` }} />
              <div className="absolute rounded-[1.2rem] bg-emerald-200/10" style={{ left: `${WU_X.start}%`, top: `${WU_Y.start}%`, width: `${WU_X.size}%`, height: `${WU_Y.size}%` }} />
              <div className="absolute rounded-[1.2rem] bg-slate-200/10" style={{ left: `${WEI_X.start}%`, top: `${WEI_Y.start}%`, width: `${WEI_X.size}%`, height: `${WEI_Y.size}%` }} />
              <div className="absolute rounded-[1rem] bg-amber-200/12" style={{ left: `${HAN_X.start}%`, top: `${HAN_Y.start}%`, width: `${HAN_X.size}%`, height: `${HAN_Y.size}%` }} />

              <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
                {Array.from({ length: AUTHENTIC_COLS }).map((_, x) => (
                  <line key={`v-${x}`} x1={svgPoint(x)} y1={BOARD_MIN} x2={svgPoint(x)} y2={BOARD_MAX} stroke="rgba(71,45,22,0.48)" strokeWidth="0.34" />
                ))}
                {Array.from({ length: AUTHENTIC_ROWS }).map((_, y) => (
                  <line key={`h-${y}`} x1={BOARD_MIN} y1={svgPoint(y)} x2={BOARD_MAX} y2={svgPoint(y)} stroke="rgba(71,45,22,0.48)" strokeWidth="0.34" />
                ))}
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
                  const piece = snapshot.pieces.find((entry) => entry.x === x && entry.y === y);
                  const allianceFaction = getAlliancePointFaction(point);
                  const isLastMoveFrom = !!lastMove && samePoint(lastMove.from, point);
                  const isLastMoveTo = !!lastMove && samePoint(lastMove.to, point);
                  const isAccent = AUTHENTIC_POINT_ACCENTS.some((accent) => samePoint(accent, point));

                  return (
                    <React.Fragment key={`${x}-${y}`}>
                      {(isAccent || isLastMoveFrom || isLastMoveTo || allianceFaction || (x === 8 && y === 8)) && (
                        <div
                          className="pointer-events-none absolute z-20"
                          style={{ ...coordinateToStyle(x, y), transform: 'translate(-50%, -50%)' }}
                        >
                          {isLastMoveFrom && <div className="absolute left-1/2 top-1/2 h-[1.45rem] w-[1.45rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-400/35 bg-sky-100/8 sm:h-[1.65rem] sm:w-[1.65rem]" />}
                          {isLastMoveTo && <div className="absolute left-1/2 top-1/2 h-[1.65rem] w-[1.65rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-600/48 bg-amber-200/10 sm:h-[1.9rem] sm:w-[1.9rem]" />}
                          {allianceFaction && (
                            <div className="absolute left-1/2 top-1/2 flex h-[1rem] w-[1rem] -translate-x-1/2 -translate-y-1/2 rotate-45 items-center justify-center rounded-[0.14rem] border border-[#7a521f]/45 bg-amber-200/28">
                              <span className="-rotate-45 text-[0.42rem] font-black uppercase tracking-[0.1em] text-[#6a4517]">{allianceFaction[0]}</span>
                            </div>
                          )}
                          {x === 8 && y === 8 && <div className="absolute left-1/2 top-1/2 h-[1.15rem] w-[1.15rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-amber-700/42 sm:h-[1.35rem] sm:w-[1.35rem]" />}
                          {isAccent && <div className="absolute left-1/2 top-1/2 h-[0.28rem] w-[0.28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5f4225]/60" />}
                        </div>
                      )}
                      <div
                        className="pointer-events-none absolute z-10 h-[6.8%] w-[6.8%] rounded-full sm:h-[5.8%] sm:w-[5.8%] lg:h-[4.8%] lg:w-[4.8%]"
                        style={{ ...coordinateToStyle(x, y), transform: 'translate(-50%, -50%)' }}
                      />
                      {piece && (
                        <div
                          className="pointer-events-none absolute z-30 h-[8.1%] w-[8.1%] sm:h-[6.8%] sm:w-[6.8%] lg:h-[6.1%] lg:w-[6.1%]"
                          style={{ ...coordinateToStyle(piece.x, piece.y), transform: 'translate(-50%, -50%)' }}
                        >
                          <PieceToken piece={piece} />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          <ReplayPlaybackPanel
            theme="authentic"
            currentStep={currentStep}
            totalSteps={totalSteps}
            isPlaying={isPlaying}
            playbackSpeed={playbackSpeed}
            onTogglePlay={onTogglePlay}
            onFirst={onFirst}
            onPrevious={onPrevious}
            onNext={onNext}
            onLast={onLast}
            onJumpToStep={onJumpToStep}
            onSpeedChange={onSpeedChange}
            moveItems={moveItems}
            currentStepTestId="authentic-replay-step"
            nextButtonTestId="authentic-replay-next"
          />
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="rounded-[2rem] border border-[#8b6433]/25 bg-[linear-gradient(180deg,#f4ead3_0%,#ead7b0_100%)] p-5 shadow-[0_18px_50px_rgba(57,32,15,0.18)] sm:rounded-[2.5rem] sm:p-8">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <Crown size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Archive Replay</span>
            </div>
            <h1 className="text-2xl font-serif font-black uppercase leading-tight text-[#35210f] sm:text-3xl">
              Modern 3K Local Replay
            </h1>
            <p className="mt-4 text-sm font-serif italic leading-relaxed text-[#6f5737]">
              Read-only reconstruction of a saved Authentic local match.
            </p>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <ShieldAlert size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Command Status</span>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Current Step</p>
                <p className="mt-1 text-sm font-serif font-black text-[#35210f]">
                  {currentStep} of {totalSteps}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Current Turn</p>
                <p className="mt-1 text-sm font-serif font-black text-[#35210f]">{snapshot.currentTurn}</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Han Court</p>
                <p className="mt-1 text-sm font-serif font-black text-[#35210f]">{getHanStatus(snapshot.hanController)}</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Alliance</p>
                <p className="mt-1 text-sm font-serif text-[#35210f]">{getAllianceStatus(snapshot.allianceState)}</p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Winner</p>
                <p className="mt-1 text-sm font-serif text-[#35210f]">
                  {snapshot.winner ? `${snapshot.winner} wins and controls the last surviving command.` : 'No winner yet.'}
                </p>
              </div>
              <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Eliminated Factions</p>
                <p className="mt-1 text-sm font-serif text-[#35210f]">
                  {snapshot.eliminated.length > 0 ? snapshot.eliminated.join(', ') : 'None'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[#8b6433]/20 bg-[#f7eedb] p-4 sm:p-6">
            <div className="mb-4 flex items-center gap-3 text-[#6f4c28]">
              <ScrollText size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Latest Move</span>
            </div>
            {currentMove ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em]', FACTION_CARD_THEME[currentMove.faction])}>
                    {getAuthenticFactionLabel(currentMove.faction)}
                  </span>
                  <span className="rounded-full border border-[#8b6433]/15 bg-white/55 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#35210f]">
                    {AUTHENTIC_LABELS[currentMove.pieceType]}
                  </span>
                </div>
                <div className="rounded-[1.3rem] border border-[#8b6433]/15 bg-white/45 px-4 py-3">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-[#90714a]">Path</p>
                  <p className="mt-1 font-mono text-sm text-[#35210f]">
                    {formatPoint(currentMove.from)} to {formatPoint(currentMove.to)}
                  </p>
                </div>
                {currentMove.special && currentMove.special.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentMove.special.map((special) => (
                      <span key={`${currentMove.id}-${special}`} className={cn('rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em]', SPECIAL_EVENT_THEME[special])}>
                        {SPECIAL_EVENT_LABELS[special]}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm font-serif italic leading-relaxed text-[#6d5334]">{currentMove.note}</p>
              </div>
            ) : (
              <p className="text-sm font-serif italic text-[#6d5334]">Initial deployment. No move selected yet.</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-1">
            {(['Wu', 'Wei', 'Shu', 'Han'] as AuthenticFactionOrNeutral[]).map((faction) => (
              <div key={faction} className={cn('rounded-[2rem] border p-5 shadow-sm', FACTION_CARD_THEME[faction])}>
                <div className="flex items-start justify-between gap-3">
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
                    ? snapshot.hanController
                      ? `Military controlled by ${snapshot.hanController}.`
                      : 'Neutral court with static military.'
                    : snapshot.eliminated.includes(faction)
                      ? 'Command eliminated from direct play.'
                      : `Moves taken: ${snapshot.factionMoveCounts[faction]}`}
                </p>
              </div>
            ))}
          </div>

          <Link
            to="/archive"
            className="flex items-center justify-center gap-3 rounded-2xl border border-[#8b6433]/20 bg-white/40 px-6 py-4 text-center text-[11px] font-black uppercase tracking-[0.24em] text-[#35210f] transition-all hover:bg-white/55 sm:px-8 sm:py-5 sm:text-xs sm:tracking-[0.3em]"
          >
            <ChevronLeft size={16} />
            Return to Archive
          </Link>
        </div>
      </div>
    </div>
  );
}
