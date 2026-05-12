import './classicOnlineAuthority.test';
import './authenticRules.test';
import './authenticBotTurns.test';
import './botDifficulty.test';
import './classicMoveReducer.test';
import './classicReplayReducer.test';
import './authenticReplayReducer.test';
import { runTests } from './testHarness';

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
