import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Pause, Play } from 'lucide-react';
import { cn } from '@/src/lib/utils';

export type ReplayPlaybackSpeed = 0.5 | 1 | 2;

export interface ReplayMoveListItem {
  step: number;
  label: string;
  detail?: string;
}

interface ReplayPlaybackPanelProps {
  theme: 'classic' | 'authentic';
  currentStep: number;
  totalSteps: number;
  isPlaying: boolean;
  playbackSpeed: ReplayPlaybackSpeed;
  onTogglePlay: () => void;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  onJumpToStep: (step: number) => void;
  onSpeedChange: (speed: ReplayPlaybackSpeed) => void;
  moveItems: ReplayMoveListItem[];
  currentStepTestId?: string;
  nextButtonTestId?: string;
}

const THEME = {
  classic: {
    shell: 'glass-dark border border-white/5 bg-black/30 text-white',
    chip: 'border border-white/10 bg-white/[0.03] text-zinc-200',
    muted: 'text-zinc-500',
    track: 'border border-white/10 bg-white/[0.03]',
    fill: 'bg-gradient-to-r from-gold/40 via-gold to-amber-200 shadow-[0_0_18px_rgba(212,175,55,0.45)]',
    button: 'border border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-35',
    primaryButton: 'bg-gold text-black hover:bg-white',
    speedActive: 'border-gold bg-gold/15 text-gold',
    speedIdle: 'border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/10 hover:text-white',
    moveIdle: 'border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-white',
    moveActive: 'border border-gold/35 bg-gold/10 text-gold shadow-[0_0_18px_rgba(212,175,55,0.12)]',
  },
  authentic: {
    shell: 'border border-[#8b6433]/20 bg-[#f7eedb] text-[#35210f]',
    chip: 'border border-[#8b6433]/15 bg-white/45 text-[#35210f]',
    muted: 'text-[#90714a]',
    track: 'border border-[#8b6433]/15 bg-white/40',
    fill: 'bg-[linear-gradient(90deg,#8b5d17_0%,#d6a84e_100%)] shadow-[0_0_14px_rgba(139,93,23,0.25)]',
    button: 'border border-[#8b6433]/15 bg-white/45 text-[#35210f] hover:bg-white/70 disabled:opacity-40',
    primaryButton: 'bg-[#8b5d17] text-white hover:bg-[#6f4c28]',
    speedActive: 'border-[#8b5d17] bg-amber-100 text-[#6f4c28]',
    speedIdle: 'border-[#8b6433]/15 bg-white/45 text-[#6f4c28] hover:bg-white/70',
    moveIdle: 'border border-[#8b6433]/15 bg-white/35 hover:bg-white/60 text-[#35210f]',
    moveActive: 'border border-[#8b5d17]/30 bg-amber-100/75 text-[#6f4c28] shadow-[0_0_16px_rgba(139,93,23,0.10)]',
  },
} as const;

const SPEED_OPTIONS: ReplayPlaybackSpeed[] = [0.5, 1, 2];

