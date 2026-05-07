import { motion } from 'motion/react';
import { cn } from '@/src/lib/utils';

export default function BattlefieldPreview() {
  return (
    <section id="battlefield-preview" className="py-32 px-6 max-w-7xl mx-auto scroll-mt-20 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <div>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 tracking-[0.05em] leading-tight">
            BATTLEFIELD <span className="text-gold font-normal italic block md:inline">PREVIEW</span>
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed mb-10">
            A three-sided battlefield where every move can create a new alliance or betrayal. 
            The hexagonal design uniquely bridges the kingdoms of Wei, Shu, and Wu in a circular flow of destiny.
          </p>
          
          <div className="space-y-8">
            <div className="flex gap-6 p-6 rounded-3xl bg-wei/5 border border-wei/20">
               <div className="w-1 h-auto bg-wei rounded-full" />
               <div>
                  <h4 className="text-white font-bold uppercase tracking-widest mb-1">Wei Territory</h4>
                  <p className="text-zinc-500 text-xs">The Northern Hegemony sits atop the mountain terrain, ready to conquer.</p>
               </div>
            </div>
            <div className="flex gap-6 p-6 rounded-3xl bg-shu/5 border border-shu/20">
               <div className="w-1 h-auto bg-shu rounded-full" />
               <div>
                  <h4 className="text-white font-bold uppercase tracking-widest mb-1">Shu Territory</h4>
                  <p className="text-zinc-500 text-xs">The Brave Loyalists defend their river valleys in the Southwest.</p>
               </div>
            </div>
            <div className="flex gap-6 p-6 rounded-3xl bg-wu/5 border border-wu/20">
               <div className="w-1 h-auto bg-wu rounded-full" />
               <div>
                  <h4 className="text-white font-bold uppercase tracking-widest mb-1">Wu Territory</h4>
                  <p className="text-zinc-500 text-xs">The Southern Lords command the coastlines and the Eastern ports.</p>
               </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center py-20 lg:py-0">
          {/* Animated Glow Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[500px] border border-white/5 rounded-full animate-[spin_60s_linear_infinite]" />
            <div className="w-[400px] h-[400px] border border-white/5 rounded-full animate-[spin_40s_linear_infinite_reverse]" />
          </div>

          <div className="relative w-full aspect-square max-w-[500px] bg-ink border border-white/10 rounded-[60px] p-8 shadow-2xl flex items-center justify-center overflow-hidden">
             {/* Simple Hex/Triangle Pattern Mockup */}
             <svg viewBox="0 0 400 400" className="w-full h-full drop-shadow-2xl">
                {/* Wei (Top) */}
                <path d="M200 40 L360 130 L40 130 Z" fill="rgba(153, 27, 27, 0.1)" stroke="#991b1b" strokeWidth="1" strokeDasharray="4 2" />
                {/* Wu (Right) */}
                <path d="M370 145 L370 330 L205 235 Z" fill="rgba(30, 58, 138, 0.1)" stroke="#1e3a8a" strokeWidth="1" strokeDasharray="4 2" />
                {/* Shu (Left) */}
                <path d="M30 145 L30 330 L195 235 Z" fill="rgba(6, 95, 70, 0.1)" stroke="#065f46" strokeWidth="1" strokeDasharray="4 2" />
                
                {/* Center Mask */}
                <circle cx="200" cy="200" r="100" fill="transparent" stroke="rgba(212, 175, 55, 0.1)" strokeWidth="2" strokeDasharray="8 4" />
                
                {/* Army Indicators (Dots) */}
                <motion.circle animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} cx="200" cy="80" r="6" fill="#991b1b" className="shadow-lg" />
                <motion.circle animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} cx="320" cy="260" r="6" fill="#1e3a8a" />
                <motion.circle animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2, delay: 1 }} cx="80" cy="260" r="6" fill="#065f46" />
                
                {/* Grid Dots */}
                {[...Array(8)].map((_, x) => [...Array(8)].map((_, y) => (
                  <circle key={`${x}-${y}`} cx={50 + x * 40} cy={50 + y * 40} r="1" fill="rgba(255,255,255,0.05)" />
                )))}
             </svg>
             
             {/* Center Label */}
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-ink border border-gold/40 px-6 py-3 rounded-full text-[10px] font-bold text-gold uppercase tracking-[0.4em] shadow-[0_0_20px_rgba(212,175,55,0.2)] glass-dark">
                  Central Battlefield
                </div>
             </div>
          </div>
        </div>
      </div>
    </section>
  );
}
