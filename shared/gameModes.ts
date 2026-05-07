export type GameMode = 'classic' | 'authentic';

export type GameRuleset = '3K_CHESS_STANDARD_V1' | '3K_AUTHENTIC_PLACEHOLDER_V1';

export const DEFAULT_GAME_MODE: GameMode = 'classic';

export const GAME_MODE_RULESETS: Record<GameMode, GameRuleset> = {
  classic: '3K_CHESS_STANDARD_V1',
  authentic: '3K_AUTHENTIC_PLACEHOLDER_V1'
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
    label: 'Authentic Three Kingdoms Chess',
    shortLabel: 'Authentic',
    description: 'A future mode for the traditional physical Three Kingdoms board and a separate authentic rule engine.'
  }
};

export function normalizeGameMode(value: unknown, fallback: GameMode = DEFAULT_GAME_MODE): GameMode {
  return value === 'authentic' || value === 'classic' ? value : fallback;
}
