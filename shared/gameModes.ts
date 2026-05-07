export type GameMode = 'classic' | 'authentic';

export type GameRuleset = '3K_CHESS_STANDARD_V1' | 'SANGUO_YANYI_QI_V1';

export const DEFAULT_GAME_MODE: GameMode = 'classic';

export const GAME_MODE_RULESETS: Record<GameMode, GameRuleset> = {
  classic: '3K_CHESS_STANDARD_V1',
  authentic: 'SANGUO_YANYI_QI_V1'
};

export const GAME_MODE_META: Record<GameMode, {
  label: string;
  shortLabel: string;
  description: string;
}> = {
  classic: {
    label: 'Classic 3-Player Xiangqi',
    shortLabel: 'Classic',
    description: 'The current competitive 3-player ruleset with existing bots, online sync, replay, and archives.'
  },
  authentic: {
    label: 'Authentic Modern Three Kingdoms Xiangqi',
    shortLabel: 'Modern 3K',
    description: 'Local-only Sanguo Yanyi Qi with Han court mechanics, alliance triggers, check priority, and a separate rules engine from Classic.'
  }
};

export function normalizeGameMode(value: unknown, fallback: GameMode = DEFAULT_GAME_MODE): GameMode {
  return value === 'authentic' || value === 'classic' ? value : fallback;
}
