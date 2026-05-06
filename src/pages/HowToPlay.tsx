import { motion } from 'motion/react';
import { Sword, Move, Target, Users, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const pieces = [
  { 
    name: 'The General', 
    icon: '👑', 
    desc: 'The heart of your army. Moves one square in any direction. Defeating a General eliminates that player and lets you absorb their remaining forces.',
    stats: { power: 10, mobility: 3, rarity: 'Legendary' }
  },
  { 
    name: 'The Vanguard', 
    icon: '🛡️', 
    desc: 'Brave infantry that move forward but capture diagonally. On their first move, they can surge two squares forward.',
    stats: { power: 2, mobility: 4, rarity: 'Common' }
  },
  { 
    name: 'The Strategist', 
    icon: '📜', 
    desc: 'Masters of geometry. Can traverse the board diagonally over any distance. In Three Kingdoms Chess, they can "Betray" adjacent enemy pieces.',
    stats: { power: 7, mobility: 9, rarity: 'Epic' }
  },
  { 
    name: 'The Cavalry', 
    icon: '🐎', 
    desc: 'Unpredictable and lethal. Move in an "L" shape. The only piece that can jump over others to strike at the heart of the enemy.',
    stats: { power: 5, mobility: 8, rarity: 'Rare' }
  }
];

export default function HowToPlay() {
  return (
    <div className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-24"
      >
        <span className="text-gold font-mono text-[10px] uppercase tracking-[0.4em] mb-4 block">Master the Arts</span>
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 italic">WAR RULES</h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
          Three Kingdoms Chess is a battle of three players on a hexagonal-integrated board. 
          Victory requires more than just tactics; it requires the art of the deal.
        </p>
      </motion.div>

      {/* Core Mechanics */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
        {[
          { 
            title: "3-Player Realtime", 
            icon: Users, 
            desc: "Unlike traditional chess, the battlefield is shared by Wei, Shu, and Wu. You must watch two fronts simultaneously." 
          },
          { 
            title: "Dynamic Alliances", 
            icon: Sword, 
            desc: "Form temporary truces with the enemy of your enemy. But beware: there is only one Emperor in the end." 
          },
          { 
            title: "General Absorption", 
            icon: Shield, 
            desc: "Defeat a General to absorb their remaining army into your own. Turn the tides with their fallen soldiers." 
          }
        ].map((item, i) => (
          <div key={i} className="glass-dark p-8 rounded-3xl border border-white/5 hover:border-gold/30 transition-all">
            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center mb-6">
              <item.icon size={24} className="text-gold" />
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-4 tracking-wider">{item.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      {/* Piece Guide */}
      <section className="mb-32">
        <div className="flex items-end justify-between mb-16">
          <div>
            <h2 className="text-4xl font-serif font-bold text-white mb-4">THE <span className="text-gold italic">LEGIONS</span></h2>
            <p className="text-zinc-400">Hover over a piece to reveal its tactical importance.</p>
          </div>
          <div className="hidden md:block h-px flex-grow mx-12 bg-white/5" />
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-gold border border-gold/30 px-4 py-2 rounded-full">
            All Units Unlocked
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pieces.map((piece, i) => (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02 }}
              className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl group cursor-help"
            >
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">{piece.icon}</div>
              <h4 className="text-xl font-bold text-white mb-3 tracking-wider">{piece.name}</h4>
              <p className="text-zinc-500 text-sm mb-6 leading-relaxed min-h-[80px]">
                {piece.desc}
              </p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="text-zinc-500">Power</span>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, idx) => (
                      <div key={idx} className={cn("w-1 h-3 rounded-full", idx < piece.stats.power ? "bg-gold" : "bg-white/5")} />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="text-zinc-500">Mobility</span>
                  <div className="flex gap-1">
                    {[...Array(10)].map((_, idx) => (
                      <div key={idx} className={cn("w-1 h-3 rounded-full", idx < piece.stats.mobility ? "bg-gold" : "bg-white/5")} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Faction Table */}
      <section className="glass-dark rounded-[40px] p-12 border border-white/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[100px]" />
        <h2 className="text-3xl font-serif font-bold text-white mb-12 text-center uppercase tracking-widest">Grand Strategy Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">
                <th className="pb-8 pl-4">Faction</th>
                <th className="pb-8">Strength</th>
                <th className="pb-8">Weakness</th>
                <th className="pb-8 text-center">Difficulty</th>
                <th className="pb-8 text-right pr-4">Signature Move</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { faction: "WEI", strength: "Numerical Superiority", weakness: "High Upkeep", difficulty: "Beginner", move: "Endless Horde", color: "text-wei" },
                { faction: "SHU", strength: "Defensive Mastery", weakness: "Few Elite Units", difficulty: "Hard", move: "Silent Strike", color: "text-shu" },
                { faction: "WU", strength: "Strategic Mobility", weakness: "Low Defense", difficulty: "Expert", move: "Fire Boat", color: "text-wu" }
              ].map((row, i) => (
                <tr key={i} className="border-t border-white/5 group hover:bg-white/2 transition-colors">
                  <td className={cn("py-8 pl-4 font-bold tracking-widest px-4", row.color)}>{row.faction}</td>
                  <td className="py-8 text-zinc-300">{row.strength}</td>
                  <td className="py-8 text-zinc-500">{row.weakness}</td>
                  <td className="py-8 text-center">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-gold uppercase tracking-tighter shadow-sm border border-gold/10">
                      {row.difficulty}
                    </span>
                  </td>
                  <td className="py-8 text-right pr-4 italic text-zinc-100">{row.move}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      
      {/* Final CTA */}
      <div className="mt-32 text-center">
        <h2 className="text-3xl font-serif font-bold text-white mb-8 uppercase tracking-widest">Ready to Test Your Honor?</h2>
        <button className="bg-gold text-ink font-bold px-12 py-5 rounded-full uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 mx-auto">
          Play Practice Match <Sword size={20} />
        </button>
      </div>
    </div>
  );
}
