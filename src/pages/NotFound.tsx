import { Compass, Home, Shield, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="pt-24 min-h-screen container mx-auto flex items-center justify-center px-4 pb-12 sm:px-6">
      <div className="glass-dark w-full max-w-2xl rounded-[2.5rem] border border-white/10 p-8 text-center shadow-2xl sm:rounded-[3rem] sm:p-12">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-gold">
          <Compass size={36} />
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.4em] text-gold">404</p>
        <h1 className="mt-4 text-3xl font-serif font-black uppercase tracking-[0.12em] text-white sm:text-4xl">
          Route Not Found
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm font-serif italic leading-relaxed text-zinc-400 sm:text-base">
          The route you entered does not point to an active campaign. Return home, open a Classic 3-Player Xiangqi room, or start a Modern 3K local match.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-white transition-all hover:bg-white/10"
          >
            <Home size={16} /> Return Home
          </Link>
          <Link
            to="/rooms/create?mode=classic"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gold px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-black transition-all hover:bg-white"
          >
            <Users size={16} /> Play Classic Online
          </Link>
          <Link
            to="/setup?mode=authentic"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gold/20 bg-gold/10 px-5 py-4 text-[10px] font-bold uppercase tracking-[0.28em] text-gold transition-all hover:bg-gold hover:text-black"
          >
            <Shield size={16} /> Play Modern 3K Local
          </Link>
        </div>
      </div>
    </div>
  );
}
