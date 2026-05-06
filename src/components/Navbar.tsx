import { Link, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { Sword, Book, Trophy, ShoppingBag, Shield } from 'lucide-react';
import { cn } from '@/src/lib/utils';

const navItems = [
  { name: 'How to Play', path: '/how-to-play', icon: Book },
  { name: 'Community', path: '/community', icon: Trophy },
  { name: 'Lore', path: '/lore', icon: Shield },
  { name: 'Shop', path: '/shop', icon: ShoppingBag },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-dark px-8 py-3 rounded-full flex items-center gap-8 shadow-2xl"
      >
        <Link to="/" className="flex items-center gap-2 group">
          <Sword className="text-gold transition-transform group-hover:rotate-12" size={24} />
          <span className="font-serif font-bold text-xl tracking-wider text-gold">3K CHESS</span>
        </Link>

        <div className="flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <Link 
                key={item.path}
                to={item.path}
                className={cn(
                  "relative text-sm font-medium tracking-widest uppercase transition-colors hover:text-zinc-50 flex items-center gap-2",
                  isActive ? "text-white" : "text-zinc-400"
                )}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{item.name}</span>
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold"
                  />
                )}
              </Link>
            );
          })}
        </div>

        <button className="bg-gold text-ink text-xs font-bold px-5 py-2 rounded-full uppercase tracking-widest hover:scale-105 transition-transform">
          Play Free
        </button>
      </motion.div>
    </nav>
  );
}
