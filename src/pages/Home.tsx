import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Archive,
  ArrowRight,
  Bot,
  CheckCircle2,
  Network,
  Play,
  Server,
  ShieldAlert,
  Sword,
  TestTube2,
  Wallet,
} from 'lucide-react';
import HowToPlaySection from '@/src/components/HowToPlaySection';
import RulesSection from '@/src/components/RulesSection';
import PieceGuideSection from '@/src/components/PieceGuideSection';
import PlayNowSection from '@/src/components/PlayNowSection';
import BattlefieldPreview from '@/src/components/BattlefieldPreview';
import { useI18n } from '@/src/i18n/useI18n';

const technicalProof = [
  {
    title: 'Frontend',
    detail: 'React + Vite powers the live game UI, setup flow, replay viewer, archive, and How to Play guide.',
    icon: Play,
  },
  {
    title: 'Classic Online',
    detail: 'Socket.io WebSocket rooms support Classic online play with invite links, lobby sync, and host-driven start.',
    icon: Network,
  },
  {
    title: 'Move Authority',
    detail: 'Classic online move submission is server-authoritative and validated before broadcast.',
    icon: Server,
  },
  {
    title: 'Recovery',
    detail: 'Classic online supports reconnect and snapshot recovery for room and live match state.',
    icon: ShieldAlert,
  },
  {
    title: 'Replay',
    detail: 'Classic and Modern 3K matches can be saved locally and reviewed through the replay/archive flow.',
    icon: Archive,
  },
  {
    title: 'Verification',
    detail: 'The project ships with unit tests, Playwright E2E coverage, and GitHub Actions CI.',
    icon: TestTube2,
  },
];

