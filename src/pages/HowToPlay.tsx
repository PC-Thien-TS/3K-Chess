import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  BookOpen,
  Bot,
  Crown,
  Flag,
  Gavel,
  Network,
  Shield,
  ShieldAlert,
  Swords,
  Users,
} from 'lucide-react';

const classicGuide = [
  {
    title: 'Local Play',
    icon: Swords,
    body:
      'Classic can be played locally on one device. Shu, Wei, and Wu take turns in sequence, and the board UX shows the active faction, legal moves, and capture threats.',
  },
  {
    title: 'Online Rooms',
    icon: Network,
    body:
      'Classic rooms support host-and-guest play through room codes. Each commander claims a faction slot, marks ready, and enters the live board once the host starts the match.',
  },
  {
    title: 'Bots',
    icon: Bot,
    body:
      'Classic supports bot-controlled kingdoms in local play and in supported room setups. The turn banner and faction panel show when a bot is thinking.',
  },
  {
    title: 'Replay & Archive',
    icon: Archive,
    body:
      'Classic records can be saved to the archive, replayed move by move, and exported. The archive also keeps older saved matches compatible with the existing replay flow.',
  },
];

const modernSystems = [
  {
    title: 'Local-Only Campaign',
    icon: Shield,
    body:
      'Modern 3K is a local-only authentic ruleset. There is no online room flow for this mode in v1, but local bots and local replay are supported.',
  },
  {
    title: 'Han Court',
    icon: Crown,
    body:
      'The Han Emperor begins as a neutral objective. Han military pieces stay protected while the Emperor remains in place, and only a Horse may depose the Emperor.',
  },
  {
    title: 'Alliance',
    icon: Users,
    body:
      'Alliance points can create temporary political alignments. Allied kingdoms cannot capture each other while the alliance state is active.',
  },
  {
    title: 'Check Priority',
    icon: ShieldAlert,
    body:
      'Modern 3K can interrupt the base turn cycle with check priority. If one or more factions are in check, the threatened faction takes priority to respond.',
  },
  {
    title: 'Army Absorption',
    icon: Flag,
    body:
      'When a kingdom loses its General, the surviving attacker absorbs that army. This can swing board control sharply without changing the underlying move rules.',
  },
];

const pieceGuide = [
  {
    name: 'General',
    classic: 'Moves one point orthogonally inside the palace.',
    modern: 'Same palace movement in Modern 3K.',
  },
  {
    name: 'Advisor',
    classic: 'Moves one point diagonally inside the palace.',
    modern: 'Same palace restriction in Modern 3K.',
  },
  {
    name: 'Elephant',
    classic: 'Moves diagonally with its territory restriction.',
    modern: 'Moves two points diagonally, ignores eye-blocks, and still respects territory.',
  },
  {
    name: 'Horse',
    classic: 'Moves in an L-shape.',
    modern: 'Still L-shaped, ignores leg-blocks, and can depose the Han Emperor.',
  },
  {
    name: 'Chariot',
    classic: 'Moves any distance in a straight line.',
    modern: 'Same straight-line movement in Modern 3K.',
  },
  {
    name: 'Cannon',
    classic: 'Moves straight and captures by leaping exactly one screen.',
    modern: 'Same screen capture idea, with Modern 3K opening restrictions still applied.',
  },
  {
    name: 'Soldier',
    classic: 'Advances forward and gains more freedom after crossing the line.',
    modern: 'Moves one orthogonal point under the Authentic territory and direction rules.',
  },
  {
    name: 'Han Emperor',
    classic: 'Not used in Classic mode.',
    modern: 'Neutral objective. Only a Horse may depose the Emperor and trigger Han military control changes.',
  },
];

const roomFlow = [
  'Create a Classic room from the rooms lobby.',
  'Share the room code with the other commanders.',
  'Join with that code from the join-room screen.',
  'Claim an open faction slot such as Shu, Wei, or Wu.',
  'Mark ready and let the host start the match once the room is set.',
];

const archiveNotes = [
  'Classic matches can be saved locally and replayed from the archive.',
  'Modern 3K local matches can also be saved and replayed with the local replay viewer.',
  'Archive entries can be exported for external record keeping without altering gameplay rules.',
];

