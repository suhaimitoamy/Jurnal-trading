import React from 'react';
import { useAppContext } from '../store';
import { FileText, Video, Image, File, CheckCircle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const Dashboard = () => {
  const { materials, journals } = useAppContext();

  const totalVideo = materials.filter(m => m.type === 'Video').length;
  const totalPdf = materials.filter(m => m.type === 'PDF').length;
  const totalImg = materials.filter(m => m.type === 'Gambar').length;
  const totalDoc = materials.filter(m => ['Word','Excel','PowerPoint','TXT','Markdown'].includes(m.type)).length;
  
  const read = materials.filter(m => m.status === 'Selesai').length;
  const unread = materials.filter(m => m.status === 'Belum dibaca').length;

  const totalWin = journals.filter(j => j.result === 'Win').length;
  const totalLoss = journals.filter(j => j.result === 'Loss').length;
  const totalBe = journals.filter(j => j.result === 'BE').length;
  const totalNoEntry = journals.filter(j => j.result === 'No Entry').length;
  
  const totalTrade = totalWin + totalLoss + totalBe + totalNoEntry;
  const winRate = totalTrade > 0 ? Math.round((totalWin / (totalWin + totalLoss)) * 100) || 0 : 0;
  const totalPnl = journals.reduce((acc, j) => acc + (j.pnl || 0), 0);

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className="bg-[#111]/60 backdrop-blur-md border border-white/5 rounded-xl p-5 flex flex-col gap-3 relative overflow-hidden group shadow-lg"
    >
      <div className={cn("absolute top-0 left-0 w-1 h-full opacity-40", color.replace('text-', 'bg-'))}></div>
      <div className={cn("absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 opacity-[0.03] blur-xl pointer-events-none transition-all group-hover:opacity-[0.1]", color.replace('text-', 'bg-'))}></div>
      <div className="flex items-center justify-between z-10 relative">
        <h3 className="text-[10px] text-[#888] uppercase tracking-widest">{title}</h3>
        <Icon size={16} className={cn("opacity-50", color)} />
      </div>
      <div className="z-10 relative">
        <div className={cn("text-2xl font-mono mt-1", title.includes('Win Rate') ? color : 'text-white')}>{value}</div>
        {subtitle && <div className={cn("text-[10px] mt-2", color)}>{subtitle}</div>}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-wider text-white uppercase mb-1">Status Workspace</h1>
        <p className="text-[#888] text-sm font-mono">SYSTEM_SUMMARY // Metrics tracking online</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Win Rate" value={`${winRate}%`} subtitle={`${totalWin} Win / ${totalLoss} Loss`} icon={CheckCircle} color="text-[#00FF41]" />
        <StatCard title="Total PnL" value={`$${totalPnl.toFixed(2)}`} subtitle={`Dari ${totalTrade} trade tercatat`} icon={BarChart2Icon} color={totalPnl >= 0 ? "text-[#00FF41]" : "text-rose-500"} />
        <StatCard title="Materi Selesai" value={read} subtitle={`Dari total ${materials.length} materi`} icon={FileText} color="text-blue-400" />
        <StatCard title="Belum Dibaca" value={unread} subtitle="Menunggu dipelajari" icon={Clock} color="text-yellow-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF41]/5 rounded-full blur-[50px] pointer-events-none"></div>
          <h2 className="text-xs font-bold tracking-wider text-[#00FF41] uppercase mb-4 border-b border-white/5 pb-2 relative z-10">Komposisi Library</h2>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="flex items-center gap-2 text-white text-sm"><Video size={16} className="text-purple-400"/> Video Trading</span>
              <span className="font-mono text-[#00FF41]">{totalVideo}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="flex items-center gap-2 text-white text-sm"><FileText size={16} className="text-blue-400"/> PDF / Buku</span>
              <span className="font-mono text-[#00FF41]">{totalPdf}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="flex items-center gap-2 text-white text-sm"><Image size={16} className="text-pink-400"/> Gambar / Screenshot</span>
              <span className="font-mono text-[#00FF41]">{totalImg}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="flex items-center gap-2 text-white text-sm"><File size={16} className="text-[#888]"/> Dokumen Lain</span>
              <span className="font-mono text-[#00FF41]">{totalDoc}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 shadow-2xl rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/5 rounded-full blur-[50px] pointer-events-none"></div>
          <h2 className="text-xs font-bold tracking-wider text-blue-400 uppercase mb-4 border-b border-white/5 pb-2 relative z-10">Ringkasan Statistik Trade</h2>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="text-white text-sm">Total Eksekusi Win</span>
              <span className="font-mono text-[#00FF41]">{totalWin}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="text-white text-sm">Total Eksekusi Loss</span>
              <span className="font-mono text-rose-500">{totalLoss}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="text-white text-sm">Total Break Even</span>
              <span className="font-mono text-amber-500">{totalBe}</span>
            </div>
            <div className="flex justify-between items-center bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:bg-[#111]/60 transition-colors p-3 rounded-lg">
              <span className="text-[#888] text-sm">No Entry</span>
              <span className="font-mono text-[#555]">{totalNoEntry}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BarChart2Icon = ({size, className}:any) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>);

export default Dashboard;
