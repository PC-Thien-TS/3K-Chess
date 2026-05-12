import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ChevronLeft, 
  Trash2, 
  Download, 
  PlayCircle, 
  Upload, 
  Search, 
  Trophy, 
  Calendar, 
  Clock, 
  Sword,
  ShieldAlert,
  Ghost
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { 
  getSavedMatchRecords, 
  deleteMatchRecord, 
  exportMatchRecord, 
  validateMatchRecord,
  saveMatchRecord
} from '@/src/storage/localMatchArchive';
import { MatchRecord } from '@/src/rules/threeKingdomRules';
import { DEFAULT_GAME_MODE, GAME_MODE_META, normalizeGameMode } from '@/shared/gameModes';

const FACTION_COLORS = {
  Shu: 'text-rose-500',
  Wei: 'text-blue-500',
  Wu: 'text-emerald-500',
  None: 'text-zinc-500'
};

type ArchiveModeFilter = 'all' | 'classic' | 'authentic';
type ArchiveSourceFilter = 'all' | 'local' | 'war-room';

function getArchiveMode(match: MatchRecord) {
  return normalizeGameMode(match.setup?.gameMode, DEFAULT_GAME_MODE);
}

function getArchiveSource(match: MatchRecord): Exclude<ArchiveSourceFilter, 'all'> {
  return match.source?.mode === 'war-room-sim' ? 'war-room' : 'local';
}

function getArchiveSourceLabel(match: MatchRecord) {
  return getArchiveSource(match) === 'war-room' ? 'War Room' : 'Local';
}

function getArchiveMoveCount(match: MatchRecord) {
  return getArchiveMode(match) === 'authentic'
    ? match.authenticReplay?.moves.length ?? match.moves.length
    : match.moves.length;
}

