import { motion } from 'motion/react';
import { Archive, Bot, LayoutGrid, ShieldAlert, Users } from 'lucide-react';
import { useI18n } from '@/src/i18n/useI18n';

export default function BattlefieldPreview() {
  const { t } = useI18n();
  const modeCards = [
    {
      ...t<Array<{ title: string; body: string; bullets: string[] }>>('battlefieldPreview.cards')[0],
      accent: 'border-gold/20 bg-white/[0.03]',
      icon: LayoutGrid,
    },
    {
      ...t<Array<{ title: string; body: string; bullets: string[] }>>('battlefieldPreview.cards')[1],
      accent: 'border-[#8c6331]/20 bg-[linear-gradient(180deg,#f4ead3_0%,#ead7b0_100%)]',
      icon: ShieldAlert,
    },
  ];
  const proofItems = t<Array<{ title: string; detail: string }>>('battlefieldPreview.proofItems');

  return (
    <section id="battlefield-preview" className="max-w-7xl mx-auto scroll-mt-20 overflow-hidden px-6 py-32">
      <div className="mb-16 text-center">
        <h2 className="mb-6 text-4xl font-serif font-bold tracking-[0.05em] text-white md:text-6xl">
          {t('battlefieldPreview.title')}
        </h2>
        <p className="mx-auto max-w-3xl text-lg leading-relaxed text-zinc-400">
          {t('battlefieldPreview.description')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] xl:gap-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {modeCards.map((card) => (
            <motion.div
              key={card.title}
              whileHover={{ y: -6 }}
              className={`rounded-[2.5rem] border p-8 shadow-2xl ${card.accent}`}
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                <card.icon size={24} className="text-gold" />
              </div>
              <h3 className="text-3xl font-serif font-black text-white">{card.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-zinc-300">{card.body}</p>
              <div className="mt-6 space-y-3">
                {card.bullets.map((bullet) => (
                  <div key={bullet} className="rounded-[1.4rem] border border-white/8 bg-black/15 px-4 py-4 text-sm text-zinc-300">
                    {bullet}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass-dark rounded-[2.5rem] border border-white/6 p-8 shadow-2xl">
          <h3 className="text-[10px] font-black uppercase tracking-[0.35em] text-gold">{t('battlefieldPreview.proofTitle')}</h3>
          <div className="mt-6 space-y-4">
            {[
              { ...proofItems[0], icon: Users },
              { ...proofItems[1], icon: Bot },
              { ...proofItems[2], icon: Archive },
            ].map((item) => (
              <div key={item.title} className="rounded-[1.6rem] border border-white/6 bg-white/[0.03] px-5 py-5">
                <div className="flex items-center gap-3">
                  <item.icon size={18} className="text-gold" />
                  <h4 className="text-base font-black uppercase tracking-[0.18em] text-white">{item.title}</h4>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