function StatusColumn({
  title,
  items,
  accent,
}: {
  title: string;
  items: string[];
  accent: string;
}) {
  return (
    <div className="glass-dark rounded-[2rem] border border-white/6 p-6 shadow-2xl sm:p-8">
      <div className="flex items-center gap-3">
        <div className={`h-2.5 w-2.5 rounded-full ${accent}`} />
        <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-zinc-400">{title}</h3>
      </div>
      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div key={item} className="rounded-[1.4rem] border border-white/6 bg-white/[0.03] px-4 py-4">
            <p className="text-sm leading-relaxed text-zinc-300">{item}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const { t } = useI18n();
  const factualBadges = t<string[]>('home.factualBadges');
  const playableNow = t<string[]>('home.playableNow');
  const inDevelopment = t<string[]>('home.inDevelopment');
  const notAvailableYet = t<string[]>('home.notAvailableYet');
  const safetyNotes = t<string[]>('home.safetyNotes');
  const trustBadges = t<string[]>('home.trustBadges');
  const technicalProofCopy = t<Array<{ title: string; detail: string }>>('home.technicalProof');

  return (
    <div className="pt-20">
      <section
        id="hero"
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-16 text-center scroll-mt-20 sm:px-6 sm:py-20"
      >
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black via-black to-zinc-900" />
        <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20" />

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.03, scale: 1.08 }}
          transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse' }}
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <Sword size={1200} strokeWidth={0.2} className="text-gold" />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-6xl space-y-10 sm:space-y-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="space-y-6"
          >
            <div className="mb-4 flex items-center justify-center gap-3 sm:gap-4">
              <div className="h-px w-8 bg-gold/30 sm:w-12" />
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-gold">
                {t('home.heroKicker')}
              </span>
              <div className="h-px w-8 bg-gold/30 sm:w-12" />
            </div>

            <h1 className="mb-6 text-5xl font-serif font-black uppercase italic leading-[0.85] tracking-tight text-white drop-shadow-2xl sm:text-6xl md:mb-8 md:text-[9rem] md:tracking-tighter">
              {t('home.heroTitleMain')} <span className="block -mt-4 text-gold not-italic font-black tracking-widest md:-mt-10">{t('home.heroTitleAccent')}</span>
            </h1>

            <div className="mx-auto mb-10 h-2 w-24 rounded-full bg-gold/40" />

            <p className="mx-auto max-w-4xl text-lg font-serif italic font-light leading-relaxed text-zinc-300 opacity-90 sm:text-xl md:text-3xl">
              {t('home.heroDescription')}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 1, ease: 'easeOut' }}
            className="flex flex-col items-stretch justify-center gap-4 pt-6 sm:gap-5 md:flex-row md:items-center md:pt-8"
          >
            <Link to="/rooms/create?mode=classic" className="group relative w-full overflow-hidden rounded-2xl bg-gold px-8 py-5 text-base font-black uppercase tracking-[0.2em] text-black shadow-[0_20px_60px_rgba(212,175,55,0.4)] transition-all hover:scale-105 hover:bg-white active:scale-95 sm:px-10 sm:py-6 sm:text-lg sm:tracking-[0.24em] md:w-auto">
              <span className="relative z-10 flex items-center gap-3">
                {t('common.playClassicOnline')} <ArrowRight size={22} className="transition-transform group-hover:translate-x-2" />
              </span>
              <div className="absolute inset-0 bg-white opacity-0 transition-opacity group-hover:opacity-10" />
            </Link>

            <Link to="/setup?mode=classic" className="group relative w-full overflow-hidden rounded-2xl border border-white/10 px-8 py-5 text-base font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 hover:bg-white/10 active:scale-95 glass-dark sm:px-10 sm:py-6 sm:text-lg sm:tracking-[0.24em] md:w-auto">
              <span className="relative z-10 flex items-center gap-3">
                {t('common.practiceClassic')} <Play size={20} className="text-gold transition-transform group-hover:scale-125" fill="currentColor" />
              </span>
            </Link>

            <Link to="/setup?mode=authentic" className="group relative w-full overflow-hidden rounded-2xl border border-gold/20 px-8 py-5 text-base font-black uppercase tracking-[0.2em] text-white transition-all hover:scale-105 hover:bg-gold/10 active:scale-95 glass-dark sm:px-10 sm:py-6 sm:text-lg sm:tracking-[0.24em] md:w-auto">
              <span className="relative z-10 flex items-center gap-3">
                {t('common.playModern3kLocal')} <ArrowRight size={20} className="text-gold transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.95, duration: 0.8 }}
            className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row"
          >
            <Link
              to="/archive"
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              {t('common.openArchive')}
              <Archive size={14} className="text-gold" />
            </Link>
            <Link
              to="/how-to-play"
              className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-[10px] font-black uppercase tracking-[0.28em] text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98]"
            >
              {t('common.howToPlay')}
              <ArrowRight size={14} className="text-gold" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="flex flex-wrap justify-center gap-3 pt-8"
          >
            {factualBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300"
              >
                {badge}
              </span>
            ))}
          </motion.div>
        </div>

        <div className="absolute bottom-12 left-0 right-0 flex justify-center py-4">
          <a href="/#play-now" className="group flex cursor-pointer flex-col items-center gap-4 transition-all">
            <span className="text-[9px] font-black uppercase tracking-[0.6em] text-zinc-600 transition-colors group-hover:text-gold">{t('home.scrollLabel')}</span>
            <div className="relative h-16 w-px overflow-hidden bg-white/10">
              <motion.div
                animate={{ y: [0, 64] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="absolute left-0 top-0 h-1/2 w-full bg-gradient-to-b from-transparent via-gold to-transparent"
              />
            </div>
          </a>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/5 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-3">
          {trustBadges.map((item) => (
            <div key={item} className="rounded-full border border-gold/10 bg-gold/5 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-gold">
              {item}
            </div>
          ))}
        </div>
      </section>

      <HowToPlaySection />

      <BattlefieldPreview />

      <section
        id="playable-now"
        data-testid="playable-now-section"
        className="mx-auto max-w-7xl px-6 py-24 scroll-mt-20"
      >
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-serif font-black uppercase tracking-[0.12em] text-white md:text-5xl">
            {t('home.playableNowTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base font-serif italic leading-relaxed text-zinc-400">
            {t('home.playableNowDescription')}
          </p>
        </div>

        <div
          data-testid="project-status-section"
          className="grid grid-cols-1 gap-6 xl:grid-cols-3"
        >
          <StatusColumn title={t('home.statusTitles.available')} items={playableNow} accent="bg-emerald-400" />
          <StatusColumn title={t('home.statusTitles.inDevelopment')} items={inDevelopment} accent="bg-gold" />
          <StatusColumn title={t('home.statusTitles.unavailable')} items={notAvailableYet} accent="bg-rose-400" />
        </div>

        <div className="mt-8 rounded-[2rem] border border-gold/10 bg-gold/[0.04] px-6 py-6 shadow-2xl sm:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-gold">{t('home.currentBuildKicker')}</p>
              <h3 className="mt-2 text-2xl font-serif font-black uppercase text-white">{t('home.currentBuildTitle')}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-300">
                {t('home.currentBuildDescription')}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {safetyNotes.map((note) => (
                <span key={note} className="rounded-full border border-white/8 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                  {note}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <RulesSection />

      <PieceGuideSection />

      <PlayNowSection />

      <section
        data-testid="technical-proof-section"
        className="mx-auto max-w-7xl px-6 py-24"
      >
        <div className="mb-12 text-center">
          <h2 className="text-4xl font-serif font-black uppercase tracking-[0.12em] text-white md:text-5xl">
            {t('home.technicalProofTitle')}
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-base font-serif italic leading-relaxed text-zinc-400">
            {t('home.technicalProofDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {technicalProof.map((item, index) => (
            <motion.div
              key={technicalProofCopy[index]?.title || item.title}
              whileHover={{ y: -4 }}
              className="glass-dark rounded-[2rem] border border-white/6 p-6 shadow-2xl sm:p-8"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/10 bg-gold/10">
                <item.icon className="text-gold" size={24} />
              </div>
              <h3 className="text-2xl font-serif font-black text-white">{technicalProofCopy[index]?.title || item.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">{technicalProofCopy[index]?.detail || item.detail}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden px-6 py-32 text-center">
        <div className="absolute inset-0 rounded-full bg-gold/5 opacity-40 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-4xl">
          <h2 className="mb-8 text-4xl font-serif font-black text-white md:text-6xl">
            {t('home.finalTitle')}
          </h2>
          <div className="flex flex-col justify-center gap-4 md:flex-row">
            <Link to="/rooms/create?mode=classic" className="w-full rounded-full bg-gold px-8 py-4 font-bold uppercase tracking-widest text-ink transition-transform hover:scale-105 md:w-auto md:px-12 md:py-5">
              {t('common.playClassicOnline')}
            </Link>
            <Link to="/setup?mode=classic" className="w-full rounded-full bg-white/10 px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/20 md:w-auto md:px-12 md:py-5">
              {t('common.practiceClassic')}
            </Link>
            <Link to="/setup?mode=authentic" className="w-full rounded-full border border-gold/20 bg-white/5 px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors hover:bg-gold/10 md:w-auto md:px-12 md:py-5">
              {t('common.playModern3kLocal')}
            </Link>
            <Link to="/archive" className="w-full rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10 md:w-auto md:px-12 md:py-5">
              {t('common.openArchive')}
            </Link>
            <Link to="/how-to-play" className="w-full rounded-full border border-white/10 bg-white/5 px-8 py-4 font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/10 md:w-auto md:px-12 md:py-5">
              {t('common.howToPlay')}
            </Link>
          </div>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.04] px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-zinc-300">
            <Wallet size={14} className="text-gold" />
            {t('home.finalBadge')}
          </div>
        </div>
      </section>
    </div>
  );
}
