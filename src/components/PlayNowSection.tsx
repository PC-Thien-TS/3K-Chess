import { motion } from 'motion/react';
import { Archive, ArrowRight, Bot, Play, Sword, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/src/i18n/useI18n';

export default function PlayNowSection() {
  const { t } = useI18n();
  const modes = [
    {
      ...t<Array<{ title: string; description: string; button: string }>>('playNow.modes')[0],
      path: '/play?section=create',
      icon: Users,
    },
    {
      ...t<Array<{ title: string; description: string; button: string }>>('playNow.modes')[1],
      path: '/play?section=classic-local',
      icon: Sword,
    },
    {
      ...t<Array<{ title: string; description: string; button: string }>>('playNow.modes')[2],
      path: '/play?section=modern3k&mode=authentic',
      icon: Play,
    },
    {
      ...t<Array<{ title: string; description: string; button: string }>>('playNow.modes')[3],
      path: '/archive',
      icon: Archive,
    },
  ];
  const badges = t<string[]>('playNow.badges');

  return (
    <section id="play-now" className="max-w-7xl mx-auto scroll-mt-20 px-6 py-32">
      <div className="mb-20 text-center">
        <h2 className="mb-4 text-4xl font-serif font-bold uppercase tracking-widest text-white md:text-5xl">
          {t('playNow.title')}
        </h2>
        <p className="text-sm font-medium uppercase tracking-[0.2em] italic text-zinc-500">
          {t('playNow.subtitle')}
        </p>
      </div>

      <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {modes.map((mode) => {
          const Icon = mode.icon;
          return (
            <motion.div
              key={mode.title}
              whileHover={{ y: -5 }}
              className="glass-dark flex h-full flex-col rounded-[2.5rem] border border-white/5 p-8"
            >
              <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <Icon size={24} className="text-gold" />
              </div>
              <h3 className="mb-4 text-xl font-bold uppercase tracking-wider text-white">{mode.title}</h3>
              <p className="mb-10 flex-grow text-sm leading-relaxed text-zinc-400">{mode.description}</p>

              <Link
                to={mode.path}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gold py-4 text-center text-xs font-bold uppercase tracking-[0.2em] text-ink transition-all hover:scale-[1.02] shadow-lg shadow-gold/5"
              >
                {mode.button}
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          );
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-4">
        {[
          { label: badges[0], icon: Users },
          { label: badges[1], icon: Play },
          { label: badges[2], icon: Bot },
          { label: badges[3], icon: Archive },
        ].map((badge) => (
          <div
            key={badge.label}
            className="flex items-center gap-2 rounded-full border border-white/5 bg-white/5 px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-zinc-400"
          >
            <badge.icon size={12} className="text-gold" />
            {badge.label}
          </div>
        ))}
      </div>
    </section>
  );
}
