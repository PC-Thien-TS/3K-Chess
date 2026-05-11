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
    description: 'Online + Local + Bot + Replay. The main competitive 3-player mode with rooms, bots, and match archives.'
  },
  authentic: {
    label: 'Authentic Modern Three Kingdoms Xiangqi',
    shortLabel: 'Modern 3K',
    description: 'Local-only + Authentic rules + Bot. SANGUO_YANYI_QI_V1 with Han court control, alliance triggers, and check priority.'
  }
};

export function normalizeGameMode(value: unknown, fallback: GameMode = DEFAULT_GAME_MODE): GameMode {
  return value === 'authentic' || value === 'classic' ? value : fallback;
}
