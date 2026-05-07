import { 
  validateMove, 
  Piece, 
  Point, 
  Faction, 
  MOVE_ERRORS, 
  ValidationResult,
  isCheckmateDetailed,
  CheckmateResult,
  validateBoardIntegrity
} from './threeKingdomRules';

/**
 * Lightweight development test utility for Rule Engine v3.
 * Run this in the browser console for quick validation.
 */

interface TestCase {
  name: string;
  piece: Partial<Piece>;
  to: Point;
  pieces: Piece[];
  turn: Faction;
  expected: boolean | Partial<ValidationResult>;
  checkmateTest?: {
    faction: Faction;
    expected: boolean;
  };
}

const testPieces: Piece[] = [
  { id: 'wei-g', type: 'G', faction: 'Wei', x: 5, y: 1 },
  { id: 'shu-g', type: 'G', faction: 'Shu', x: 2, y: 9 },
  { id: 'wu-g', type: 'G', faction: 'Wu', x: 8, y: 9 },
  { id: 'wei-r1', type: 'R', faction: 'Wei', x: 5, y: 3 },
  { id: 'blocker', type: 'S', faction: 'Shu', x: 5, y: 5 },
];

const testCases: TestCase[] = [
  // General
  {
    name: "General legal move",
    piece: { type: 'G', faction: 'Wei', x: 5, y: 1 },
    to: { x: 5, y: 2 },
    pieces: testPieces,
    turn: 'Wei',
    expected: true
  },
  {
    name: "General diagonal move (illegal)",
    piece: { type: 'G', faction: 'Wei', x: 5, y: 1 },
    to: { x: 6, y: 2 },
    pieces: testPieces,
    turn: 'Wei',
    expected: false
  },
  
  // Chariot
  {
    name: "Chariot legal move",
    piece: { type: 'R', faction: 'Wei', x: 5, y: 3 },
    to: { x: 5, y: 4 },
    pieces: testPieces,
    turn: 'Wei',
    expected: true
  },
  {
    name: "Chariot blocked move",
    piece: { type: 'R', faction: 'Wei', x: 5, y: 3 },
    to: { x: 5, y: 6 }, // Blocked at (5,5)
    pieces: testPieces,
    turn: 'Wei',
    expected: false
  },

  // Horse
  {
    name: "Horse legal L move",
    piece: { type: 'H', faction: 'Wei', x: 5, y: 3 },
    to: { x: 7, y: 4 },
    pieces: testPieces,
    turn: 'Wei',
    expected: true
  },
  {
    name: "Horse blocked move",
    piece: { type: 'H', faction: 'Wei', x: 5, y: 3 },
    to: { x: 5, y: 5 }, // Not even L
    pieces: testPieces,
    turn: 'Wei',
    expected: false
  },

  // Cannon
  {
    name: "Cannon non-capture jump (illegal)",
    piece: { type: 'P', faction: 'Wei', x: 5, y: 3 },
    to: { x: 5, y: 6 }, // Jump over (5,5) but target empty
    pieces: testPieces,
    turn: 'Wei',
    expected: false
  },
  {
    name: "Cannon capture (legal)",
    piece: { type: 'P', faction: 'Wei', x: 5, y: 3 },
    to: { x: 5, y: 9 }, // Jump over (5,5) to capture (5,9)
    pieces: [...testPieces, { id: 'target', type: 'S', faction: 'Shu', x: 5, y: 9 }],
    turn: 'Wei',
    expected: true
  },
  // --- Rule Engine V2 Tests ---
  
  // Check Detection
  {
    name: "Chariot gives check",
    piece: { type: 'R', faction: 'Wei', x: 8, y: 14 },
    to: { x: 8, y: 5 }, // General at (8,0) for Shu
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      { id: 'wei-r', type: 'R', faction: 'Wei', x: 8, y: 14 }
    ],
    turn: 'Wei',
    expected: { legal: true, givesCheck: true }
  },
  {
    name: "Cannon gives check with screen",
    piece: { type: 'P', faction: 'Wei', x: 8, y: 14 },
    to: { x: 8, y: 5 }, // General at (8,0), Screen at (8,2)
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      { id: 'screen', type: 'S', faction: 'Wu', x: 8, y: 2 },
      { id: 'wei-p', type: 'P', faction: 'Wei', x: 8, y: 14 }
    ],
    turn: 'Wei',
    expected: { legal: true, givesCheck: true }
  },
  {
    name: "Cannon NO check (no screen)",
    piece: { type: 'P', faction: 'Wei', x: 8, y: 14 },
    to: { x: 8, y: 5 }, // General at (8,0), No screen
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      { id: 'wei-p', type: 'P', faction: 'Wei', x: 8, y: 14 }
    ],
    turn: 'Wei',
    expected: { legal: true, givesCheck: false }
  },

  // Self-Check Prevention
  {
    name: "Prevent moving into check",
    piece: { type: 'G', faction: 'Wei', x: 8, y: 16 },
    to: { x: 9, y: 16 }, // Opponent Chariot at (9,0)
    pieces: [
      { id: 'wei-g', type: 'G', faction: 'Wei', x: 8, y: 16 },
      { id: 'shu-r', type: 'R', faction: 'Shu', x: 9, y: 0 }
    ],
    turn: 'Wei',
    expected: { legal: false, reason: MOVE_ERRORS.SELF_CHECK }
  },
  {
    name: "Prevent exposing check (Pinned piece)",
    piece: { type: 'S', faction: 'Wei', x: 8, y: 15 },
    to: { x: 9, y: 15 }, // Moving this exposes General at (8,16) to Chariot at (8,0)
    pieces: [
      { id: 'wei-g', type: 'G', faction: 'Wei', x: 8, y: 16 },
      { id: 'wei-s', type: 'S', faction: 'Wei', x: 8, y: 15 },
      { id: 'shu-r', type: 'R', faction: 'Shu', x: 8, y: 0 }
    ],
    turn: 'Wei',
    expected: { legal: false, reason: MOVE_ERRORS.SELF_CHECK }
  },

  // General Facing
  {
    name: "Prevent General Facing",
    piece: { type: 'S', faction: 'Wei', x: 8, y: 8 },
    to: { x: 9, y: 8 }, // Removing this blocker makes Generals at (8,0) and (8,16) face each other
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      { id: 'wei-g', type: 'G', faction: 'Wei', x: 8, y: 16 },
      { id: 'wei-s', type: 'S', faction: 'Wei', x: 8, y: 8 }
    ],
    turn: 'Wei',
    expected: { legal: false, reason: MOVE_ERRORS.GENERAL_FACING }
  },
  // --- Rule Engine V3 Tests (Checkmate) ---
  {
    name: "Checkmate detection - General trapped",
    piece: { type: 'R', faction: 'Wei', x: 8, y: 14 },
    to: { x: 8, y: 1 }, 
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      { id: 'shu-a1', type: 'A', faction: 'Shu', x: 7, y: 1 },
      { id: 'shu-a2', type: 'A', faction: 'Shu', x: 9, y: 1 },
      { id: 'wei-r', type: 'R', faction: 'Wei', x: 8, y: 14 }
    ],
    turn: 'Wei',
    expected: { legal: true, givesCheck: true },
    checkmateTest: { faction: 'Shu', expected: true }
  },
  {
    name: "CHECKMATE FALSE: General can escape",
    piece: { type: 'R', faction: 'Wei', x: 8, y: 14 },
    to: { x: 8, y: 1 }, 
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      // Advisors removed so General can move to (7,0) or (9,0)
      { id: 'wei-r', type: 'R', faction: 'Wei', x: 8, y: 14 }
    ],
    turn: 'Wei',
    expected: { legal: true, givesCheck: true },
    checkmateTest: { faction: 'Shu', expected: false }
  },
  {
    name: "CHECKMATE FALSE: Piece can block",
    piece: { type: 'R', faction: 'Wei', x: 8, y: 14 },
    to: { x: 8, y: 1 }, 
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      { id: 'shu-a1', type: 'A', faction: 'Shu', x: 7, y: 1 },
      { id: 'shu-a2', type: 'A', faction: 'Shu', x: 9, y: 1 },
      { id: 'shu-r-blocker', type: 'R', faction: 'Shu', x: 0, y: 1 }, // Can move to (8,1) to block? No, simulate move
      { id: 'wei-r', type: 'R', faction: 'Wei', x: 8, y: 14 }
    ],
    turn: 'Wei',
    expected: { legal: true, givesCheck: true },
    checkmateTest: { faction: 'Shu', expected: false } // Shu chariot at (0,1) can move to (8,1) to block check
  },
  {
    name: "CHECKMATE FALSE: Piece can capture attacker",
    piece: { type: 'R', faction: 'Wei', x: 8, y: 14 },
    to: { x: 8, y: 1 }, 
    pieces: [
      { id: 'shu-g', type: 'G', faction: 'Shu', x: 8, y: 0 },
      { id: 'shu-a1', type: 'A', faction: 'Shu', x: 7, y: 1 }, // Advisor at (7,1) can capture attacker at (8,1)? No, advisors diagonal.
      { id: 'shu-r-killer', type: 'R', faction: 'Shu', x: 0, y: 1 }, // Can capture at (8,1)
      { id: 'wei-r', type: 'R', faction: 'Wei', x: 8, y: 14 }
    ],
    turn: 'Wei',
    expected: { legal: true, givesCheck: true },
    checkmateTest: { faction: 'Shu', expected: false }
  }
];

