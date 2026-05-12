import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface MobilePanelSectionProps {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  desktopBreakpoint?: 'lg' | 'xl' | '2xl';
  shellClassName?: string;
  titleClassName?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}

export default function MobilePanelSection({
  title,
  icon,
  defaultOpen = true,
  desktopBreakpoint = 'xl',
  shellClassName,
  titleClassName,
  bodyClassName,
  children,
}: MobilePanelSectionProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const toggleVisibilityClass =
    desktopBreakpoint === 'lg' ? 'lg:hidden' : desktopBreakpoint === '2xl' ? '2xl:hidden' : 'xl:hidden';
  const forcedOpenClass =
    desktopBreakpoint === 'lg' ? 'hidden lg:block' : desktopBreakpoint === '2xl' ? 'hidden 2xl:block' : 'hidden xl:block';

  return (
    <section className={shellClassName}>
      <div className="flex items-center justify-between gap-3">
        <div className={cn('flex items-center gap-3', titleClassName)}>
          {icon}
          <span>{title}</span>
        </div>
        <button
          type="button"
          aria-label={isOpen ? `Collapse ${title}` : `Expand ${title}`}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-all active:scale-[0.96]',
            toggleVisibilityClass
          )}
        >
          <ChevronDown size={18} className={cn('transition-transform', isOpen && 'rotate-180')} />
        </button>
      </div>
      <div className={cn('mt-4', !isOpen && forcedOpenClass, bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
