import { Faction, PieceType } from '@/src/rules/threeKingdomRules';
import { cn } from '@/src/lib/utils';

type BoardPieceTokenProps = {
  faction: Faction;
  pieceType: PieceType;
  selected?: boolean;
  inCheck?: boolean;
  attacker?: boolean;
  dimmed?: boolean;
  interactive?: boolean;
  turnOwned?: boolean;
  compact?: boolean;
};

const FACTION_THEME: Record<Faction, { rim: string; aura: string; ink: string; glow: string }> = {
  Shu: {
    rim: 'border-rose-400/80',
    aura: 'from-rose-500/28 via-rose-400/10 to-transparent',
    ink: 'text-rose-200',
    glow: 'shadow-[0_10px_24px_rgba(127,29,29,0.38)]',
  },
  Wei: {
    rim: 'border-blue-400/80',
    aura: 'from-blue-500/26 via-blue-400/10 to-transparent',
    ink: 'text-blue-100',
    glow: 'shadow-[0_10px_24px_rgba(30,58,138,0.38)]',
  },
  Wu: {
    rim: 'border-emerald-400/80',
    aura: 'from-emerald-500/26 via-emerald-400/10 to-transparent',
    ink: 'text-emerald-100',
    glow: 'shadow-[0_10px_24px_rgba(6,95,70,0.38)]',
  },
  None: {
    rim: 'border-zinc-500/70',
    aura: 'from-zinc-500/20 via-zinc-400/[0.08] to-transparent',
    ink: 'text-zinc-200',
    glow: 'shadow-[0_10px_24px_rgba(24,24,27,0.4)]',
  },
};

const PIECE_TAGS: Record<PieceType, string> = {
  G: 'GEN',
  A: 'ADV',
  E: 'ELE',
  H: 'HOR',
  R: 'CHR',
  P: 'CAN',
  S: 'SOL',
};

export default function BoardPieceToken({
  faction,
  pieceType,
  selected = false,
  inCheck = false,
  attacker = false,
  dimmed = false,
  interactive = false,
  turnOwned = false,
  compact = false,
}: BoardPieceTokenProps) {
  const theme = FACTION_THEME[faction];

  return (
    <div
      className={cn(
        'relative h-full w-full rounded-full transition-all duration-200',
        theme.glow,
        selected ? 'scale-[1.14]' : interactive ? 'group-hover:scale-[1.06] group-active:scale-[1.03]' : '',
        turnOwned && !selected && 'drop-shadow-[0_0_16px_rgba(245,215,128,0.14)]',
        dimmed && 'opacity-52 saturate-75',
      )}
    >
      <div
        className={cn(
          'absolute inset-0 rounded-full border bg-[radial-gradient(circle_at_30%_28%,rgba(255,255,255,0.14),transparent_38%),linear-gradient(180deg,rgba(62,46,28,0.96),rgba(20,14,10,0.98)_62%,rgba(8,6,4,1))]',
          theme.rim,
          selected ? 'shadow-[0_0_0_4px_rgba(212,175,55,0.22),0_0_38px_rgba(212,175,55,0.4)]' : '',
          inCheck ? 'animate-pulse shadow-[0_0_0_4px_rgba(244,63,94,0.18),0_0_28px_rgba(244,63,94,0.42)]' : '',
          attacker ? 'shadow-[0_0_0_3px_rgba(250,204,21,0.14),0_0_26px_rgba(250,204,21,0.28)]' : '',
          turnOwned && !selected && 'shadow-[0_0_0_2px_rgba(245,215,128,0.12),0_0_18px_rgba(245,215,128,0.16)]',
        )}
      />
      <div className={cn('absolute inset-[8%] rounded-full bg-gradient-to-br opacity-80', theme.aura)} />
      <div className="absolute inset-[11%] rounded-full border border-white/[0.12] bg-[radial-gradient(circle_at_35%_30%,rgba(255,248,220,0.24),transparent_32%),linear-gradient(180deg,rgba(43,32,22,0.96),rgba(15,10,7,1))] shadow-[inset_0_1px_2px_rgba(255,255,255,0.18),inset_0_-10px_18px_rgba(0,0,0,0.55)]" />
      <div className="absolute inset-x-[16%] top-[12%] h-[14%] rounded-full bg-white/15 blur-[1px]" />
      <div className="absolute inset-x-[18%] bottom-[10%] h-[18%] rounded-full bg-black/35 blur-[3px]" />

      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center leading-none">
        <span
          className={cn(
            'font-serif font-black tracking-[-0.08em] drop-shadow-[0_1px_1px_rgba(0,0,0,0.75)]',
            theme.ink,
            compact ? 'text-[clamp(0.58rem,0.9vw,0.88rem)]' : 'text-[clamp(0.78rem,1.25vw,1.18rem)]',
          )}
        >
          {pieceType}
        </span>
        <span
          className={cn(
            'mt-[2px] rounded-full border border-white/10 bg-black/20 px-[0.22rem] py-[0.08rem] font-sans font-black uppercase tracking-[0.22em] text-white/55',
            compact ? 'text-[0.28rem]' : 'text-[0.34rem] sm:text-[0.38rem]',
          )}
        >
          {PIECE_TAGS[pieceType]}
        </span>
      </div>

      <div className="pointer-events-none absolute inset-[6%] rounded-full border border-white/6" />
      <div className="pointer-events-none absolute inset-[2%] rounded-full border border-black/35" />

      {selected && <div className="pointer-events-none absolute inset-[-10%] rounded-full border-2 border-gold/70 shadow-[0_0_20px_rgba(212,175,55,0.2)]" />}
      {inCheck && <div className="pointer-events-none absolute inset-[-10%] rounded-full border border-rose-400/55" />}
      {attacker && <div className="pointer-events-none absolute inset-[-7%] rounded-full border border-amber-300/45" />}
    </div>
  );
}
