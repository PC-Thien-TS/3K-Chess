import { shouldScheduleAuthenticBotTurn } from '../src/hooks/useAuthenticBotTurns';
import { assert, test } from './testHarness';

test('Authentic bot turns: do not schedule when a winner already exists', () => {
  const shouldRun = shouldScheduleAuthenticBotTurn({
    enabled: true,
    winner: 'Wu',
    activeTurn: 'Wei',
    controlModes: {
      Wu: 'Human',
      Wei: 'Bot',
      Shu: 'Bot',
    },
  });

  assert.equal(shouldRun, false);
});

test('Authentic bot turns: schedule only for live bot-controlled turns', () => {
  const shouldRun = shouldScheduleAuthenticBotTurn({
    enabled: true,
    winner: null,
    activeTurn: 'Wei',
    controlModes: {
      Wu: 'Human',
      Wei: 'Bot',
      Shu: 'Human',
    },
  });

  assert.equal(shouldRun, true);
});