export default function HowToPlay() {
  return (
    <div className="pt-24">
      <section className="px-4 pb-12 pt-8 sm:px-6">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] border border-gold/15 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.42)] sm:p-12 lg:p-16">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.32em] text-gold">
              <BookOpen size={14} />
              How to Play
            </span>
            <h1 className="mt-6 text-4xl font-serif font-black uppercase tracking-[0.16em] text-white sm:text-5xl lg:text-6xl">
              Command Guide
            </h1>
            <p className="mt-6 max-w-3xl text-base font-serif italic leading-relaxed text-zinc-300 sm:text-lg">
              Learn the structure of Classic 3-Player Xiangqi, the local-only politics of Modern 3K, the piece roles, the online room flow, and how replay/archive works without touching the live rules.
            </p>
          </div>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
            <Link
              to="/rooms/create?mode=classic"
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-gold px-6 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-black transition-all hover:bg-white active:scale-[0.98]"
            >
              Play Classic Online
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/setup?mode=authentic"
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-gold/15 bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-white transition-all hover:bg-white/10 active:scale-[0.98]"
            >
              Play Modern 3K Local
            </Link>
            <Link
              to="/archive"
              className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-[11px] font-black uppercase tracking-[0.28em] text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              Open Archive
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10">
          <h2 className="text-3xl font-serif font-black uppercase tracking-[0.14em] text-white sm:text-4xl">
            Classic 3-Player Xiangqi
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-serif italic leading-relaxed text-zinc-400 sm:text-base">
            Classic is the competitive core: local play, online rooms, bots, and archive replay all live here.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {classicGuide.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06 }}
              className="glass-dark rounded-[2rem] border border-white/6 p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/10 bg-gold/10">
                <card.icon className="text-gold" size={24} />
              </div>
              <h3 className="text-2xl font-serif font-black text-white">{card.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="glass-dark rounded-[2rem] border border-white/6 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center gap-3 text-gold">
              <Network size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Online Room Flow</span>
            </div>
            <h2 className="mt-4 text-3xl font-serif font-black uppercase tracking-[0.12em] text-white">
              From Code to Board
            </h2>
            <ol className="mt-6 space-y-4">
              {roomFlow.map((step, index) => (
                <li key={step} className="flex gap-4 rounded-[1.6rem] border border-white/6 bg-white/[0.03] px-4 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 text-[11px] font-black text-gold">
                    {index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-relaxed text-zinc-300">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="glass-dark rounded-[2rem] border border-gold/10 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center gap-3 text-gold">
              <Archive size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Replay & Archive</span>
            </div>
            <h2 className="mt-4 text-3xl font-serif font-black uppercase tracking-[0.12em] text-white">
              Study Every Battle
            </h2>
            <div className="mt-6 space-y-4">
              {archiveNotes.map((note) => (
                <div key={note} className="rounded-[1.6rem] border border-white/6 bg-white/[0.03] px-4 py-4">
                  <p className="text-sm leading-relaxed text-zinc-300">{note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10">
          <h2 className="text-3xl font-serif font-black uppercase tracking-[0.14em] text-white sm:text-4xl">
            Modern 3K
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-serif italic leading-relaxed text-zinc-400 sm:text-base">
            Modern 3K keeps the physical tabletop identity while layering Han court politics, alliance play, and priority responses on top of local-only play.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {modernSystems.map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="rounded-[2rem] border border-[#8c6331]/20 bg-[linear-gradient(180deg,#f4ead3_0%,#ead7b0_100%)] p-6 shadow-[0_18px_44px_rgba(66,45,20,0.14)] sm:p-8"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#8c6331]/18 bg-white/35 text-[#6f4c28]">
                <card.icon size={24} />
              </div>
              <h3 className="text-2xl font-serif font-black text-[#35210f]">{card.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-[#6d5334]">{card.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-10">
          <h2 className="text-3xl font-serif font-black uppercase tracking-[0.14em] text-white sm:text-4xl">
            Piece Guide
          </h2>
          <p className="mt-3 max-w-3xl text-sm font-serif italic leading-relaxed text-zinc-400 sm:text-base">
            The same families of units appear across both modes, but Modern 3K adds the Han Emperor objective and a few rule-specific twists.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {pieceGuide.map((piece) => (
            <div key={piece.name} className="glass-dark rounded-[1.8rem] border border-white/6 p-5 shadow-xl">
              <h3 className="text-xl font-serif font-black uppercase tracking-[0.08em] text-white">{piece.name}</h3>
              <div className="mt-4 rounded-[1.3rem] border border-gold/10 bg-gold/5 px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-gold">Classic</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{piece.classic}</p>
              </div>
              <div className="mt-4 rounded-[1.3rem] border border-white/6 bg-white/[0.03] px-4 py-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-400">Modern 3K</p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-300">{piece.modern}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="glass-dark rounded-[2rem] border border-white/6 p-6 shadow-2xl sm:p-8">
            <div className="flex items-center gap-3 text-gold">
              <Gavel size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">What Wins the Game</span>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-zinc-300">
              In both modes, the board is about surviving political and tactical pressure, not changing the basic contract of move legality. Protect your command, exploit checked opponents, and use replay to study the exact tempo of each collapse.
            </p>
          </div>
          <div className="rounded-[2rem] border border-gold/12 bg-gold/[0.04] p-6 shadow-2xl sm:p-8">
            <div className="flex items-center gap-3 text-gold">
              <BookOpen size={20} />
              <span className="text-[10px] font-black uppercase tracking-[0.35em]">Next Stops</span>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link to="/setup?mode=classic" className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/10 active:scale-[0.98]">
                Practice Classic
              </Link>
              <Link to="/rooms" className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/10 active:scale-[0.98]">
                Enter Classic Rooms
              </Link>
              <Link to="/setup?mode=authentic" className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/10 active:scale-[0.98]">
                Launch Modern 3K Local
              </Link>
              <Link to="/archive" className="rounded-2xl border border-white/8 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.24em] text-white transition-all hover:bg-white/10 active:scale-[0.98]">
                Open Archive
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
