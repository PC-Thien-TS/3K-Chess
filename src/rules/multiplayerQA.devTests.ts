import { WarRoom, validateWarRoom, mapWarRoomToMatchSetup } from '../storage/warRooms';
import { Faction } from './threeKingdomRules';

export function runMultiplayerArchitectureQA() {
  console.group("⚔️ THREE KINGDOMS CHESS: MULTIPLAYER ARCHITECTURE QA");
  
  const results: any[] = [];
  const logTest = (name: string, passed: boolean, details?: string) => {
    results.push({ 
        Test: name, 
        Result: passed ? "✅ PASS" : "❌ FAIL",
        Details: details || "-"
    });
  };

  // 1. VALIDATION TESTS
  const validRoom: WarRoom = {
    roomCode: "SHU-TEST",
    hostName: "Commander Guan",
    createdAt: new Date().toISOString(),
    status: 'waiting',
    slots: {
        Shu: { faction: 'Shu', occupantType: 'human', playerName: 'Guan Yu', ready: true },
        Wei: { faction: 'Wei', occupantType: 'bot', botDifficulty: 'normal', ready: true },
        Wu: { faction: 'Wu', occupantType: 'bot', botDifficulty: 'normal', ready: true }
    },
    roomRules: {
        ruleset: '3K_CHESS_STANDARD_V1',
        allowBots: true,
        botDifficultyDefault: 'normal'
    }
  };

  logTest("Validation: Valid Room", validateWarRoom(validRoom).valid);

  const missingSlot = { ...validRoom, slots: { ...validRoom.slots } };
  delete (missingSlot.slots as any).Wu;
  logTest("Validation: Missing Slot Fails", !validateWarRoom(missingSlot).valid);

  const invalidBot = JSON.parse(JSON.stringify(validRoom));
  invalidBot.slots.Wei.botDifficulty = undefined;
  logTest("Validation: Bot without difficulty fails", !validateWarRoom(invalidBot).valid);

  const anonymousHuman = JSON.parse(JSON.stringify(validRoom));
  anonymousHuman.slots.Shu.playerName = undefined;
  logTest("Validation: Human without name fails", !validateWarRoom(anonymousHuman).valid);

  // 2. MAPPING TESTS
  try {
    const setup = mapWarRoomToMatchSetup(validRoom);
    logTest("Mapping: Valid Room to MatchSetup", setup.factions.Shu.control === 'Human' && setup.factions.Wei.control === 'Bot');
  } catch (e) {
    logTest("Mapping: Valid Room to MatchSetup", false, "Threw error unexpectedly");
  }

  const zeroHumanRoom = JSON.parse(JSON.stringify(validRoom));
  zeroHumanRoom.slots.Shu.occupantType = 'bot';
  zeroHumanRoom.slots.Shu.botDifficulty = 'hard';
  try {
    mapWarRoomToMatchSetup(zeroHumanRoom);
    logTest("Mapping: Zero Human Room Fails", false);
  } catch (e) {
    logTest("Mapping: Zero Human Room Fails", true, "Caught 0 humans error");
  }

  const unreadyRoom = JSON.parse(JSON.stringify(validRoom));
  unreadyRoom.slots.Shu.ready = false;
  try {
    mapWarRoomToMatchSetup(unreadyRoom);
    logTest("Mapping: Unready Human Fails", false);
  } catch (e) {
    logTest("Mapping: Unready Human Fails", true, "Caught unready error");
  }

  console.table(results);
  console.groupEnd();
}
