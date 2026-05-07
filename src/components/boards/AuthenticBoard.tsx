import { Link } from 'react-router-dom';
import { ShieldAlert, Wrench, ScrollText } from 'lucide-react';
import { GAME_MODE_META } from '@/shared/gameModes';

const AUTHENTIC_PLACEHOLDER_MESSAGE = 'Authentic Three Kingdoms mode is under construction.';

interface AuthenticBoardProps {
  roomCode?: string;
  roomMode?: 'local' | 'online';
  context?: 'practice' | 'replay';
}

export default function AuthenticBoard({
  roomCode,
  roomMode = 'local',
  context = 'practice'
}: AuthenticBoardProps) {
  const modeMeta = GAME_MODE_META.authentic;
  const returnHref = context === 'replay' ? '/archive' : roomCode ? `/rooms/${roomCode}` : '/setup?mode=classic';
  const returnLabel = context === 'replay' ? 'Return to Archive' : roomCode ? 'Return to Lobby' : 'Return to Setup';

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12 flex items-center justify-center">
      <div className="w-full max-w-3xl glass-dark border border-amber-500/20 rounded-[3rem] p-10 md:p-14 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.1),transparent_35%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_45%)] pointer-events-none" />
        <div className="relative z-10 space-y-8">
          <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-[0.35em] text-gold">
            <span className="px-4 py-2 rounded-full border border-gold/20 bg-gold/10">{modeMeta.shortLabel}</span>
            <span className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-zinc-400">{roomMode} mode</span>
            <span className="px-4 py-2 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-200">Placeholder</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-6xl font-serif font-black text-white uppercase tracking-[0.08em] leading-tight">
              {modeMeta.label}
            </h1>
            <p className="text-zinc-300 font-serif italic text-lg leading-relaxed">
              {AUTHENTIC_PLACEHOLDER_MESSAGE}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[2rem] border border-gold/15 bg-gold/5 p-6">
              <div className="flex items-center gap-3 text-gold mb-3">
                <ShieldAlert size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Status</span>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Authentic mode is visible for planning, but match start and gameplay are intentionally disabled in this build.
              </p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
              <div className="flex items-center gap-3 text-zinc-300 mb-3">
                <ScrollText size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Classic Availability</span>
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Classic mode remains the only playable path for local matches, online rooms, replay, and archive flows.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/setup?mode=classic"
              className="flex-1 bg-gold text-black px-8 py-5 rounded-2xl text-center font-black uppercase tracking-[0.3em] text-xs hover:bg-white transition-all"
            >
              Launch Classic
            </Link>
            <Link
              to={returnHref}
              className="flex-1 bg-white/5 border border-white/10 text-white px-8 py-5 rounded-2xl text-center font-black uppercase tracking-[0.3em] text-xs hover:bg-white/10 transition-all flex items-center justify-center gap-3"
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
