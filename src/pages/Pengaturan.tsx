import React from 'react';
import { useAppContext } from '../store';
import { HardDriveDownload, HardDriveUpload, Trash2, Key } from 'lucide-react';
import { exportDataJson, importDataJson } from '../lib/db';

const Pengaturan = () => {
    const handleExport = async () => {
        try {
            const data = await exportDataJson();
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trading_library_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            alert('Backup berhasil didownload.');
        } catch(e) {
            alert('Gagal membuat backup');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(!file) return;
        
        if(!confirm('Restore akan menimpa data yang ada (merge tidak disupport sepenuhnya di demo ini). Lanjut?')) return;
        
        try {
            const text = await file.text();
            await importDataJson(text);
            alert('Restore berhasil. Silakan muat ulang aplikasi.');
            window.location.reload();
        } catch(err) {
            alert('Gagal memulihkan backup.');
        }
    };

    return (
        <div className="h-full overflow-y-auto pb-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Pengaturan</h1>
                <p className="text-sm font-mono text-[#888] mt-1">CONFIG // Local storage & privacy</p>
            </div>

            <div className="space-y-6 max-w-2xl font-mono">
                <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-lg hover:border-white/10 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-80"></div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-blue-500/5 blur-3xl pointer-events-none"></div>
                    <h2 className="text-sm font-bold tracking-widest uppercase text-white mb-4 flex items-center gap-2 relative z-10">
                        <HardDriveDownload size={18} className="text-blue-500" />
                        Backup & Restore
                    </h2>
                    <p className="text-xs text-[#888] mb-6 relative z-10">Backup seluruh jurnal, catatan materi, dan aktivitas ke file JSON. Blob/Media saat ini dikecualikan untuk menjaga efisiensi I/O.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 relative z-10">
                        <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-[#111]/40 backdrop-blur-sm hover:bg-[#222]/60 text-white border border-white/5 hover:border-blue-500/50 px-4 py-3 rounded text-xs font-bold tracking-widest uppercase transition-colors">
                            <HardDriveDownload size={16} />
                            Export Data
                        </button>
                        <label className="flex-1 flex items-center justify-center gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 px-4 py-3 rounded text-xs font-bold tracking-widest uppercase transition-colors cursor-pointer">
                            <HardDriveUpload size={16} />
                            Restore Data
                            <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                        </label>
                    </div>
                </div>

                <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-lg hover:border-white/10 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF41] opacity-80"></div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-[#00FF41]/5 blur-3xl pointer-events-none"></div>
                    <h2 className="text-sm font-bold tracking-widest uppercase text-white mb-4 flex items-center gap-2 relative z-10">
                        <Key size={18} className="text-[#00FF41]" />
                        Pengaturan API AI
                    </h2>
                    <p className="text-xs text-[#888] mb-6 relative z-10">Masukkan API Key agar Asisten AI dapat berfungsi (disimpan secara lokal). Provider default: Gemini.</p>
                    
                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">API Key</label>
                            <input 
                                type="password" 
                                defaultValue={localStorage.getItem('ai_api_key') || ''}
                                onChange={(e) => localStorage.setItem('ai_api_key', e.target.value)}
                                placeholder="Masukkan API Key..."
                                className="w-full bg-[#111]/40 backdrop-blur-sm border border-white/5 rounded px-4 py-3 text-sm text-[#00FF41] focus:outline-none focus:border-[#00FF41] transition-colors shadow-inner"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-xl p-6 relative overflow-hidden shadow-lg hover:border-white/10 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 opacity-80"></div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-amber-500/5 blur-3xl pointer-events-none"></div>
                    <h2 className="text-sm font-bold tracking-widest uppercase text-white mb-4 flex items-center gap-2 relative z-10">
                        <Key size={18} className="text-amber-500" />
                        Privasi & Autentikasi
                    </h2>
                    <p className="text-xs text-[#888] mb-6 relative z-10">Enkripsi PIN lokal (Simulated/MocK). Mengamankan terminal saat idle.</p>
                    
                    <button className="flex items-center justify-center gap-2 bg-[#111]/40 backdrop-blur-sm border border-white/5 hover:border-amber-500/50 hover:bg-[#222]/60 text-white px-4 py-3 rounded text-xs font-bold tracking-widest uppercase transition-colors relative z-10">
                        Set Active PIN
                    </button>
                </div>

                <div className="bg-[#111]/40 backdrop-blur-md border border-rose-900/50 rounded-xl p-6 relative overflow-hidden shadow-lg hover:border-rose-900 transition-colors">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-500 opacity-80"></div>
                    <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-32 bg-rose-500/5 blur-3xl pointer-events-none"></div>
                    <h2 className="text-sm font-bold tracking-widest uppercase text-rose-500 mb-4 flex items-center gap-2 relative z-10">
                        <Trash2 size={18} />
                        Purge Storage
                    </h2>
                    <p className="text-xs text-[#888] mb-6 font-sans">Menghapus SELURUH data lokal (Database, Preferensi, Media, dan Jurnal). Tindakan ini tidak dapat dibatalkan.</p>
                    
                    <button onClick={()=>{
                        if(confirm('WARNING: Yakin ingin PURGE seluruh data workspace secara permanen?')) {
                            localStorage.clear();
                            alert('Local data purged. Restarting...');
                            window.location.reload();
                        }
                    }} className="flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 px-4 py-3 rounded text-xs font-bold tracking-widest uppercase transition-colors">
                        Purge Workspace
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Pengaturan;
