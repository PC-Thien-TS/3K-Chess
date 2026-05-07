import { MatchRecord } from '../rules/threeKingdomRules';

const STORAGE_KEY = 'threeKingdomsChess.matchArchive.v1';

export function saveMatchRecord(record: MatchRecord) {
  const archive = getSavedMatchRecords();
  const updated = [record, ...archive].slice(0, 50); // Limit to 50
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function getSavedMatchRecords(): MatchRecord[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    const raw = JSON.parse(data);
    if (!Array.isArray(raw)) return [];
    return raw.filter(r => validateMatchRecord(r).valid);
  } catch (e) {
    console.error("Corrupt match archive data detected - skipping corrupt entries", e);
    return [];
  }
}

export function deleteMatchRecord(id: string) {
  const archive = getSavedMatchRecords();
  const updated = archive.filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function exportMatchRecord(record: MatchRecord) {
  const blob = new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const timestamp = new Date(record.createdAt).getTime();
  a.href = url;
  a.download = `three-kingdoms-chess-match-${timestamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateMatchRecord(record: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!record.id) errors.push("Missing ID");
  if (record.ruleset !== "3K_CHESS_STANDARD_V1") errors.push("Invalid or missing ruleset");
  if (!Array.isArray(record.initialPieces)) errors.push("Missing initial pieces");
  if (!Array.isArray(record.moves)) errors.push("Missing moves array");
  if (!record.setup) errors.push("Missing setup configuration");
  
  return {
    valid: errors.length === 0,
    errors
  };
}
