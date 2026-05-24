import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { TradeJournal, TradeResult, TradeSession } from '../types';
import { Plus, Search, Edit3, Trash2, ArrowUpRight, ArrowDownRight, Minus, X, ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { getBlob } from '../lib/db';

const Jurnal = () => {
  const { journals, addJournal, deleteJournal } = useAppContext();
  const [search, setSearch] = useState('');
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [filterResult, setFilterResult] = useState<TradeResult | 'All'>('All');
  const [filterSession, setFilterSession] = useState<TradeSession | 'All'>('All');
  const [selectedJournal, setSelectedJournal] = useState<TradeJournal | null>(null);

  const filteredJournals = useMemo(() => {
    return journals.filter(j => {
       const matchSearch = j.pair.toLowerCase().includes(search.toLowerCase()) || j.setup.toLowerCase().includes(search.toLowerCase());
       const matchResult = filterResult === 'All' || j.result === filterResult;
       const matchSession = filterSession === 'All' || j.session === filterSession;
       return matchSearch && matchResult && matchSession;
    }).sort((a,b) => b.date - a.date);
  }, [journals, search, filterResult, filterSession]);

  const daysInMonth = useMemo(() => {
     const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }); // Sunday
     const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
     return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getJournalsForDay = (date: Date) => {
     return journals.filter(j => isSameDay(new Date(j.date), date));
  };

  const getResultColor = (res?: TradeResult) => {
      if(res === 'Win') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      if(res === 'Loss') return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      if(res === 'BE') return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      return 'text-slate-400 bg-slate-800 border-slate-700';
  }

  const getResultIcon = (res?: TradeResult) => {
      if(res === 'Win') return <ArrowUpRight size={16} />;
      if(res === 'Loss') return <ArrowDownRight size={16} />;
      return <Minus size={16} />;
  }

  return (
    <div className="h-full flex flex-col pt-2 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider mb-1">Jurnal Trading</h1>
          <p className="text-sm font-mono text-[#888]">{journals.length} ENTRIES // LOGGED</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="flex bg-[#111] border border-[#222] rounded-lg p-1 font-mono shrink-0">
               <button onClick={() => setViewMode('calendar')} className={cn("p-2 rounded-md transition-colors", viewMode === 'calendar' ? 'bg-[#00FF41]/10 text-white border-b-2 border-[#00FF41]' : 'text-[#888] hover:text-white')} title="Calendar View"><CalendarIcon size={16}/></button>
               <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-md transition-colors", viewMode === 'list' ? 'bg-[#00FF41]/10 text-white border-b-2 border-[#00FF41]' : 'text-[#888] hover:text-white')} title="List View"><List size={16}/></button>
           </div>
           
           {viewMode === 'list' && (
             <>
               <select 
                  value={filterResult} 
                  onChange={e => setFilterResult(e.target.value as any)} 
                  className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-[#888] focus:outline-none focus:text-white focus:border-[#00FF41] font-mono shrink-0"
               >
                   <option value="All">All Results</option>
                   <option value="Win">Win</option>
                   <option value="Loss">Loss</option>
                   <option value="BE">Break Even</option>
                   <option value="No Entry">No Entry</option>
               </select>
               <select 
                  value={filterSession} 
                  onChange={e => setFilterSession(e.target.value as any)} 
                  className="bg-[#111] border border-[#222] rounded-lg px-3 py-2 text-sm text-[#888] focus:outline-none focus:text-white focus:border-[#00FF41] font-mono shrink-0"
               >
                   <option value="All">All Sessions</option>
                   <option value="Asia">Asia</option>
                   <option value="London">London</option>
                   <option value="New York">New York</option>
               </select>
             </>
           )}

           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
              <input 
                 type="text" 
                 placeholder="Search pair / setup..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="w-full bg-[#111] border border-[#222] rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00FF41] font-mono transition-colors"
              />
           </div>
           
           <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 bg-[#00FF41] hover:bg-[#00CC33] text-black px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <Plus size={18} />
              <span className="hidden md:inline">Entri Baru</span>
           </button>
        </div>
      </div>

      {viewMode === 'list' ? (
          filteredJournals.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#111] rounded-2xl border border-[#222] border-dashed">
                 <Edit3 size={48} className="text-[#333] mb-4" />
                 <p className="text-[#888] text-sm font-mono uppercase">EMPTY_LOG // No journals recorded</p>
              </div>
          ) : (
              <div className="space-y-3 overflow-y-auto pb-4">
                  {filteredJournals.map(j => (
                      <motion.div 
                         layout
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         key={j.id} 
                         onClick={() => setSelectedJournal(j)}
                         className="bg-[#111]/40 backdrop-blur-sm border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between hover:border-[#00FF41]/30 hover:bg-[#111]/60 transition-colors group relative overflow-hidden shadow-lg cursor-pointer"
                      >
                          <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className={cn("p-3 rounded border shrink-0 flex items-center justify-center", getResultColor(j.result).replace('text-emerald-500', 'text-[#00FF41]').replace('bg-emerald-500/10', 'bg-[#00FF41]/10').replace('border-emerald-500/20', 'border-[#00FF41]/20'))}>
                                  {getResultIcon(j.result)}
                              </div>
                              <div>
                                  <div className="flex items-center gap-2">
                                      <h3 className="font-bold font-mono text-white text-lg tracking-wider">{j.pair.toUpperCase()}</h3>
                                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#222] text-[#888] border border-[#333]">{j.session}</span>
                                  </div>
                                  <p className="text-xs text-[#555] mt-1 font-mono">{format(j.date, 'yyyy-MM-dd HH:mm')}</p>
                              </div>
                          </div>
                          
                          <div className="flex flex-col md:items-end w-full md:w-auto border-t md:border-t-0 border-[#222] pt-3 md:pt-0">
                              <div className="text-xs font-mono uppercase text-[#888] mb-1">
                                  Setup: <span className="text-[#DDD]">{j.setup}</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono">
                                 <div className="text-[#555]">P/L: <span className={cn("font-bold ml-1 tracking-wider text-sm", j.pnl && j.pnl > 0 ? "text-[#00FF41]" : j.pnl && j.pnl < 0 ? "text-rose-500" : "text-[#888]")}>
                                    ${j.pnl || 0}
                                 </span></div>
                                 {j.tags.length > 0 && (
                                    <div className="text-[#555] truncate max-w-[150px]">
                                       {j.tags.map(t => `#${t}`).join(' ')}
                                    </div>
                                 )}
                              </div>
                          </div>
    
                          <div className="absolute top-4 right-4 md:relative md:top-0 md:right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => deleteJournal(j.id)} className="p-2 text-[#555] hover:text-rose-500 border border-transparent hover:border-rose-500/30 hover:bg-rose-500/10 rounded-lg transition-colors">
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </motion.div>
                  ))}
              </div>
          )
      ) : (
          <div className="flex-1 flex flex-col bg-[#0A0A0A]/50 backdrop-blur-md border border-white/5 rounded-xl overflow-hidden shadow-lg mb-4">
              {/* Calendar Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/5 bg-[#111]/60">
                 <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 bg-[#222] hover:bg-[#333] text-white rounded-full transition-colors"><ChevronLeft size={20}/></button>
                 <div className="text-center">
                    <h2 className="text-lg font-bold text-white tracking-widest uppercase">{format(currentMonth, 'MMMM yyyy', { locale: id })}</h2>
                    <p className="text-xs text-[#00FF41] font-mono mt-0.5 tracking-wider">MONTHLY JOURNAL • {journals.filter(j => isSameMonth(new Date(j.date), currentMonth)).length} ENTRIES</p>
                 </div>
                 <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 bg-[#222] hover:bg-[#333] text-white rounded-full transition-colors"><ChevronRight size={20}/></button>
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 border-b border-[#222] bg-[#050505] text-[10px] font-bold text-[#888] tracking-widest uppercase">
                  {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(day => (
                      <div key={day} className="py-2 text-center border-r border-[#222] last:border-r-0">{day}</div>
                  ))}
              </div>
              
              <div className="flex-1 grid grid-cols-7 grid-rows-5 font-mono bg-[#111]">
                  {daysInMonth.map((day, i) => {
                      const dayJournals = getJournalsForDay(day);
                      const isCurrentMonth = isSameMonth(day, currentMonth);
                      
                      let resultLabel = "No Trade";
                      let resultClass = "text-[#555]";
                      let bgClass = "bg-[#111]";
                      
                      if (dayJournals.length > 0) {
                          if (dayJournals.length === 1) {
                              const res = dayJournals[0].result;
                              if(res === 'Win') { resultLabel = 'Win'; resultClass = 'text-[#00FF41] font-bold'; bgClass = 'bg-[#00FF41]/5'; }
                              else if(res === 'Loss') { resultLabel = 'Loss'; resultClass = 'text-rose-500 font-bold'; bgClass = 'bg-rose-500/5'; }
                              else if(res === 'BE') { resultLabel = 'BE'; resultClass = 'text-amber-500 font-bold'; bgClass = 'bg-amber-500/5'; }
                              else { resultLabel = 'Entry'; resultClass = 'text-white font-bold'; }
                          } else {
                              resultLabel = `${dayJournals.length} Jurnal`;
                              resultClass = 'text-[#00FF41] font-bold';
                              bgClass = 'bg-[#00FF41]/10';
                          }
                      }
                      
                      return (
                          <div 
                              key={day.toISOString()} 
                              onClick={() => {
                                  if (dayJournals.length > 0) {
                                      setSearch(format(day, 'yyyy-MM-dd'));
                                      setViewMode('list');
                                  }
                              }}
                              className={cn("border-r border-b border-[#222] p-2 flex flex-col relative transition-colors cursor-pointer hover:bg-[#222]", !isCurrentMonth && "opacity-30", bgClass)}
                          >
                              <span className={cn("text-xs font-bold mb-1", isCurrentMonth ? "text-white" : "text-[#555]", isToday(day) && "text-[#00FF41]")}>{format(day, 'd')}</span>
                              <span className={cn("text-[10px] uppercase mt-auto truncate", resultClass)}>{resultLabel}</span>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      <AddJournalModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onSave={addJournal} />
      <ViewJournalModal journal={selectedJournal} onClose={() => setSelectedJournal(null)} />
    </div>
  );
};

const AddJournalModal = ({ isOpen, onClose, onSave }: any) => {
    const [pair, setPair] = useState('');
    const [setup, setSetup] = useState('');
    const [session, setSession] = useState<TradeSession>('New York');
    const [result, setResult] = useState<TradeResult>('Win');
    const [pnl, setPnl] = useState('');
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState('');
    const [dateOption, setDateOption] = useState<'today' | 'custom'>('today');
    const [customDate, setCustomDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [chartFile, setChartFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!pair || !setup) return;
        
        let tradeDate = Date.now();
        if (dateOption === 'custom' && customDate) {
            tradeDate = new Date(customDate).getTime();
        }

        await onSave({
            pair, setup, session, result,
            pnl: parseFloat(pnl) || 0,
            notes, tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
            date: tradeDate
        }, chartFile || undefined);
        
        onClose();
        setPair(''); setSetup(''); setPnl(''); setNotes(''); setTags('');
        setDateOption('today'); setCustomDate(format(new Date(), 'yyyy-MM-dd'));
        setChartFile(null);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
         <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]/60">
                <h2 className="text-sm font-bold uppercase tracking-widest text-white">Entri Jurnal Baru</h2>
                <button onClick={onClose} className="text-[#555] hover:text-[#00FF41] transition-colors"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 font-mono">
                <form id="add-jurnal-form" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-[#222] pb-4">
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Tanggal Entry</label>
                            <div className="flex bg-[#111] border border-[#333] rounded overflow-hidden">
                                <button type="button" onClick={() => setDateOption('today')} className={cn("flex-1 px-3 py-2 text-xs font-bold transition-colors", dateOption === 'today' ? "bg-[#00FF41]/20 text-[#00FF41]" : "text-[#888] hover:text-white")}>Hari Ini</button>
                                <button type="button" onClick={() => setDateOption('custom')} className={cn("flex-1 px-3 py-2 text-xs font-bold transition-colors border-l border-[#333]", dateOption === 'custom' ? "bg-[#00FF41]/20 text-[#00FF41]" : "text-[#888] hover:text-white")}>Pilih Tgl</button>
                            </div>
                        </div>
                        {dateOption === 'custom' && (
                            <div>
                                <label className="block text-[10px] uppercase text-[#888] mb-1">Pilih Tanggal</label>
                                <input type="date" value={customDate} onChange={e=>setCustomDate(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41]" />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Pair / Simbol *</label>
                            <input required type="text" value={pair} onChange={e=>setPair(e.target.value.toUpperCase())} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] uppercase transition-colors" placeholder="XAUUSD" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Sesi</label>
                            <select value={session} onChange={e=>setSession(e.target.value as any)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors">
                                <option value="Asia">Asia</option>
                                <option value="London">London</option>
                                <option value="New York">New York</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Setup *</label>
                            <input required type="text" value={setup} onChange={e=>setSetup(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors" placeholder="Liquidity Sweep" />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Tag (koma)</label>
                            <input type="text" value={tags} onChange={e=>setTags(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors" placeholder="fomo, revenge" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Hasil</label>
                            <select value={result} onChange={e=>setResult(e.target.value as any)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors">
                                <option value="Win">Win</option>
                                <option value="Loss">Loss</option>
                                <option value="BE">Break Even</option>
                                <option value="No Entry">No Entry</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">P/L (Nominal)</label>
                            <input type="number" step="0.01" value={pnl} onChange={e=>setPnl(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-[#00FF41] focus:outline-none focus:border-[#00FF41] transition-colors" placeholder="150.50" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-[10px] uppercase text-[#888] mb-1">Evaluasi / Catatan</label>
                        <textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] resize-none transition-colors" placeholder="Catatan entry..." />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase text-[#888] mb-1">Gambar Chart (Opsional)</label>
                        <input type="file" accept="image/*" onChange={e => setChartFile(e.target.files?.[0] || null)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:bg-[#333] file:text-white hover:file:bg-[#444]" />
                    </div>
                </form>
            </div>
            
            <div className="p-4 border-t border-[#222] bg-[#111] flex justify-end gap-3 font-mono">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest text-[#888] hover:text-white hover:bg-[#222] transition-colors border border-transparent hover:border-[#333]">Batal</button>
                <button type="submit" form="add-jurnal-form" className="px-5 py-2 rounded text-xs font-bold uppercase tracking-widest bg-[#00FF41] hover:bg-[#00CC33] text-black transition-colors shadow-[0_0_10px_rgba(0,255,65,0.2)]">Simpan</button>
            </div>
         </motion.div>
      </div>
    );
}

const ViewJournalModal = ({ journal, onClose }: { journal: TradeJournal | null, onClose: () => void }) => {
    const [chartUrl, setChartUrl] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!journal) return;
        getBlob(`j_${journal.id}`).then(blob => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                setChartUrl(url);
            } else {
                setChartUrl(null);
            }
        });
        return () => {
            if (chartUrl) URL.revokeObjectURL(chartUrl);
        };
    }, [journal]);

    if (!journal) return null;

    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col md:p-8">
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }} className="flex-1 w-full max-w-5xl mx-auto bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 flex flex-col md:rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]/80 shrink-0">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold uppercase tracking-widest text-white">{journal.pair}</h2>
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[#222] text-[#888] border border-[#333]">{journal.session}</span>
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded", 
                            journal.result === 'Win' ? 'text-[#00FF41] bg-[#00FF41]/10' : 
                            journal.result === 'Loss' ? 'text-rose-500 bg-rose-500/10' : 
                            'text-amber-500 bg-amber-500/10'
                        )}>{journal.result}</span>
                    </div>
                    <button onClick={onClose} className="text-[#555] hover:text-[#00FF41] transition-colors p-2 bg-[#222] rounded"><X size={18}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col font-mono">
                    <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#222] pb-6">
                        <div>
                            <p className="text-[#555] text-xs uppercase mb-1">Setup</p>
                            <p className="text-white text-lg">{journal.setup}</p>
                        </div>
                        <div className="flex gap-8">
                             <div>
                                <p className="text-[#555] text-xs uppercase mb-1">Date</p>
                                <p className="text-white">{format(journal.date, 'yyyy-MM-dd HH:mm')}</p>
                            </div>
                            <div>
                                <p className="text-[#555] text-xs uppercase mb-1">P/L</p>
                                <p className={cn("text-lg font-bold tracking-wider", journal.pnl && journal.pnl > 0 ? "text-[#00FF41]" : journal.pnl && journal.pnl < 0 ? "text-rose-500" : "text-[#888]")}>${journal.pnl || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mb-6">
                        <p className="text-[#555] text-xs uppercase mb-2">Catatan</p>
                        <div className="bg-[#111] p-4 rounded border border-[#222] text-[#CCC] whitespace-pre-wrap flex-1 min-h-[100px]">
                            {journal.notes || 'Tidak ada catatan.'}
                        </div>
                    </div>

                    {journal.tags && journal.tags.length > 0 && (
                        <div className="mb-6 flex gap-2">
                             {journal.tags.map(t => <span key={t} className="px-2 py-1 bg-[#222] text-[#888] rounded text-[10px] uppercase tracking-widest border border-[#333]">#{t}</span>)}
                        </div>
                    )}

                    <div className="flex-1 flex flex-col min-h-[300px]">
                        <p className="text-[#555] text-xs uppercase mb-2">Gambar Chart</p>
                        <div className="flex-1 bg-[#111] rounded border border-[#222] flex items-center justify-center p-2 relative">
                             {chartUrl ? (
                                 <img src={chartUrl} alt="Chart" className="max-w-full max-h-full object-contain" />
                             ) : (
                                 <div className="text-[#555] text-xs uppercase tracking-widest">Tidak ada chart yang diupload</div>
                             )}
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
      </AnimatePresence>
    );
}

export default Jurnal;
