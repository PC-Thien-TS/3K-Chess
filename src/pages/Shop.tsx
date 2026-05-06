import { motion } from 'motion/react';
import { ShoppingBag, Star, Crown, ShieldAlert, Sparkles, Check } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export default function Shop() {
  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="text-center mb-24">
        <h1 className="text-6xl font-serif font-bold text-white mb-6 uppercase tracking-widest italic">ARMORY <span className="text-gold font-normal">& EMPORIUM</span></h1>
        <p className="text-zinc-500">Equip yourself with the finest regalia. No winning advantages, just absolute style.</p>
      </div>

      {/* Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
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

      {/* Featured Items */}
      <section>
        <div className="flex items-center justify-between mb-12">
          <h2 className="text-3xl font-serif font-bold text-white tracking-widest uppercase">TEMPORAL SKINS</h2>
          <div className="flex items-center gap-2 text-gold">
            <span className="text-[10px] font-bold uppercase tracking-widest">Ending In: 02d 14h 22m</span>
            <ShieldAlert size={16} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {[
             { name: "Blood Moon Wei", price: "800 Jade", type: "Board Skin" },
             { name: "Green Ghost Shu", price: "1200 Jade", type: "Piece Effect" },
             { name: "Storm Lord Wu", price: "Premium", type: "Full Set" },
             { name: "Ink Wash Master", price: "Archive", type: "Legacy Set" }
           ].map((item, i) => (
             <div key={i} className="group cursor-pointer">
                <div className="aspect-square bg-zinc-900 border border-white/5 rounded-3xl mb-4 overflow-hidden relative">
                   <div className="absolute inset-0 bg-gradient-to-tr from-gold/5 via-transparent to-transparent" />
                   <div className="absolute bottom-4 left-4 right-4 py-2 px-3 bg-black/60 backdrop-blur-md rounded-lg text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold text-gold uppercase tracking-widest">Preview Item</span>
                   </div>
                </div>
                <h4 className="text-sm font-bold text-white mb-1 uppercase tracking-wider">{item.name}</h4>
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                  <span>{item.type}</span>
                  <span className="text-gold">{item.price}</span>
                </div>
             </div>
           ))}
        </div>
      </section>
    </div>
  );
}
