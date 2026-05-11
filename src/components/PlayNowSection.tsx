import { motion } from 'motion/react';
import { Play, User, PlusCircle, Lock, Sword, Users, ShieldAlert, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

const modes = [
  {
    title: "Classic Online Room",
    desc: "Create or host a Classic room for online multiplayer or local war-room sessions.",
    btnText: "Play Classic Online",
    path: "/rooms/create?mode=classic",
    icon: User,
    active: true
  },
  {
    title: "Classic Practice",
    desc: "Practice Classic locally with bots, standard rules, and replay-ready match flow.",
    btnText: "Practice Classic",
    path: "/setup?mode=classic",
    icon: PlusCircle,
    active: true
  },
  {
    title: "Modern 3K Local",
    desc: "Play the local-only authentic ruleset with Han court, alliance mechanics, and local bot support.",
    btnText: "Play Modern 3K Local",
    path: "/setup?mode=authentic",
    icon: Play,
    active: true
  },
  {
    title: "Ranked Mode",
    desc: "Compete for seasonal glory, rating, and leaderboard position.",
    btnText: "Coming Soon",
    icon: Lock,
    active: false
  }
];

export default function PlayNowSection() {
  return (
    <section id="play-now" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 uppercase tracking-widest">ENTER THE <span className="text-gold">THREE KINGDOMS</span></h2>
        <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-sm italic">
          Choose Classic for rooms and replay, or Modern 3K for local authentic-rules command.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {modes.map((mode, i) => {
          const Icon = mode.icon;
          const ButtonContent = (
            <button 
              className={cn(
                "w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-[0.2em] transition-all",
                mode.active 
                  ? "bg-gold text-ink hover:scale-[1.02] shadow-lg shadow-gold/5" 
                  : "bg-white/5 text-zinc-600 cursor-not-allowed"
              )}
              disabled={!mode.active && mode.title === "Ranked Mode"}
              onClick={() => {
                // Actions handled by path or disabled state
              }}
            >
              {mode.btnText}
            </button>
          );

          return (
            <motion.div
              key={i}
              whileHover={mode.active ? { y: -5 } : {}}
              className={cn(
                "glass-dark border p-10 rounded-[40px] flex flex-col h-full",
                mode.active ? "border-white/5" : "border-white/5 opacity-50 grayscale"
              )}
            >
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-8 border border-white/10">
                <Icon size={24} className={mode.active ? "text-gold" : "text-zinc-500"} />
              </div>
              <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-wider">{mode.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-10 flex-grow">
                {mode.desc}
              </p>
              
              {mode.path ? (
                <Link to={mode.path} className="w-full">
                  {ButtonContent}
                </Link>
              ) : ButtonContent}
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {[
          { label: "Classic Rooms", icon: Users },
          { label: "Modern 3K Local", icon: Zap },
          { label: "Replay Archive", icon: Sword },
          { label: "Han Court Rules", icon: ShieldAlert },
        ].map((badge, idx) => (
          <div key={idx} className="flex items-center gap-2 px-6 py-3 rounded-full border border-white/5 bg-white/2 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
            <badge.icon size={12} className="text-gold" />
            {badge.label}
          </div>
        ))}
      </div>
    </section>
  );
}
