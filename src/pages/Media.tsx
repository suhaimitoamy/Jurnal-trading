import React, { useState, useMemo } from 'react';
import { useAppContext } from '../store';
import { Material } from '../types';
import { Image as ImageIcon, Video as VideoIcon, PlayCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import Viewer from '../components/Viewer';

const Media = () => {
    const { materials, updateMaterial } = useAppContext();
    const [filter, setFilter] = useState<'All' | 'Gambar' | 'Video'>('All');
    const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);

    const mediaList = useMemo(() => {
        return materials.filter(m => 
            (m.type === 'Gambar' || m.type === 'Video') && 
            m.status !== 'Arsip' &&
            (filter === 'All' || m.type === filter)
        ).sort((a,b) => b.createdAt - a.createdAt);
    }, [materials, filter]);

    const toggleStatus = (id: string, newStatus: any) => {
        updateMaterial(id, { status: newStatus });
        if (activeMaterial && activeMaterial.id === id) {
            setActiveMaterial({...activeMaterial, status: newStatus});
        }
    };

    return (
        <div className="h-full flex flex-col pt-2 pb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                   <h1 className="text-2xl font-bold text-white uppercase tracking-wider">Media Galeri</h1>
                   <p className="text-sm font-mono text-[#888]">MEDIA_ASSETS // Local binary datastore</p>
                </div>
                
                <div className="flex bg-[#111] border border-[#222] rounded-lg p-1 font-mono">
                    <button onClick={() => setFilter('All')} className={cn("px-4 py-1.5 text-[10px] tracking-widest uppercase font-bold rounded-md transition-colors", filter === 'All' ? 'bg-[#00FF41]/10 text-white border-b-2 border-[#00FF41]' : 'text-[#888] hover:text-white')}>ALL</button>
                    <button onClick={() => setFilter('Gambar')} className={cn("px-4 py-1.5 text-[10px] tracking-widest uppercase font-bold rounded-md transition-colors flex items-center gap-1", filter === 'Gambar' ? 'bg-[#00FF41]/10 text-white border-b-2 border-[#00FF41]' : 'text-[#888] hover:text-white')}><ImageIcon size={14}/> GAMBAR</button>
                    <button onClick={() => setFilter('Video')} className={cn("px-4 py-1.5 text-[10px] tracking-widest uppercase font-bold rounded-md transition-colors flex items-center gap-1", filter === 'Video' ? 'bg-[#00FF41]/10 text-white border-b-2 border-[#00FF41]' : 'text-[#888] hover:text-white')}><VideoIcon size={14}/> VIDEO</button>
                </div>
            </div>

            {mediaList.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#111] rounded-2xl border border-[#222] border-dashed">
                    <ImageIcon size={48} className="text-[#333] mb-4" />
                    <p className="text-[#888] text-sm font-mono uppercase">STORAGE_EMPTY // No rich media found</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto pb-4">
                    {mediaList.map(m => (
                        <div 
                            key={m.id} 
                            onClick={() => setActiveMaterial(m)}
                            className="bg-[#111] border border-[#222] rounded-xl overflow-hidden cursor-pointer group hover:border-[#00FF41]/50 transition-colors flex flex-col h-48 shadow-lg"
                        >
                            <div className="bg-[#050505] flex-1 flex items-center justify-center relative overflow-hidden">
                                {m.type === 'Video' ? (
                                    <>
                                        <div className="absolute inset-0 bg-black flex items-center justify-center transition-transform group-hover:scale-105">
                                            <VideoIcon size={40} className="text-[#333]" />
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-colors">
                                            <PlayCircle size={48} className="text-white/80 group-hover:text-[#00FF41] group-hover:scale-110 transition-all shadow-lg" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full bg-[#0A0A0A] flex items-center justify-center relative">
                                       <ImageIcon size={40} className="text-[#333] group-hover:text-[#555] transition-colors z-10" />
                                    </div>
                                )}
                            </div>
                            <div className="p-3 border-t border-[#222] bg-[#111]">
                                <h3 className="text-xs font-bold text-white truncate">{m.title}</h3>
                                <p className="text-[10px] text-[#00FF41] font-mono mt-1 uppercase tracking-widest">{m.type}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeMaterial && (
                <Viewer 
                    material={activeMaterial}
                    onClose={() => setActiveMaterial(null)}
                    onToggleStatus={toggleStatus}
                />
            )}
        </div>
    );
}

export default Media;
