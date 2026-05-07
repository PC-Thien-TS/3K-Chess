import { motion } from 'motion/react';
import { ScrollText, CheckCircle2 } from 'lucide-react';

const rules = [
  "There are 3 players: Shu, Wei, and Wu.",
  "Shu moves first.",
  "Turn order is fixed: Shu → Wei → Wu.",
  "Each faction has 16 standard Xiangqi pieces.",
  "Special pieces are disabled in Standard v1.",
  "A player must move one legal piece on their turn.",
  "Passing is not allowed.",
  "A move is illegal if it leaves your own General in check.",
  "The General-facing rule is enabled.",
  "A faction is eliminated when its General is checkmated.",
  "When eliminated, all pieces of that faction are removed from the board.",
  "The last faction with a surviving General wins."
];

export default function RulesSection() {
  return (
    <section id="rules" className="py-32 px-6 max-w-5xl mx-auto scroll-mt-20">
      <div className="glass-dark border border-white/5 rounded-[60px] p-12 md:p-20 relative overflow-hidden">
        {/* Subtle background icon */}
        <ScrollText className="absolute right-[-10%] top-[-10%] text-gold opacity-[0.03] scale-[4]" />
        
        <div className="text-center mb-16 relative z-10">
          <h2 className="text-4xl font-serif font-bold text-white mb-4 uppercase tracking-widest leading-tight">
            3K CHESS <span className="text-gold italic block md:inline font-normal lowercase">Standard Rule v1</span>
          </h2>
          <p className="text-zinc-500 font-medium uppercase tracking-[0.2em] text-xs">
            A clean competitive rule set for the first playable version.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 relative z-10">
          {rules.map((rule, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-4"
            >
              <CheckCircle2 className="text-gold shrink-0 mt-1" size={18} />
              <p className="text-zinc-300 text-sm leading-relaxed">{rule}</p>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-16 flex justify-center">
          <div className="px-6 py-2 rounded-full border border-gold/20 bg-gold/5 text-gold text-[10px] font-bold uppercase tracking-[.3em]">
            Official League Ruleset
          </div>
        </div>
      </div>
    </section>
  );
}
