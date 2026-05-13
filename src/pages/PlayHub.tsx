import { useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Archive, Bot, History, Network, Play, Plus, Users } from 'lucide-react';
import { useI18n } from '@/src/i18n/useI18n';
import MatchSetup from './MatchSetup';
import CreateRoom from './CreateRoom';
import JoinRoom from './JoinRoom';
import WarCouncil from './WarCouncil';

function getInitialSection(pathname: string, searchParams: URLSearchParams) {
  const section = searchParams.get('section');
  const mode = searchParams.get('mode');

  if (section) return section;
  if (pathname === '/rooms/create') return 'create';
  if (pathname === '/rooms/join') return 'join';
  if (pathname === '/rooms') return 'online';
  if (pathname === '/setup' && mode === 'authentic') return 'modern3k';
  if (pathname === '/setup') return 'classic-local';
  return '';
}

export default function PlayHub() {
  const { t } = useI18n();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const initialSection = getInitialSection(location.pathname, searchParams);
  const activeSection = initialSection || 'classic-local';

  useEffect(() => {
    if (!initialSection) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const sectionMap: Record<string, string> = {
      'classic-local': 'classic-local-section',
      online: 'classic-online-section',
      create: 'create-room-section',
      join: 'join-room-section',
      modern3k: 'local-match-section',
      history: 'local-room-history-section',
    };

    const scrollTimer = window.setTimeout(() => {
      document.getElementById(sectionMap[initialSection] ?? initialSection)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);

    return () => window.clearTimeout(scrollTimer);
  }, [initialSection]);

  const entryCards = [
    {
      title: t('playHub.classicLocal.title'),
      description: t('playHub.classicLocal.description'),
      to: '/play?section=classic-local',
      section: 'classic-local',
      icon: Play,
    },
    {
      title: t('playHub.createRoom.title'),
      description: t('playHub.createRoom.description'),
      to: '/play?section=create',
      section: 'create',
      icon: Plus,
    },
    {
      title: t('playHub.joinRoom.title'),
      description: t('playHub.joinRoom.description'),
      to: '/play?section=join',
      section: 'join',
      icon: Users,
    },
    {
      title: t('playHub.modern3k.title'),
      description: t('playHub.modern3k.description'),
      to: '/play?section=modern3k&mode=authentic',
      section: 'modern3k',
      icon: Bot,
    },
    {
      title: t('playHub.localHistory.title'),
      description: t('playHub.localHistory.description'),
      to: '/play?section=history',
      section: 'history',
      icon: History,
    },
  ];

  return (
    <div data-testid="play-hub-page" className="pt-20 sm:pt-24">
      <section className="container mx-auto px-4 pb-6 pt-4 text-center sm:px-6 sm:pb-10 sm:pt-8">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-[9px] font-black uppercase tracking-[0.36em] text-gold sm:mb-4 sm:text-[10px] sm:tracking-[0.45em]">
            {t('playHub.kicker')}
          </p>
          <h1 className="text-3xl font-serif font-black uppercase tracking-[0.1em] text-white sm:text-5xl md:text-7xl">
            {t('playHub.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm font-serif italic leading-relaxed text-zinc-400 sm:mt-6 sm:text-lg">
            {t('playHub.subtitle')}
          </p>
        </div>

        <nav
          data-testid="play-hub-quick-nav"
          aria-label={t('playHub.kicker')}
          className="-mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:hidden"
        >
          {entryCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeSection === card.section || (activeSection === 'online' && card.section === 'create');
            return (
              <Link
                key={`quick-${card.to}`}
                to={card.to}
                className={`flex min-w-max items-center gap-2 rounded-full border px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] transition-all ${
                  isActive
                    ? 'border-gold bg-gold text-black shadow-[0_10px_30px_rgba(212,175,55,0.18)]'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300 hover:border-gold/30 hover:text-white'
                }`}
              >
                <Icon size={14} />
                {card.title}
              </Link>
            );
          })}
        </nav>

        <div className="mx-auto mt-10 hidden max-w-7xl grid-cols-1 gap-4 lg:grid lg:grid-cols-5">
          {entryCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.to}
                to={card.to}
                className="glass-dark group rounded-[2rem] border border-white/6 p-5 text-left transition-all hover:-translate-y-1 hover:border-gold/25"
              >
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/15 bg-gold/10 text-gold">
                  <Icon size={20} />
                </div>
                <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">{card.title}</h2>
                <p className="mt-3 text-xs leading-relaxed text-zinc-500">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section
        id="local-match-section"
        data-testid="classic-local-panel"
        className="scroll-mt-20 border-t border-white/5 sm:scroll-mt-24"
      >
        <div data-testid="modern3k-panel">
          <MatchSetup />
        </div>
      </section>

      <section
        id="classic-online-section"
        data-testid="classic-online-panel"
        className="container mx-auto scroll-mt-20 px-4 py-8 sm:scroll-mt-24 sm:px-6 sm:py-12 lg:py-16"
      >
        <div className="mb-4 flex items-start gap-3 rounded-2xl border border-gold/10 bg-gold/5 p-4 sm:mb-8 sm:gap-4 sm:p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold sm:h-11 sm:w-11">
            <Network size={20} />
          </div>
          <div>
            <h2 className="text-lg font-serif font-black uppercase tracking-[0.14em] text-white sm:text-xl sm:tracking-[0.16em]">
              {t('playHub.classicOnline.title')}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
              {t('playHub.classicOnline.description')}
            </p>
          </div>
        </div>
      </section>

      <section id="create-room-section" data-testid="create-room-panel" className="scroll-mt-20 border-t border-white/5 sm:scroll-mt-24">
        <CreateRoom />
      </section>

      <section id="join-room-section" data-testid="join-room-panel" className="scroll-mt-20 border-t border-white/5 sm:scroll-mt-24">
        <JoinRoom />
      </section>

      <section
        id="local-room-history-section"
        data-testid="local-room-history-panel"
        className="scroll-mt-20 border-t border-white/5 sm:scroll-mt-24"
      >
        <div className="container mx-auto px-4 pt-8 sm:px-6 sm:pt-16">
          <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:gap-4 sm:p-5">
            <Archive size={22} className="mt-1 text-gold" />
            <div>
              <h2 className="text-lg font-serif font-black uppercase tracking-[0.14em] text-white sm:text-xl sm:tracking-[0.16em]">
                {t('playHub.localHistory.title')}
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-400">
                {t('playHub.savedRoomsLocalOnly')}
              </p>
            </div>
          </div>
        </div>
        <WarCouncil />
      </section>
    </div>
  );
}
