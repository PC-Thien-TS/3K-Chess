import { Link } from 'react-router-dom';
import { Archive, BookOpen, Sword, Users } from 'lucide-react';
import { useI18n } from '@/src/i18n/useI18n';

export default function Footer() {
  const { t } = useI18n();
  const currentBuildItems = t<string[]>('footer.currentBuildItems');

  return (
    <footer className="border-t border-white/5 bg-ink pt-20 pb-10">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 text-zinc-400 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
        <div>
          <Link to="/" className="mb-6 flex items-center gap-2">
            <Sword className="text-gold" size={24} />
            <span className="font-serif text-xl font-bold tracking-wider text-gold">3K CHESS</span>
          </Link>
          <p className="mb-4 text-sm leading-relaxed">
            {t('footer.description')}
          </p>
          <p className="text-sm leading-relaxed text-zinc-500">
            {t('footer.safety')}
          </p>
        </div>

        <div>
          <h4 className="mb-6 font-serif font-bold tracking-wider text-white">{t('footer.playTitle')}</h4>
          <ul className="space-y-4 text-xs uppercase tracking-widest">
            <li><Link to="/rooms/create?mode=classic" className="hover:text-white">{t('common.playClassicOnline')}</Link></li>
            <li><Link to="/setup?mode=classic" className="hover:text-white">{t('common.practiceClassic')}</Link></li>
            <li><Link to="/setup?mode=authentic" className="hover:text-white">{t('common.modern3kLocal')}</Link></li>
            <li><Link to="/archive" className="hover:text-white">{t('common.openArchive')}</Link></li>
            <li><Link to="/how-to-play" className="hover:text-white">{t('common.howToPlay')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-6 font-serif font-bold tracking-wider text-white">{t('footer.currentBuildTitle')}</h4>
          <div className="space-y-4">
            {[
              { icon: Users, label: currentBuildItems[0] },
              { icon: Archive, label: currentBuildItems[1] },
              { icon: BookOpen, label: currentBuildItems[2] },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.4rem] border border-white/6 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center gap-3">
                  <item.icon size={16} className="text-gold" />
                  <p className="text-sm leading-relaxed text-zinc-300">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto mt-20 flex max-w-7xl flex-col items-center justify-between gap-3 border-t border-white/5 px-6 pt-8 text-center text-[10px] uppercase tracking-[0.2em] opacity-50 md:flex-row">
        <p>{t('footer.copyright')}</p>
        <p>{t('footer.disclaimer')}</p>
      </div>
    </footer>
  );
}
