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

const FACTION_COLORS = {
  Shu: 'text-rose-500',
  Wei: 'text-blue-500',
  Wu: 'text-emerald-500',
  None: 'text-zinc-500'
};

export default function MatchArchive() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [importError, setImportError] = useState<string | null>(null);

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

  const filteredMatches = matches.filter(m => 
    m.winner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-24 min-h-screen container mx-auto px-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <Link to="/" className="flex items-center gap-2 text-gold hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-4">
            <ChevronLeft size={16} /> To the Throne Room
          </Link>
          <h1 className="text-4xl md:text-6xl font-serif font-black text-white tracking-widest uppercase">
            LOCAL <span className="text-gold italic">ARCHIVES</span>
          </h1>
          <p className="text-zinc-500 font-serif italic text-lg opacity-80 mt-2">
            "Chronicles of past conquests and failed sieges."
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <label className="flex-1 sm:flex-none cursor-pointer bg-gold hover:bg-white text-black px-6 py-4 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            <Upload size={16} /> Import Scroll
            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
          </label>
        </div>
      </div>

      <AnimatePresence>
        {importError && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-2xl mb-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest"
          >
            <ShieldAlert size={20} /> {importError}
            <button onClick={() => setImportError(null)} className="ml-auto text-rose-500/50 hover:text-rose-500 font-black">X</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-10 relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gold opacity-40" size={20} />
        <input 
          type="text" 
          placeholder="Search by winner or battle ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-5 pl-16 pr-6 text-white placeholder:text-zinc-700 focus:outline-none focus:border-gold/30 transition-all font-serif"
        />
      </div>

      {filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map((match, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              key={match.id}
              onClick={() => navigate(`/replay/${match.id}`)}
              className="group glass-dark border border-white/5 p-8 rounded-[2rem] hover:border-gold/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em] mb-1">Battle Recorded</span>
                  <div className="flex items-center gap-2 text-white font-mono text-[10px] opacity-60 mb-2">
                    <Calendar size={12} className="text-gold" /> {new Date(match.createdAt).toLocaleDateString()}
                    <Clock size={12} className="text-gold ml-2" /> {new Date(match.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {match.source?.mode === 'war-room-sim' && (
                    <div className="text-[8px] font-bold text-gold uppercase tracking-widest bg-gold/10 border border-gold/20 px-2 py-0.5 rounded-full w-fit">
                      War Room: {match.source.roomCode}
                    </div>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all">
                  <PlayCircle size={20} />
                </div>
              </div>

              <div className="mb-8">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 block">Unification Success</span>
                <div className="flex items-center gap-4">
                  <Trophy size={32} className={cn("text-gold", match.winner ? FACTION_COLORS[match.winner] : "text-zinc-600")} />
                  <div>
                    <h3 className={cn("text-2xl font-serif font-black uppercase", match.winner ? FACTION_COLORS[match.winner] : "text-white")}>
                      {match.winner || "Draw/Incomplete"}
                    </h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Realm Unified</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 mb-8">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Maneuvers</span>
                  <span className="text-white font-mono text-lg font-bold flex items-center gap-2">
                     <Sword size={14} className="text-gold/40" /> {match.matchStats.totalMoves}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] uppercase tracking-widest text-zinc-600 font-bold">Dynasties Ended</span>
                  <span className="text-white font-mono text-lg font-bold flex items-center gap-2">
                     <Ghost size={14} className="text-rose-500/40" /> {match.matchStats.totalCheckmates}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={(e) => handleExport(match, e)}
                  className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-3 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  <Download size={12} /> Export
                </button>
                <button 
                  onClick={(e) => handleDelete(match.id, e)}
                  className="bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 px-4 rounded-xl transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center text-zinc-700 mb-6">
            <Search size={40} />
          </div>
          <h3 className="text-2xl font-serif font-bold text-white mb-2 uppercase tracking-widest">No Battles Found</h3>
          <p className="text-zinc-500 font-serif italic max-w-sm">
            {searchTerm 
              ? "No chronicles match your search criteria. Perhaps the history was never written?"
              : "The archives are empty. Lead your armies to victory to write the first chapter."}
          </p>
        </div>
      )}
    </div>
  );
}
