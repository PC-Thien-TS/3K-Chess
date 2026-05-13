import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Archive, Book, Play, Shield, Sword, Users } from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { useI18n } from '@/src/i18n/useI18n';
import LanguageSelector from './LanguageSelector';

const navItems = [
  { key: 'common.play', path: '/#play-now', icon: Play },
  { key: 'common.classicRooms', path: '/rooms', icon: Users },
  { key: 'common.modern3kLocal', path: '/setup?mode=authentic', icon: Shield },
  { key: 'common.archive', path: '/archive', icon: Archive },
  { key: 'common.howToPlay', path: '/how-to-play', icon: Book },
];

export default function Navbar() {
  const { t } = useI18n();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center p-6 pointer-events-none">
      <motion.div 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-dark flex items-center gap-4 rounded-full px-5 py-3 shadow-2xl pointer-events-auto sm:gap-8 sm:px-8"
      >
        <Link to="/" className="flex items-center gap-2 group">
          <Sword className="text-gold transition-transform group-hover:rotate-12" size={24} />
          <span className="font-serif font-bold text-lg tracking-wider text-gold sm:text-xl">3K CHESS</span>
        </Link>

        <div className="flex items-center gap-4 sm:gap-6">
          {navItems.map((item) => {
            const Icon = item.icon;
            const label = t(item.key);
            
            return (
              <Link 
                key={item.path}
                to={item.path}
                aria-label={label}
                title={label}
                className={cn(
                  "relative text-[10px] font-bold tracking-widest uppercase transition-colors hover:text-zinc-50 flex items-center gap-2 text-zinc-400"
                )}
              >
                <Icon size={14} />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </div>

        <LanguageSelector className="flex" />

        <Link 
          to="/rooms/create?mode=classic" 
          className="hidden rounded-full bg-gold px-5 py-2 text-[10px] font-bold uppercase tracking-widest text-ink transition-transform hover:scale-105 sm:block"
        >
          {t('navbar.cta')}
        </Link>
      </motion.div>
    </nav>
  );
}