export function runRuleEngineDevTests() {
  console.group('Rule Engine v3 QA Pass');
  
  const results: any[] = [];
  const addTest = (name: string, piece: Partial<Piece>, to: Point, pieces: Piece[], turn: Faction, expected: any) => {
    const p = { id: 'test-piece', type: 'G' as const, faction: 'Shu' as const, x:0, y:0, ...piece } as Piece;
    const res = validateMove(p, to, pieces, turn);
    let passed = false;
    if (typeof expected === 'boolean') passed = res.legal === expected;
    else passed = Object.entries(expected).every(([k, v]) => (res as any)[k] === v);
    
    results.push({
      'Test Suite': name.split(':')[0],
      'Test Case': name.split(':')[1] || name,
      'Legal': res.legal ? 'YES' : 'NO',
      'Reason': res.reason || '-',
      'Pass': passed ? '✅' : '❌'
    });
  };

  // 1. CANNON EDGE CASES
  const cannonBase: Piece[] = [{ id: 'target', type: 'S', faction: 'Wei', x: 8, y: 10 }];
  addTest("CANNON: Capture with 1 screen", { type: 'P', faction: 'Shu', x: 8, y: 0 }, { x: 8, y: 10 }, [...cannonBase, { id: 's1', type: 'S', faction: 'Wu', x: 8, y: 5 }], 'Shu', true);
  addTest("CANNON: No capture with 0 screens", { type: 'P', faction: 'Shu', x: 8, y: 0 }, { x: 8, y: 10 }, cannonBase, 'Shu', false);
  addTest("CANNON: No capture with 2 screens", { type: 'P', faction: 'Shu', x: 8, y: 0 }, { x: 8, y: 10 }, [...cannonBase, { id: 's1', type: 'S', faction: 'Wu', x: 8, y: 3 }, { id: 's2', type: 'S', faction: 'Wu', x: 8, y: 7 }], 'Shu', false);
  addTest("CANNON: Move with 0 screens", { type: 'P', faction: 'Shu', x: 8, y: 0 }, { x: 8, y: 5 }, [], 'Shu', true);
  addTest("CANNON: No move with 1 screen", { type: 'P', faction: 'Shu', x: 8, y: 0 }, { x: 8, y: 10 }, [{ id: 's1', type: 'S', faction: 'Wu', x: 8, y: 5 }], 'Shu', false);

  // 2. HORSE EDGE CASES
  addTest("HORSE: Legal L", { type: 'H', faction: 'Shu', x: 5, y: 5 }, { x: 7, y: 6 }, [], 'Shu', true);
  addTest("HORSE: Blocked leg", { type: 'H', faction: 'Shu', x: 5, y: 5 }, { x: 7, y: 6 }, [{ id: 'block', type: 'S', faction: 'Wu', x: 6, y: 5 }], 'Shu', false);
  addTest("HORSE: Not L", { type: 'H', faction: 'Shu', x: 5, y: 5 }, { x: 7, y: 7 }, [], 'Shu', false);

  // 3. ELEPHANT EDGE CASES
  addTest("ELEPHANT: Two diagonal", { type: 'E', faction: 'Shu', x: 7, y: 0 }, { x: 5, y: 2 }, [], 'Shu', true);
  addTest("ELEPHANT: Blocked eye", { type: 'E', faction: 'Shu', x: 7, y: 0 }, { x: 5, y: 2 }, [{ id: 'eye', type: 'S', faction: 'Wu', x: 6, y: 1 }], 'Shu', false);
  addTest("ELEPHANT: Cross river (Shu)", { type: 'E', faction: 'Shu', x: 7, y: 6 }, { x: 9, y: 8 }, [], 'Shu', false);

  // 4. SOLDIER EDGE CASES (All Factions)
  // Shu (Top, y=0..16, river at y=6)
  addTest("SOLDIER Shu: Forward pre-river", { type: 'S', faction: 'Shu', x: 8, y: 3 }, { x: 8, y: 4 }, [], 'Shu', true);
  addTest("SOLDIER Shu: Sideways pre-river", { type: 'S', faction: 'Shu', x: 8, y: 3 }, { x: 9, y: 3 }, [], 'Shu', false);
  addTest("SOLDIER Shu: Sideways post-river", { type: 'S', faction: 'Shu', x: 8, y: 7 }, { x: 9, y: 7 }, [], 'Shu', true);
  addTest("SOLDIER Shu: Backward post-river", { type: 'S', faction: 'Shu', x: 8, y: 7 }, { x: 8, y: 6 }, [], 'Shu', false);

  // Wei (Bottom, y=16..0, river at y=10)
  addTest("SOLDIER Wei: Forward pre-river", { type: 'S', faction: 'Wei', x: 8, y: 13 }, { x: 8, y: 12 }, [], 'Wei', true);
  addTest("SOLDIER Wei: Backward", { type: 'S', faction: 'Wei', x: 8, y: 13 }, { x: 8, y: 14 }, [], 'Wei', false);

  // Wu (Left, x=0..16, river at x=6)
  addTest("SOLDIER Wu: Forward pre-river", { type: 'S', faction: 'Wu', x: 3, y: 8 }, { x: 4, y: 8 }, [], 'Wu', true);
  addTest("SOLDIER Wu: Sideways post-river", { type: 'S', faction: 'Wu', x: 7, y: 8 }, { x: 7, y: 9 }, [], 'Wu', true);

  // 5. GENERAL / PALACE
  addTest("GENERAL: Leave palace", { type: 'G', faction: 'Shu', x: 9, y: 2 }, { x: 10, y: 2 }, [], 'Shu', false);
  addTest("ADVISOR: Leave palace", { type: 'A', faction: 'Shu', x: 9, y: 2 }, { x: 10, y: 4 }, [], 'Shu', false);
  addTest("GENERAL: Diagonal", { type: 'G', faction: 'Shu', x: 8, y: 1 }, { x: 9, y: 2 }, [], 'Shu', false);

  // 6. GENERAL FACING
  const gfPieces = [
    { id: 'shu-g', type: 'G' as const, faction: 'Shu' as const, x: 8, y: 0 },
    { id: 'wei-g', type: 'G' as const, faction: 'Wei' as const, x: 8, y: 16 }
  ];
  addTest("GENERAL FACING: Direct face-off", { type: 'G', faction: 'Shu', x: 8, y: 0 }, { x: 8, y: 1 }, gfPieces, 'Shu', false);
  addTest("GENERAL FACING: Blocker makes it legal", { type: 'G', faction: 'Shu', x: 8, y: 0 }, { x: 8, y: 1 }, [...gfPieces, { id: 'b', type: 'S', faction: 'Wu', x: 8, y: 5 }], 'Shu', true);

  // 7. SELF-CHECK
  const scPieces = [
    { id: 'wei-g', type: 'G' as const, faction: 'Wei' as const, x: 8, y: 16 },
    { id: 'shu-r', type: 'R' as const, faction: 'Shu' as const, x: 8, y: 0 }
  ];
  addTest("SELF-CHECK: Moving General into attack", { type: 'G' as const, faction: 'Wei' as const, x: 8, y: 16 }, { x: 9, y: 16 }, [{ id: 'wei-g', type: 'G' as const, faction: 'Wei' as const, x: 8, y: 16 }, { id: 'shu-r', type: 'R' as const, faction: 'Shu' as const, x: 9, y: 0 }], 'Wei', false);
  addTest("SELF-CHECK: Moving pinned piece", { type: 'S' as const, faction: 'Wei' as const, x: 8, y: 15 }, { x: 9, y: 15 }, [...scPieces, { id: 'pinned', type: 'S' as const, faction: 'Wei' as const, x: 8, y: 15 }], 'Wei', false);

  console.table(results);
  console.groupEnd();
  
  const failCount = results.filter(r => r.Pass === '❌').length;
  if (failCount === 0) {
    console.log('%c All rule engine tests passed!', 'background: #004d00; color: #fff; padding: 4px;');
  } else {
    console.warn(`%c ${failCount} tests failed.`, 'background: #4d0000; color: #fff; padding: 4px;');
  }
}
