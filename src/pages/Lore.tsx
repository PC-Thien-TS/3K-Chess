import { motion } from 'motion/react';
import { Shield, BookOpen, Scroll, History, ArrowRight } from 'lucide-react';
import Markdown from 'react-markdown';

const loreData = [
  {
    faction: "Wei",
    leader: "Cao Cao",
    motto: "Prefer to wrong the world than have the world wrong me.",
    content: `
### The Cao Wei Empire
Born from the ruins of the Han Dynasty, Wei holds the central plains. Led by the brilliant strategist **Cao Cao**, they rely on massive conscripted armies and a meritocratic system that values talent over bloodline.

**Tactical Advantage:** Wei players can "Conscript" fallen units of their own more efficiently than any other faction.
    `,
    color: "bg-wei/20",
    border: "border-wei/30",
    accent: "text-wei"
  },
  {
    faction: "Shu",
    leader: "Liu Bei",
    motto: "Virtue is the strongest shield.",
    content: `
### The Shu Han Kingdom
Founded on the principles of benevolence and loyalty, Shu fights to restore the true Han lineage. Though their territory in the western mountains is rugged, their soldiers are fiercely loyal and their generals legendary.

**Tactical Advantage:** Shu units receive defensive bonuses when protecting their General, making them the hardest to eliminate.
    `,
    color: "bg-shu/20",
    border: "border-shu/30",
    accent: "text-shu"
  },
  {
    faction: "Wu",
    leader: "Sun Quan",
    motto: "Flow like the Yangtze, strike like the storm.",
    content: `
### The Eastern Wu Dynasty
A maritime power controlling the southeastern rivers. The Sun family has ruled these lands for generations, mastering naval warfare and high-mobility tactics that leave their enemies stranded.

**Tactical Advantage:** Wu pieces gain extra movement range when traveling near the board edges or "waterways".
    `
  }
];

export default function Lore() {
  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <section className="text-center mb-24">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 inline-flex p-3 bg-gold/10 rounded-full border border-gold/20"
        >
          <History className="text-gold" size={32} />
        </motion.div>
        <h1 className="text-6xl md:text-8xl font-serif font-bold text-white mb-8 italic uppercase tracking-wider">Historical <span className="text-gold font-normal">Records</span></h1>
        <p className="text-zinc-400 max-w-2xl mx-auto text-lg leading-relaxed">
          Knowledge of the past is the sharpest blade in a tactician's arsenal. Learn the stories that shaped the Three Kingdoms.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-24">
        {loreData.map((item, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className={`flex flex-col ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 items-center`}
          >
            <div className="flex-1 w-full">
               <div className={`aspect-video w-full rounded-[40px] overflow-hidden border ${item.border || 'border-gold/20'} relative group`}>
                  <div className={`absolute inset-0 ${item.color || 'bg-gold/10'} mix-blend-overlay`} />
                  <div className="absolute inset-0 flex items-center justify-center text-8xl md:text-9xl font-serif font-black opacity-10 uppercase tracking-[2rem] text-white">
                    {item.faction}
                  </div>
                  {/* Decorative Elements */}
                  <div className="absolute bottom-8 left-8 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center text-white">
                      <Scroll size={20} />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-white/60">Record #{i+1}</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 space-y-8">
               <div className="flex items-center gap-3">
                 <div className="h-px w-12 bg-gold" />
                 <span className={`text-xs font-bold uppercase tracking-[0.4em] ${item.accent || 'text-gold'}`}>Leader: {item.leader}</span>
               </div>
               
               <p className="text-2xl font-serif font-italic text-zinc-100 italic leading-relaxed">
                 "{item.motto}"
               </p>

               <div className="markdown-body prose prose-invert max-w-none text-zinc-400 prose-headings:text-white prose-strong:text-gold prose-h3:font-serif prose-h3:text-3xl prose-h3:mb-6">
                 <Markdown>{item.content}</Markdown>
               </div>

               <button className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.4em] text-white hover:text-gold transition-colors pt-6 border-t border-white/5 w-fit">
                 Deep Dive Bibliography <ArrowRight size={14} />
               </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Interactive Map Teaser */}
      <section className="mt-40 glass-dark rounded-[60px] p-12 md:p-24 border border-white/5 relative overflow-hidden text-center">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gold/5 blur-[120px]" />
         <BookOpen className="text-gold mx-auto mb-8" size={64} />
         <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">THE ANCIENT <span className="text-gold italic">ATLAS</span></h2>
         <p className="text-zinc-400 max-w-xl mx-auto mb-12">
           Explore the contested borders and historical battlefields of ancient China in our interactive 3D tactical map.
         </p>
         <button className="bg-gold text-ink font-bold px-12 py-5 rounded-full uppercase tracking-widest hover:scale-105 transition-transform">
           Launch Interactive Map
         </button>
      </section>
    </div>
  );
}
