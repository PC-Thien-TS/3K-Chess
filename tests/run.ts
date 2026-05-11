import './classicOnlineAuthority.test';
import './authenticRules.test';
import './classicMoveReducer.test';
import { runTests } from './testHarness';

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
