import { motion } from 'motion/react';
import { Sword, Users, ShieldCheck, Play, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/lib/utils';

export default function Home() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-6 overflow-hidden">
        {/* Animated Background Logo Overlay (Subtle) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1.2 }}
          transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
          className="absolute pointer-events-none"
        >
          <Sword size={800} strokeWidth={0.5} className="text-gold" />
        </motion.div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="text-gold font-mono text-[10px] uppercase tracking-[0.4em] mb-4 block animate-pulse">
              10,242 LEADERS ONLINE NOW
            </span>
            <h1 className="text-6xl md:text-9xl font-serif font-bold text-white leading-tight mb-8 drop-shadow-2xl">
              GRAND <span className="text-gold italic block md:inline font-normal">STRATEGY</span> REBORN
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto mb-12 font-light leading-relaxed">
              The only chess variant where strategy, alliances, and betrayal collide. 
              Command legends of the Three Kingdoms in a brutal real-time 3-player battlefield.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="flex flex-col md:flex-row items-center justify-center gap-6"
          >
            <button className="group relative bg-gold text-ink font-bold px-10 py-5 rounded-full text-lg uppercase tracking-widest hover:scale-105 transition-all overflow-hidden">
              <span className="relative z-10 flex items-center gap-2">
                Play Free Now <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>
            
            <button className="flex items-center gap-3 text-white font-bold uppercase tracking-widest text-sm hover:text-gold transition-colors">
              <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:border-gold transition-colors">
                <Play size={20} fill="currentColor" />
              </div>
              Watch Gameplay
            </button>
          </motion.div>
        </div>

        {/* Feature Strips (Scroll hint) */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center opacity-40">
           <div className="flex flex-col items-center gap-2">
              <span className="text-[10px] uppercase tracking-[0.3em]">Scroll to Explore</span>
              <motion.div 
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-0.5 h-12 bg-gradient-to-b from-gold to-transparent" 
              />
           </div>
        </div>
      </section>

      {/* Social Proof / Trust Banner */}
      <section className="bg-white/5 py-12 flex flex-wrap justify-center items-center gap-12 md:gap-24 px-6 border-y border-white/5">
        {[
          { label: "PLAYERS", value: "10,000+" },
          { label: "RANKED MATCHES", value: "250k+" },
          { label: "LEGENDARY GENERALS", value: "60" },
          { label: "RATING", value: "4.9/5" }
        ].map((stat, i) => (
          <div key={i} className="text-center">
            <div className="text-2xl font-serif text-white font-bold mb-1">{stat.value}</div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* The Three Powers Section */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-5xl font-serif font-bold text-white mb-6">CHOOSE YOUR <span className="text-gold italic">DESTINY</span></h2>
          <p className="text-zinc-400 max-w-xl mx-auto">Master the unique playstyles and legendary tactics of the three dominant forces.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              name: "WEI", 
              color: "text-wei", 
              bg: "bg-wei/10",
              border: "border-wei/30",
              desc: "Might and Ambition. Overwhelm your foes with superior numbers and unyielding pressure.",
              trait: "Tactical Superiority"
            },
            { 
              name: "SHU", 
              color: "text-shu", 
              bg: "bg-shu/10",
              border: "border-shu/30",
              desc: "Benevolence and Honor. Use defensive mastery and sudden precision strikes to punish arrogance.",
              trait: "Guerrilla Mastery"
            },
            { 
              name: "WU", 
              color: "text-wu", 
              bg: "bg-wu/10",
              border: "border-wu/30",
              desc: "Prosperity and Strategic Depth. Control the flow of battle through resource denial and fluid movement.",
              trait: "Strategic Mobility"
            }
          ].map((faction, i) => (
            <motion.div
              whileHover={{ y: -10 }}
              key={i}
              className={cn(
                "group relative p-10 rounded-3xl border transition-all duration-500",
                faction.bg,
                faction.border,
                "hover:border-gold/50"
              )}
            >
              <div className={cn("text-xs font-bold uppercase tracking-[0.3em] mb-4 opacity-60", faction.color)}>THE KINGDOM OF</div>
              <h3 className="text-4xl font-serif font-bold text-white mb-6 tracking-widest">{faction.name}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-8">{faction.desc}</p>
              
              <div className="flex items-center gap-2 mb-10">
                <ShieldCheck size={16} className="text-gold" />
                <span className="text-xs uppercase tracking-widest font-medium text-white">{faction.trait}</span>
              </div>

              <Link to={`/lore/${faction.name.toLowerCase()}`} className="text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-2 group-hover:gap-4 transition-all">
                LEARN MORE <ArrowRight size={14} />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gold/5 opacity-40 blur-3xl rounded-full" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">ARE YOU READY TO <br className="hidden md:block" /> UNITE THE LAND?</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button className="bg-gold text-ink font-bold px-12 py-5 rounded-full uppercase tracking-widest hover:scale-105 transition-transform">
              Join the Battle
            </button>
            <button className="bg-white/5 border border-white/10 text-white font-bold px-12 py-5 rounded-full uppercase tracking-widest hover:bg-white/10 transition-colors">
              Join Discord
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
