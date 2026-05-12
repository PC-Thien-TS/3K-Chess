import { Link } from 'react-router-dom';
import { Sword, Twitter, Github, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink border-t border-white/5 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12 text-zinc-400">
        <div className="md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-6">
            <Sword className="text-gold" size={24} />
            <span className="font-serif font-bold text-xl tracking-wider text-gold">3K CHESS</span>
          </Link>
          <p className="text-sm leading-relaxed mb-6">
            Classic focuses on online rooms, bots, and archives. Modern 3K focuses on local authentic rules, Han court politics, and alliance play.
          </p>
          <div className="flex gap-4">
            <Twitter size={20} className="hover:text-gold cursor-pointer" />
            <Github size={20} className="hover:text-gold cursor-pointer" />
            <MessageCircle size={20} className="hover:text-gold cursor-pointer" />
          </div>
        </div>

        <div>
          <h4 className="text-white font-serif font-bold mb-6 tracking-wider">GAME</h4>
          <ul className="space-y-4 text-sm uppercase tracking-widest text-xs">
            <li><Link to="/rooms" className="hover:text-white">Classic Rooms</Link></li>
            <li><Link to="/setup?mode=classic" className="hover:text-white">Practice Classic</Link></li>
            <li><Link to="/setup?mode=authentic" className="hover:text-white">Modern 3K Local</Link></li>
            <li><Link to="/how-to-play" className="hover:text-white">How to Play</Link></li>
            <li><a href="/#community" className="hover:text-white">Leaderboard</a></li>
            <li><Link to="/archive" className="hover:text-white">Battle Archive</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-serif font-bold mb-6 tracking-wider">SUPPORT</h4>
          <ul className="space-y-4 text-sm uppercase tracking-widest text-xs">
            <li><a href="#" className="hover:text-white">FAQ</a></li>
            <li><a href="#" className="hover:text-white">Terms of Honor</a></li>
            <li><a href="#" className="hover:text-white">Privacy Seal</a></li>
            <li><a href="#" className="hover:text-white">Contact Us</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-serif font-bold mb-6 tracking-wider">STRATEGY DIGEST</h4>
          <p className="text-sm mb-4">Join 50,000+ tacticians for weekly strategy breakdowns.</p>
          <div className="flex gap-2">
            <input 
              type="email" 
              placeholder="Your email" 
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm w-full focus:outline-none focus:border-gold"
            />
            <button className="bg-gold text-ink font-bold px-4 py-2 rounded-lg text-sm transition-transform hover:scale-105">
              JOIN
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center text-[10px] uppercase tracking-[0.2em] opacity-40">
        <p>© 2026 THREE KINGDOMS CHESS. ALL RIGHTS RESERVED.</p>
        <p>NOT FOR USE BY PEASANTS OR COWARDS.</p>
      </div>
    </footer>
  );
}
