import { motion } from 'motion/react';
import { Archive, ArrowRight, Bot, Play, Sword, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const modes = [
  {
    title: 'Classic Online Rooms',
    desc: 'Create a Classic room, share the invite link or room code, claim a faction slot, and enter the live board when the lobby is ready.',
    btnText: 'Play Classic Online',
    path: '/rooms/create?mode=classic',
    icon: Users,
  },
  {
    title: 'Classic Practice',
    desc: 'Practice Classic locally with human or bot factions, quick restarts, save support, and replay-ready match flow.',
    btnText: 'Practice Classic',
    path: '/setup?mode=classic',
    icon: Sword,
  },
  {
    title: 'Modern 3K Local',
    desc: 'Play the local-only authentic ruleset with Han court mechanics, alliance pressure, local bots, and local replay.',
    btnText: 'Play Modern 3K Local',
    path: '/setup?mode=authentic',
    icon: Play,
  },
  {
    title: 'Open Archive',
    desc: 'Review saved Classic and Modern 3K records with replay playback, move history, and export support.',
    btnText: 'Open Archive',
    path: '/archive',
    icon: Archive,
  },
];

export default function PlayNowSection() {
  return (
    <section id="play-now" className="max-w-7xl mx-auto scroll-mt-20 px-6 py-32">
      <div className="mb-20 text-center">
        <h2 className="mb-4 text-4xl font-serif font-bold uppercase tracking-widest text-white md:text-5xl">
          Enter The <span className="text-gold">Three Kingdoms</span>
        </h2>
        <p className="text-sm font-medium uppercase tracking-[0.2em] italic text-zinc-500">
          Four real routes. No paywall. No account wall.
        </p>
      </div>

      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <motion.div
              key={mode.title}
              whileHover={{ y: -5 }}
              className="glass-dark flex h-full flex-col rounded-[2.5rem] border border-white/5 p-8"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Icon size={24} className="text-gold" />
              </div>
              <h3 className="mb-4 text-xl font-bold uppercase tracking-wider text-white">{mode.title}</h3>
              <p className="mb-10 flex-grow text-sm leading-relaxed text-zinc-400">{mode.desc}</p>

              <Link
                to={mode.path}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gold py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-ink transition-all hover:scale-[1.02] shadow-lg shadow-gold/5"
              >
                {mode.btnText}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {[
          { label: 'Classic online rooms', icon: Users },
          { label: 'Modern 3K local-only', icon: Play },
          { label: 'Local bots', icon: Bot },
          { label: 'Replay archive', icon: Archive },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
          >
            <badge.icon size={12} className="text-gold" />
            {badge.label}
          </div>
        ))}
      </div>
    </section>
  );
}
