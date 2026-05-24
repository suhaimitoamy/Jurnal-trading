import React from 'react';
import { useAppContext } from '../store';
import { BarChart2, PieChart, Activity, CheckCircle, XCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const Statistik = () => {
    const { journals } = useAppContext();
    
    const totalWin = journals.filter(j => j.result === 'Win').length;
    const totalLoss = journals.filter(j => j.result === 'Loss').length;
    const totalBe = journals.filter(j => j.result === 'BE').length;
    const totalNoEntry = journals.filter(j => j.result === 'No Entry').length;
    
    const totalTrade = totalWin + totalLoss + totalBe + totalNoEntry;
    const winRate = totalTrade > 0 ? ((totalWin / (totalWin + totalLoss)) * 100).toFixed(1) : '0';
    
    const totalPnl = journals.reduce((acc, j) => acc + (j.pnl || 0), 0);
    const winJournals = journals.filter(j => j.result === 'Win' && j.pnl);
    const lossJournals = journals.filter(j => j.result === 'Loss' && j.pnl);
    
    const avgWin = winJournals.length > 0 ? (winJournals.reduce((acc, j) => acc + (j.pnl || 0), 0) / winJournals.length).toFixed(2) : '0';
    const avgLoss = lossJournals.length > 0 ? (lossJournals.reduce((acc, j) => acc + (j.pnl || 0), 0) / lossJournals.length).toFixed(2) : '0';
    
    const bestTrade = journals.length > 0 ? Math.max(...journals.map(j => j.pnl || -Infinity)) : 0;
    const worstTrade = journals.length > 0 ? Math.min(...journals.map(j => j.pnl || Infinity)) : 0;

    // Insights logic
    const topPair = journals.reduce((acc, j) => {
       acc[j.pair] = (acc[j.pair] || 0) + 1;
       return acc;
    }, {} as Record<string, number>);
    const mostUsedPair = Object.keys(topPair).sort((a,b) => topPair[b] - topPair[a])[0] || '-';

    const StatBox = ({ title, value, icon: Icon, color }: any) => (
        <div className="bg-[#111]/40 backdrop-blur-md border border-white/5 hover:border-white/10 hover:bg-[#111]/60 transition-colors rounded-xl p-5 relative overflow-hidden shadow-lg">
             <div className="flex items-center gap-2 mb-2 relative z-10">
                 <Icon size={16} className={color.replace('text-emerald-500', 'text-[#00FF41]')} />
                 <span className="text-[10px] font-mono tracking-widest uppercase text-[#888]">{title}</span>
             </div>
             <div className={cn("text-2xl font-mono relative z-10", title.includes('Net P/L') ? color.replace('text-emerald-500', 'text-[#00FF41]') : 'text-white')}>{value}</div>
             <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 opacity-5 blur-xl pointer-events-none", color.replace('text-', 'bg-'))}></div>
             <div className="absolute top-0 right-0 w-8 h-8 opacity-[0.03]">
                 <Icon size={40} className="text-white" />
             </div>
        </div>
    );

    return (
        <div className="h-full overflow-y-auto pb-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2"><BarChart2 className="text-[#00FF41]" /> Statistik Performa</h1>
                <p className="text-sm font-mono text-[#888] mt-1">PERFORMANCE_ANALYSIS // Local data insights</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatBox title="Win Rate" value={`${winRate}%`} icon={Activity} color="text-amber-500" />
                <StatBox title="Net P/L" value={`$${totalPnl.toFixed(2)}`} icon={totalPnl >= 0 ? TrendingUp : TrendingDown} color={totalPnl >= 0 ? 'text-[#00FF41]' : 'text-rose-500'} />
                <StatBox title="Total Trades" value={totalTrade} icon={PieChart} color="text-blue-500" />
                <StatBox title="Pair Favorit" value={mostUsedPair} icon={BarChart2} color="text-purple-500" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-2xl p-6 relative overflow-hidden shadow-lg hover:border-white/10 transition-colors">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[50px] pointer-events-none"></div>
                    <h2 className="text-[10px] font-bold tracking-widest text-[#555] uppercase mb-4 border-b border-white/5 pb-2 relative z-10">Metrik Rata-rata</h2>
                    <div className="space-y-4 font-mono relative z-10">
                        <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm p-3 rounded border border-white/5 hover:bg-[#111]/60 transition-colors">
                            <span className="text-[#888] text-xs">AVERAGE WIN</span>
                            <span className="text-[#00FF41] font-bold">${avgWin}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm p-3 rounded border border-white/5 hover:bg-[#111]/60 transition-colors">
                            <span className="text-[#888] text-xs">AVERAGE LOSS</span>
                            <span className="text-rose-500 font-bold">${avgLoss}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm p-3 rounded border border-white/5 hover:bg-[#111]/60 transition-colors">
                            <span className="text-[#888] text-xs">BEST TRADE</span>
                            <span className="text-blue-400 font-bold">${bestTrade === -Infinity ? 0 : bestTrade}</span>
                        </div>
                        <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm p-3 rounded border border-white/5 hover:bg-[#111]/60 transition-colors">
                            <span className="text-[#888] text-xs">WORST TRADE</span>
                            <span className="text-rose-500 font-bold">${worstTrade === Infinity ? 0 : worstTrade}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-[#00FF41]/20 rounded-2xl p-6 relative overflow-hidden shadow-lg hover:border-[#00FF41]/30 transition-colors">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF41]/10 rounded-full blur-[50px] pointer-events-none"></div>
                     <h2 className="text-[10px] font-bold tracking-widest text-[#00FF41] uppercase mb-4 border-b border-[#00FF41]/20 pb-2 relative z-10">Insight AI</h2>
                     <div className="space-y-3 font-sans relative z-10">
                         <div className="p-4 bg-[#111]/40 backdrop-blur-sm border border-white/5 rounded-lg flex gap-3 text-sm shadow-sm relative overflow-hidden hover:bg-[#111]/60 transition-colors">
                             <div className="absolute left-0 top-0 w-1 h-full bg-[#00FF41] opacity-60"></div>
                             <CheckCircle className="text-[#00FF41] shrink-0 mt-0.5" size={16} />
                             <p className="text-[#DDD]">Bagus! Pair <span className="font-mono text-white tracking-wider">{mostUsedPair}</span> adalah instrumen yang paling sering Anda transaksikan.</p>
                         </div>
                         <div className="p-4 bg-[#111]/40 backdrop-blur-sm border border-white/5 rounded-lg flex gap-3 text-sm shadow-sm relative overflow-hidden hover:bg-[#111]/60 transition-colors">
                             <div className="absolute left-0 top-0 w-1 h-full bg-amber-500 opacity-60"></div>
                             <TrendingDown className="text-amber-500 shrink-0 mt-0.5" size={16} />
                             <p className="text-[#DDD]">Anda memiliki rata-rata loss sebesar <span className="font-mono text-white tracking-wider">${avgLoss}</span>. Pastikan risk:reward ratio Anda tetap terjaga dengan baik.</p>
                         </div>
                         <div className="p-4 bg-[#111]/40 backdrop-blur-sm border border-white/5 rounded-lg flex gap-3 text-sm shadow-sm relative overflow-hidden hover:bg-[#111]/60 transition-colors">
                             <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 opacity-60"></div>
                             <PieChart className="text-blue-500 shrink-0 mt-0.5" size={16} />
                             <p className="text-[#DDD]">Jumlah No Entry Anda adalah <span className="font-mono text-white tracking-wider">{totalNoEntry}</span>. Mengindikasikan kesabaran yang baik dalam menunggu konfirmasi.</p>
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
}

export default Statistik;