export default function ReplayPlaybackPanel({
  theme,
  currentStep,
  totalSteps,
  isPlaying,
  playbackSpeed,
  onTogglePlay,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onJumpToStep,
  onSpeedChange,
  moveItems,
  currentStepTestId,
  nextButtonTestId,
}: ReplayPlaybackPanelProps) {
  const styles = THEME[theme];
  const progressPercent = totalSteps === 0 ? 0 : (currentStep / totalSteps) * 100;

  return (
    <div data-testid="replay-controls" className={cn('w-full min-w-0 overflow-hidden rounded-[2rem] p-4 shadow-3xl sm:rounded-[3rem] sm:p-8', styles.shell)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div
            data-testid={currentStepTestId}
            className={cn('rounded-[1.5rem] px-4 py-4 sm:px-6', styles.chip)}
          >
            <p className={cn('text-[9px] font-black uppercase tracking-[0.3em]', styles.muted)}>Current Step</p>
            <p className="mt-2 text-2xl font-mono font-black tracking-tight sm:text-3xl">
              {currentStep} / {totalSteps}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={onFirst}
              disabled={currentStep === 0}
              className={cn('rounded-[1.25rem] px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98] sm:px-4 sm:tracking-[0.22em]', styles.button)}
              title="First move"
            >
              <span className="flex items-center gap-2">
                <ChevronsLeft size={14} />
                First
              </span>
            </button>
            <button
              type="button"
              onClick={onPrevious}
              disabled={currentStep === 0}
              className={cn('rounded-[1.25rem] px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98] sm:px-4 sm:tracking-[0.22em]', styles.button)}
              title="Previous move"
            >
              <span className="flex items-center gap-2">
                <ChevronLeft size={14} />
                Prev
              </span>
            </button>
            <button
              data-testid="replay-play-toggle"
              type="button"
              onClick={onTogglePlay}
              disabled={totalSteps === 0}
              className={cn('col-span-2 flex min-h-12 items-center justify-center gap-3 rounded-[1.35rem] px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] shadow-[0_15px_30px_rgba(0,0,0,0.12)] transition-all active:scale-[0.98] disabled:opacity-40 sm:col-auto sm:min-w-[8.5rem] sm:px-5 sm:tracking-[0.24em]', styles.primaryButton)}
              title={isPlaying ? 'Pause replay' : 'Play replay'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" fill="currentColor" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              data-testid={nextButtonTestId}
              type="button"
              onClick={onNext}
              disabled={currentStep === totalSteps}
              className={cn('rounded-[1.25rem] px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98] sm:px-4 sm:tracking-[0.22em]', styles.button)}
              title="Next move"
            >
              <span className="flex items-center gap-2">
                Next
                <ChevronRight size={14} />
              </span>
            </button>
            <button
              type="button"
              onClick={onLast}
              disabled={currentStep === totalSteps}
              className={cn('rounded-[1.25rem] px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] transition-all active:scale-[0.98] sm:px-4 sm:tracking-[0.22em]', styles.button)}
              title="Last move"
            >
              <span className="flex items-center gap-2">
                Last
                <ChevronsRight size={14} />
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('text-[9px] font-black uppercase tracking-[0.3em]', styles.muted)}>Speed</span>
            {SPEED_OPTIONS.map((speed) => (
              <button
                key={speed}
                data-testid={`replay-speed-${speed}x`}
                type="button"
                onClick={() => onSpeedChange(speed)}
                className={cn(
                  'min-h-10 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98]',
                  playbackSpeed === speed ? styles.speedActive : styles.speedIdle
                )}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className={cn('rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[0.24em]', styles.chip)}>
            Move {currentStep} of {totalSteps}
          </div>
        </div>

        <div className="space-y-3">
          <div className={cn('relative h-3 overflow-hidden rounded-full p-[1px]', styles.track)}>
            <div className={cn('h-full rounded-full transition-all', styles.fill)} style={{ width: `${progressPercent}%` }} />
            <input
              data-testid="replay-timeline"
              type="range"
              min={0}
              max={Math.max(totalSteps, 0)}
              value={currentStep}
              onChange={(event) => onJumpToStep(Number(event.target.value))}
              aria-label="Replay timeline"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </div>
          <div className={cn('flex items-center justify-between text-[9px] font-black uppercase tracking-[0.24em]', styles.muted)}>
            <span>Deployment</span>
            <span>Final Move</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className={cn('text-[10px] font-black uppercase tracking-[0.35em]', styles.muted)}>Move List</h3>
            <span className={cn('text-[9px] font-black uppercase tracking-[0.24em]', styles.muted)}>
              Click to jump
            </span>
          </div>
          <div data-testid="replay-move-list" className="max-h-64 space-y-2 overflow-y-auto pr-1 sm:max-h-80">
            {moveItems.map((item) => {
              const active = item.step === currentStep;
              return (
                <button
                  key={`${item.step}-${item.label}`}
                  type="button"
                  onClick={() => onJumpToStep(item.step)}
                  className={cn(
                    'w-full rounded-[1.4rem] px-4 py-3 text-left transition-all active:scale-[0.99]',
                    active ? styles.moveActive : styles.moveIdle
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-[10px] font-black uppercase tracking-[0.18em]">
                        Step {item.step}
                      </p>
                      <p className="mt-1 text-sm font-serif leading-relaxed">{item.label}</p>
                      {item.detail ? (
                        <p className={cn('mt-2 text-[11px] leading-relaxed', active ? 'text-current opacity-80' : styles.muted)}>
                          {item.detail}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={cn(
                        'shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.2em]',
                        active ? 'border-current/25 bg-current/10' : styles.chip
                      )}
                    >
                      {item.step === 0 ? 'Start' : item.step}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
