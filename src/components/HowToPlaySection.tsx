import { motion } from 'motion/react';
import { Target, Users, RotateCcw, Shield } from 'lucide-react';

const cards = [
  {
    title: "Objective",
    icon: Target,
    body: "Three Kingdoms Chess is a 3-player strategy chess variant inspired by the Three Kingdoms era. Each player commands one kingdom: Wei, Shu, or Wu. Protect your General, exploit rival conflicts, and survive until your kingdom is the last one standing."
  },
  {
    title: "Players & Factions",
    icon: Users,
    body: "Each match has three factions: Wei, Shu, and Wu. Every faction begins with a full standard Xiangqi-style army. In Standard v1, all factions use the same piece set for fair competitive play."
  },
  {
    title: "Turn Order",
    icon: RotateCcw,
    body: "Shu moves first. Turns continue in a fixed circular order: Shu → Wei → Wu → Shu. A player must make one legal move on their turn. Passing is not allowed."
  },
  {
    title: "Win Condition",
    icon: Shield,
    body: "A faction is eliminated when its General is checkmated. Once eliminated, all remaining pieces of that faction are removed from the board. The last faction with a surviving General wins the match."
  }
];

export default function HowToPlaySection() {
  return (
    <section id="how-to-play" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 uppercase tracking-widest">HOW TO PLAY</h2>
        <p className="text-gold font-medium uppercase tracking-[0.2em] text-sm italic">
          Three kingdoms enter the battlefield. Only one General survives.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-dark border border-white/5 p-10 rounded-[40px] hover:border-gold/20 transition-all group"
          >
            <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center mb-8 border border-gold/10 group-hover:scale-110 transition-transform">
              <card.icon className="text-gold" size={28} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-white mb-4 tracking-wider">{card.title}</h3>
            <p className="text-zinc-400 leading-relaxed text-sm">
              {card.body}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
