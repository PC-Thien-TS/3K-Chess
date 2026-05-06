import { motion } from 'motion/react';
import { Trophy, Users, MessageSquare, Star, ArrowUpRight } from 'lucide-react';

export default function Community() {
  return (
    <div className="pt-32 pb-20 max-w-7xl mx-auto px-6">
      <div className="text-center mb-24">
        <h1 className="text-6xl font-serif font-bold text-white mb-6 uppercase tracking-widest">TACTICIAN'S <span className="text-gold">HUB</span></h1>
        <p className="text-zinc-500">The battle is won on the board, but legends are forged in the community.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
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
        <div className="space-y-8">
          <a href="#" className="block p-10 bg-indigo-600/10 rounded-[30px] border border-indigo-500/20 group hover:border-indigo-500/50 transition-all">
            <MessageSquare className="text-indigo-400 mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-2 uppercase flex items-center justify-between">
              DISCORD <ArrowUpRight size={16} />
            </h3>
            <p className="text-xs text-indigo-400 font-bold uppercase tracking-widest mb-4">50k+ Members</p>
            <p className="text-zinc-400 text-sm leading-relaxed">Join the central command center for live lfg, strategy chat, and memes.</p>
          </a>

          <div className="p-10 bg-gold/5 rounded-[30px] border border-gold/10">
            <Star className="text-gold mb-6" size={32} />
            <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-widest">LOYALTY PROGRAM</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">Earn Faction Points by playing and unlock exclusive profiles and icons.</p>
            <button className="text-xs font-bold text-gold uppercase tracking-widest border-b border-gold pb-1 hover:pb-2 transition-all">
              GO TO PERKS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
