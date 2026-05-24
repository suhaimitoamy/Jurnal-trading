import React from 'react';
import { useAppContext } from '../store';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';

const Arsip = () => {
    const { materials, updateMaterial, deleteMaterial } = useAppContext();
    const archivedMaterials = materials.filter(m => m.status === 'Arsip');

    return (
        <div className="h-full overflow-y-auto pb-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-2"><Archive className="text-[#888]" /> Arsip Materi</h1>
                <p className="text-sm font-mono text-[#888] mt-1">ARCHIVE // Soft-deleted items</p>
            </div>

            {archivedMaterials.length === 0 ? (
                 <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#111] rounded-2xl border border-[#222] border-dashed min-h-[300px]">
                    <Archive size={48} className="text-[#333] mb-4" />
                    <p className="text-[#888] text-sm font-mono uppercase">ARCHIVE_EMPTY // No items found</p>
                 </div>
            ) : (
                <div className="space-y-3">
                    {archivedMaterials.map(m => (
                        <div key={m.id} className="bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between group">
                            <div className="flex flex-col">
                                <h3 className="font-bold text-white text-sm">{m.title}</h3>
                                <div className="flex items-center gap-2 mt-1 font-mono">
                                    <span className="text-[10px] text-[#555] uppercase tracking-widest px-1.5 py-0.5 border border-[#333] rounded bg-[#222]">{m.type}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => updateMaterial(m.id, { status: 'Belum dibaca' })}
                                    className="p-2 text-[#00FF41] hover:bg-[#00FF41]/10 border border-transparent hover:border-[#00FF41]/30 rounded transition-colors"
                                    title="Pulihkan"
                                >
                                    <RotateCcw size={16} />
                                </button>
                                <button 
                                    onClick={() => {
                                        if (confirm(`PURGE materi "${m.title}"?`)) {
                                            deleteMaterial(m.id);
                                        }
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 rounded transition-colors"
                                    title="Hapus Permanen"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Arsip;
