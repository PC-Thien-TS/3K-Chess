import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Sword, ShieldCheck, Play, ArrowRight, Trophy, MessageSquare, Star, ArrowUpRight, Check, ShoppingBag, Crown, Sparkles, ShieldAlert } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import HowToPlaySection from '@/src/components/HowToPlaySection';
import RulesSection from '@/src/components/RulesSection';
import PieceGuideSection from '@/src/components/PieceGuideSection';
import PlayNowSection from '@/src/components/PlayNowSection';
import BattlefieldPreview from '@/src/components/BattlefieldPreview';

export default function Home() {
  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden scroll-mt-20 py-20">
        {/* Cinematic Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-900 pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" />
        
        {/* Animated Background Logo Overlay (Subtle) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.03, scale: 1.1 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
          className="absolute pointer-events-none top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Sword size={1200} strokeWidth={0.2} className="text-gold" />
        </motion.div>

        <div className="relative z-10 max-w-6xl mx-auto space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex items-center justify-center gap-4 mb-4">
               <div className="h-px w-12 bg-gold/30" />
               <span className="text-gold font-black text-[10px] uppercase tracking-[0.6em] animate-pulse">
                 THE DEFINITIVE 3-PLAYER CONFLICT
               </span>
               <div className="h-px w-12 bg-gold/30" />
            </div>
            
            <h1 className="text-7xl md:text-[10rem] font-serif font-black text-white leading-[0.85] mb-8 drop-shadow-2xl tracking-tighter uppercase italic">
              GRAND <span className="text-gold block -mt-4 md:-mt-10 not-italic font-black tracking-widest">STRATEGY</span>
            </h1>
            
            <div className="w-24 h-2 bg-gold/40 mx-auto rounded-full mb-10" />

            <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto font-serif italic font-light leading-relaxed opacity-90">
              "When three dragons fight, the heaven trembles. Command the legends. Claim the throne."
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center justify-center gap-8 pt-8"
          >
            <Link to="/setup?mode=classic" className="group relative bg-gold text-black font-black px-12 py-6 rounded-2xl text-lg uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-[0_20px_60px_rgba(212,175,55,0.4)] hover:bg-white overflow-hidden">
               <span className="relative z-10 flex items-center gap-3">
                 Begin Conquest <ArrowRight size={22} className="group-hover:translate-x-2 transition-transform" />
               </span>
               <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity" />
            </Link>
            
            <Link to="/rooms/create?mode=classic" className="group relative glass-dark border border-white/10 text-white font-black px-12 py-6 rounded-2xl text-lg uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 hover:bg-white/10 overflow-hidden">
               <span className="relative z-10 flex items-center gap-3">
                 Forge War Room <Play size={20} className="text-gold group-hover:scale-125 transition-transform" fill="currentColor" />
               </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 2 }}
            className="pt-16 flex flex-wrap justify-center gap-10 md:gap-20"
          >
             <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Active Commanders</span>
                <span className="text-2xl font-mono font-black text-white">12,402</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Battles Recorded</span>
                <span className="text-2xl font-mono font-black text-white">458,921</span>
             </div>
             <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Unified Success</span>
                <span className="text-2xl font-mono font-black text-white">99.8%</span>
             </div>
          </motion.div>
        </div>

        {/* Cinematic Scroll Indicator */}
        <div className="absolute bottom-12 left-0 right-0 flex justify-center py-4">
           <a href="/#play-now" className="flex flex-col items-center gap-4 group cursor-pointer transition-all">
              <span className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-600 group-hover:text-gold transition-colors">Descend</span>
              <div className="w-px h-16 bg-white/10 relative overflow-hidden">
                 <motion.div 
                    animate={{ y: [0, 64] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-transparent via-gold to-transparent" 
                 />
              </div>
           </a>
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

      {/* New Informational Sections */}
      <HowToPlaySection />
      
      <BattlefieldPreview />

      {/* The Three Powers Section / Lore */}
      <section id="lore" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center mb-24">
          <h2 className="text-5xl font-serif font-bold text-white mb-6 uppercase tracking-wider">CHOOSE YOUR <span className="text-gold italic">DESTINY</span></h2>
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

              <a href="#how-to-play" className="text-xs font-bold uppercase tracking-widest text-gold flex items-center gap-2 group-hover:gap-4 transition-all">
                LEARN TACTICS <ArrowRight size={14} />
              </a>
            </motion.div>
          ))}
        </div>
      </section>

      <RulesSection />

      <PieceGuideSection />

      <PlayNowSection />

      {/* Shop Section */}
      <section id="shop" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center mb-24">
          <h2 className="text-6xl font-serif font-bold text-white mb-6 uppercase tracking-widest italic">ARMORY <span className="text-gold font-normal">& EMPORIUM</span></h2>
          <p className="text-zinc-500">Equip yourself with the finest regalia. No winning advantages, just absolute style.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              name: "PEASANT", 
              price: "Free", 
              icon: ShoppingBag, 
              perks: ["Basic Matchmaking", "1 Faction Skin", "Public Forums"],
              cta: "Current Plan",
              active: true
            },
            { 
              name: "GENERAL", 
              price: "$7.99/mo", 
              icon: Crown, 
              perks: ["Ranked Matchmaking", "Replay History", "All Factions Tokens", "Custom Profile Icons"],
              cta: "Enlist Now",
              accent: "border-gold/50 bg-gold/5"
            },
            { 
              name: "EMPEROR", 
              price: "$19.99/mo", 
              icon: Sparkles, 
              perks: ["Priority Matchmaking", "Custom Boards", "Beta Access", "Private Tournaments", "Animated Piece Skins"],
              cta: "Ascend Now",
              accent: "border-white/20 bg-white/5"
            }
          ].map((tier, i) => (
            <div key={i} className={cn(
              "p-10 rounded-[40px] border flex flex-col items-center text-center",
              tier.accent || "border-white/5 bg-white/2"
            )}>
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-8">
                <tier.icon size={32} className="text-gold" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-[0.2em]">{tier.name}</h3>
              <div className="text-4xl font-serif font-bold text-white mb-10">{tier.price}</div>
              
              <ul className="space-y-4 mb-12 flex-grow text-left w-full">
                {tier.perks.map((perk, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm text-zinc-400">
                    <Check size={14} className="text-gold shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>

              <button className={cn(
                "w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                tier.active ? "bg-white/5 text-zinc-500 cursor-not-allowed" : "bg-gold text-ink hover:scale-[1.02] shadow-lg shadow-gold/10"
              )}>
                {tier.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Community Hub */}
      <section id="community" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20">
        <div className="text-center mb-24">
          <h2 className="text-6xl font-serif font-bold text-white mb-6 uppercase tracking-widest leading-tight">TACTICIAN'S <span className="marker text-gold">HUB</span></h2>
          <p className="text-zinc-500 max-w-xl mx-auto">The battle is won on the board, but legends are forged in the community. Join our Discord Command or compete for the Top 10.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Leaderboard Card */}
          <div className="md:col-span-2 glass-dark p-10 rounded-[40px] border border-white/5">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-3">
                <Trophy className="text-gold" /> TOP GENERALS
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">SEASON 12</span>
            </div>

            <div className="space-y-6">
              {[
                { rank: 1, user: "HeavenlyBlade", winRate: "78%", faction: "WEI", elo: 2450 },
                { rank: 2, user: "JadeDragon", winRate: "74%", faction: "SHU", elo: 2320 },
                { rank: 3, user: "OceanStorm", winRate: "71%", faction: "WU", elo: 2280 },
                { rank: 4, user: "IronStrategist", winRate: "69%", faction: "WEI", elo: 2210 },
                { rank: 5, user: "LunarArcher", winRate: "66%", faction: "SHU", elo: 2150 }
              ].map((player, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/2 hover:bg-white/5 transition-colors group">
                  <div className="flex items-center gap-6">
                    <span className={`text-sm font-bold ${i < 3 ? 'text-gold' : 'text-zinc-600'}`}>0{player.rank}</span>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-xs uppercase">
                      {player.user[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white group-hover:text-gold transition-colors">{player.user}</div>
                      <div className={`text-[10px] uppercase font-black tracking-widest ${player.faction === 'WEI' ? 'text-wei' : player.faction === 'SHU' ? 'text-shu' : 'text-wu'}`}>
                        {player.faction}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono font-bold text-white">{player.elo}</div>
                    <div className="text-[10px] uppercase text-zinc-500 tracking-tighter">WIN RATE: {player.winRate}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Community Links */}
          <div className="space-y-8 flex flex-col items-stretch">
            <a href="#" className="flex-grow p-10 bg-indigo-600/10 rounded-[40px] border border-indigo-500/20 group hover:border-indigo-500/50 transition-all flex flex-col">
              <MessageSquare className="text-indigo-400 mb-6" size={32} />
              <h3 className="text-xl font-bold text-white mb-2 uppercase flex items-center justify-between">
                DISCORD <ArrowUpRight size={16} />
              </h3>
              <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-4">50k+ Members</p>
              <p className="border-t border-indigo-500/10 pt-4 text-zinc-400 text-sm leading-relaxed">Join the central command center for live matchmaking, strategy chat, and historical analysis.</p>
            </a>

            <div className="p-10 bg-gold/5 rounded-[40px] border border-gold/10">
              <Star className="text-gold mb-6" size={32} />
              <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">LOYALTY PERKS</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">Earn Faction Points by playing and unlock exclusive profiles, unique icons, and early beta access.</p>
              <button className="text-xs font-bold text-gold uppercase tracking-widest border-b border-gold pb-1 hover:pb-2 transition-all">
                BROWSE PERKS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-40 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gold/5 opacity-40 blur-3xl rounded-full" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8">ARE YOU READY TO <br className="hidden md:block" /> UNITE THE LAND?</h2>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link to="/setup?mode=classic" className="bg-gold text-ink font-bold px-12 py-5 rounded-full uppercase tracking-widest hover:scale-105 transition-transform">
              Play vs AI
            </Link>
            <Link to="/rooms/create?mode=classic" className="bg-white/10 text-white font-bold px-12 py-5 rounded-full uppercase tracking-widest hover:bg-white/20 transition-colors">
               Create War Room
            </Link>
            <Link to="/archive" className="bg-white/5 border border-white/10 text-white font-bold px-12 py-5 rounded-full uppercase tracking-widest hover:bg-white/10 transition-colors">
              Battle Archive
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
