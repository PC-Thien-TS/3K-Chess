import { LANGUAGE_OPTIONS } from '@/src/i18n/languages';
import { useI18n } from '@/src/i18n/useI18n';
import { cn } from '@/src/lib/utils';

export default function LanguageSelector({ className }: { className?: string }) {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className={cn('relative flex items-center', className)}>
      <span className="sr-only">{t('common.languageSelectorLabel')}</span>
      <select
        data-testid="language-selector"
        aria-label={t('common.languageSelectorLabel')}
        value={language}
        onChange={(e) => setLanguage(e.target.value as (typeof LANGUAGE_OPTIONS)[number]['code'])}
        className="w-16 rounded-full border border-white/10 bg-white/5 px-2 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-200 transition-colors hover:bg-white/10 focus:outline-none focus:border-gold/30 sm:w-auto sm:px-3 sm:tracking-[0.18em]"
      >
        {LANGUAGE_OPTIONS.map((option) => (
          <option key={option.code} value={option.code} className="bg-ink text-white">
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