export default function MatchArchive() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [modeFilter, setModeFilter] = useState<ArchiveModeFilter>('all');
  const [sourceFilter, setSourceFilter] = useState<ArchiveSourceFilter>('all');

  useEffect(() => {
    setMatches(getSavedMatchRecords());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you wish to strike this battle from the records?")) {
      deleteMatchRecord(id);
      setMatches(getSavedMatchRecords());
    }
  };

  const handleExport = (record: MatchRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    exportMatchRecord(record);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const record = JSON.parse(event.target?.result as string);
        const validation = validateMatchRecord(record);
        if (validation.valid) {
          saveMatchRecord(record);
          setMatches(getSavedMatchRecords());
          setImportError(null);
        } else {
          setImportError("Scrolled record is corrupted: " + validation.errors.join(", "));
        }
      } catch (err) {
        setImportError("Failed to parse the match scroll. Ensure it is a valid JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const filteredMatches = matches.filter((match) => {
    const mode = getArchiveMode(match);
    const source = getArchiveSource(match);

    if (modeFilter !== 'all' && mode !== modeFilter) {
      return false;
    }

    if (sourceFilter !== 'all' && source !== sourceFilter) {
      return false;
    }

    if (!searchTerm.trim()) {
      return true;
    }

    const query = searchTerm.trim().toLowerCase();
    const roomCode = match.source?.roomCode?.toLowerCase() ?? '';
    const winner = match.winner?.toLowerCase() ?? '';
    const modeLabel = GAME_MODE_META[mode].shortLabel.toLowerCase();
    const sourceLabel = getArchiveSourceLabel(match).toLowerCase();

    return [winner, match.id.toLowerCase(), roomCode, modeLabel, sourceLabel].some((value) =>
      value.includes(query)
    );
  });

  return (
    <div data-testid="match-archive-page" className="pt-24 min-h-screen max-w-7xl mx-auto px-4 pb-12 sm:px-6">
      <div className="mb-12 flex flex-col gap-8 px-0 sm:px-4 lg:mb-16 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
        <div className="space-y-4">
          <Link to="/" className="inline-flex items-center gap-3 text-gold hover:text-white transition-all text-[10px] font-black uppercase tracking-[0.4em] mb-4 bg-gold/10 px-6 py-2.5 rounded-full border border-gold/20 hover:scale-105 active:scale-95">
            <ChevronLeft size={16} /> Throne Room
          </Link>
          <h1 className="text-4xl font-serif font-black uppercase leading-none tracking-[0.08em] text-white drop-shadow-2xl sm:text-5xl md:text-8xl md:tracking-[0.1em]">
            IMPERIAL <span className="text-gold italic block md:inline">ARCHIVES</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="w-12 h-px bg-gold/30" />
            <p className="text-base font-serif italic tracking-wide text-zinc-500 opacity-80 sm:text-lg sm:tracking-widest">
              Chronicles of conquests, defeats, and tactical genius.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 sm:flex-row lg:w-auto">
          <label className="group relative flex w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-2xl bg-gold px-10 py-5 text-[11px] font-black uppercase tracking-[0.3em] text-black shadow-[0_15px_40px_rgba(212,175,55,0.25)] transition-all hover:bg-white hover:scale-[1.02] active:scale-95 sm:w-auto">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
            <Upload size={18} className="relative z-10" /> 
            <span className="relative z-10">Import Scroll</span>
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      <AnimatePresence>
        {importError && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-rose-500/10 border-2 border-rose-500/20 text-rose-500 p-8 rounded-[2rem] mb-12 flex items-center gap-6 text-xs font-black uppercase tracking-[0.2em] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />
            <ShieldAlert size={32} className="relative z-10" /> 
            <span className="relative z-10 flex-1">{importError}</span>
            <button 
              onClick={() => setImportError(null)} 
              className="relative z-10 bg-rose-500/20 hover:bg-rose-500 hover:text-white p-2 rounded-xl transition-all"
            >
              <Trash2 size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="group relative mb-12 px-0 sm:px-4 sm:mb-16">
        <div className="pointer-events-none absolute inset-y-0 left-6 flex items-center sm:left-10">
          <Search className="text-gold group-focus-within:scale-125 transition-transform" size={24} />
        </div>
        <input 
          data-testid="archive-search-input"
          type="text" 
          placeholder="SEARCH CHRONICLES (WINNER, ID, OR ROOM CODE)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-[1.75rem] border-2 border-white/5 bg-white/[0.02] py-5 pl-16 pr-6 text-[11px] tracking-[0.16em] text-white placeholder:text-zinc-800 shadow-inner transition-all focus:outline-none focus:border-gold/40 focus:bg-white/[0.04] font-mono font-black sm:rounded-[2.5rem] sm:py-8 sm:pl-24 sm:pr-10 sm:text-xs sm:tracking-[0.2em]"
        />
      </div>

      <div className="mb-8 flex flex-col gap-4 px-0 sm:px-4 sm:mb-10">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-500">Mode Filter</span>
          <div data-testid="archive-mode-filter" className="flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['classic', 'Classic'],
              ['authentic', 'Modern 3K'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setModeFilter(value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all',
                  modeFilter === value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black uppercase tracking-[0.28em] text-zinc-500">Source Filter</span>
          <div data-testid="archive-source-filter" className="flex flex-wrap gap-2">
            {([
              ['all', 'All'],
              ['local', 'Local'],
              ['war-room', 'Online / War Room'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setSourceFilter(value)}
                className={cn(
                  'rounded-full border px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all',
                  sourceFilter === value
                    ? 'border-gold bg-gold/10 text-gold'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 px-0 sm:px-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {filteredMatches.map((match, idx) => {
            const mode = getArchiveMode(match);
            const sourceLabel = getArchiveSourceLabel(match);
            const winnerLabel = match.winner || 'Armistice';
            const moveCount = getArchiveMoveCount(match);

            return (
            <motion.div
              layout
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 100, damping: 20 }}
              key={match.id}
              onClick={() => navigate(`/replay/${match.id}`)}
              className="group glass-dark relative flex cursor-pointer flex-col overflow-hidden rounded-[2rem] border border-white/5 p-5 shadow-2xl transition-all hover:border-gold/40 sm:rounded-[3rem] sm:p-8 xl:p-10"
            >
              {/* Card Ambient Glow */}
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-gold/5 blur-[80px] rounded-full group-hover:scale-150 transition-transform duration-1000" />
              
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                     <Calendar size={12} className="text-gold" />
                     <span className="text-[10px] font-mono font-black text-zinc-400">
                        {new Date(match.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                     </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-[0.2em] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                      {GAME_MODE_META[mode].shortLabel}
                    </div>
                    <div className="inline-flex items-center gap-2 text-[8px] font-black text-zinc-200 uppercase tracking-[0.2em] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                      {sourceLabel}
                    </div>
                    {match.source?.mode === 'war-room-sim' && match.source.roomCode && (
                      <div className="inline-flex items-center gap-2 text-[8px] font-black text-gold uppercase tracking-[0.2em] bg-gold/10 border border-gold/20 px-4 py-1.5 rounded-full">
                        {match.source.roomCode}
                      </div>
                    )}
                    <div className="inline-flex items-center gap-2 text-[8px] font-black text-zinc-200 uppercase tracking-[0.2em] bg-white/5 border border-white/10 px-4 py-1.5 rounded-full">
                      Winner {winnerLabel}
                    </div>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black group-hover:rotate-12 group-hover:scale-110 transition-all shadow-xl">
                  <PlayCircle size={24} />
                </div>
              </div>

              <div className="mb-10 relative z-10 flex-grow">
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4 block">Unified Under</span>
                <div className="flex items-center gap-6">
                  <div className={cn("w-14 h-14 rounded-2xl border-2 flex items-center justify-center shadow-inner", match.winner ? FACTION_COLORS[match.winner] : "bg-white/5 border-white/10")}>
                    <Trophy size={28} className={cn("", !match.winner && "text-zinc-700")} />
                  </div>
                  <div>
                    <h3 className={cn("text-3xl font-serif font-black uppercase tracking-tighter italic", match.winner ? FACTION_COLORS[match.winner] : "text-white")}>
                      {match.winner || "Armistice"}
                    </h3>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.2em]">Victory Declared</p>
                  </div>
                </div>
              </div>

              <div className="relative z-10 mb-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-6 sm:mb-8 sm:pt-8">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 font-black">Maneuvers</span>
                  <div className="flex items-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-gold/40" />
                     <span className="text-white font-mono text-xl font-black">{moveCount}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-700 font-black">King Slays</span>
                  <div className="flex items-center gap-2">
                     <div className="w-1 h-1 rounded-full bg-rose-500/40" />
                     <span className="text-white font-mono text-xl font-black">{match.matchStats.totalCheckmates}</span>
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
                <button 
                  onClick={(e) => { e.stopPropagation(); navigate(`/replay/${match.id}`); }}
                  className="group/btn flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 py-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:bg-gold hover:text-black sm:flex-[2]"
                >
                  <PlayCircle size={16} className="text-gold group-hover/btn:text-black" /> View Replay
                </button>
                <button 
                  onClick={(e) => handleExport(match, e)}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-zinc-500 shadow-lg transition-all hover:bg-white/10 hover:text-gold"
                  title="Export Scroll"
                >
                  <Download size={18} />
                </button>
                <button 
                  onClick={(e) => handleDelete(match.id, e)}
                  className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-500 shadow-lg transition-all hover:bg-rose-600 hover:text-white"
                  title="Strike from Record"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-40 text-center px-4 relative">
          {/* Empty State Ornament */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.02]">
             <ShieldAlert size={400} className="text-white" />
          </div>
          
          <div className="w-32 h-32 bg-white/[0.02] border-2 border-white/5 rounded-[2rem] flex items-center justify-center text-zinc-800 mb-8 shadow-2xl relative z-10">
            <Sword size={48} className="opacity-20" />
          </div>
          <h3 className="text-3xl font-serif font-black text-white mb-4 uppercase tracking-[0.5em] relative z-10">Records Empty</h3>
          <div className="w-12 h-px bg-gold/30 mx-auto mb-6" />
          <p className="text-zinc-500 font-serif italic text-lg max-w-sm relative z-10 leading-relaxed">
            {searchTerm 
              ? "No chronicles match your search. Perhaps the history remains unwritten."
              : "The great library awaits your first conquest. Lead your dynasty to glory and record your success here."}
          </p>
          {!searchTerm && (
            <Link to="/setup?mode=classic" className="mt-10 bg-gold text-black px-12 py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-xs transition-all hover:bg-white hover:scale-105 active:scale-95 shadow-2xl relative z-10">
               Begin First Campaign
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
