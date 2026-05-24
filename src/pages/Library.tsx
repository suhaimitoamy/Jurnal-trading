import React, { useState, useMemo, useRef } from 'react';
import { useAppContext } from '../store';
import { Material, MaterialStatus, MaterialType, Folder } from '../types';
import { Search, Plus, Filter, SortDesc, MoreVertical, FileText, Image, Video, File as FileIcon, X, Folder as FolderIcon, ChevronRight, Edit2, Trash2, Scan } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import Viewer from '../components/Viewer';
import { v4 as uuidv4 } from 'uuid';

const Library = () => {
  const { materials, folders, addMaterial, bulkAddMaterials, updateMaterial, deleteMaterial, addFolder, updateFolder, deleteFolder } = useAppContext();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<MaterialType | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<MaterialStatus | 'All'>('All');
  
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);
  
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [activeMaterial, setActiveMaterial] = useState<Material | null>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{current: number, total: number} | null>(null);

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleScanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const itemsToUpload = [];

      for (const file of files) {
        let type: MaterialType = 'Catatan manual';
        const mime = file.type;
        if (mime.startsWith('image/')) type = 'Gambar';
        else if (mime.startsWith('video/')) type = 'Video';
        else if (mime.includes('pdf')) type = 'PDF';
        else type = 'Catatan manual'; // Default fallback

        itemsToUpload.push({
           material: {
              title: file.name,
              description: 'Diimpor otomatis dari scan storage',
              categoryId: 'uncategorized',
              subcategoryId: 'none',
              tags: ['scan-import'],
              status: 'Belum dibaca' as MaterialStatus,
              type,
              folderId: currentFolderId || undefined,
              createdAt: Date.now(),
              fileName: file.name
           },
           blob: file
        });
      }

      await bulkAddMaterials(itemsToUpload, (current, total) => {
        setUploadProgress({ current, total });
      });
      alert(`Berhasil mengimpor ${itemsToUpload.length} file dari storage! File-file ini sekarang tersimpan secara lokal di aplikasi dan Anda bisa menghapus aslinya jika mau.`);
    } catch (err: any) {
      alert(`Terjadi kesalahan saat import: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (scanInputRef.current) scanInputRef.current.value = '';
    }
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    setIsUploading(true);
    try {
      const folderIdsByName = new Map<string, string>();
      // Pre-fill with existing folders
      for (const f of folders) {
        folderIdsByName.set(f.name.toLowerCase(), f.id);
      }

      const itemsToUpload = [];

      for (const file of files) {
        // webkitRelativePath usually is "FolderName/Subfolder/file.ext"
        // We will just pick the root folder name.
        const pathParts = file.webkitRelativePath.split('/');
        let targetFolderId = currentFolderId || undefined;
        let folderName = pathParts.length > 1 ? pathParts[0] : null;

        if (folderName) {
           const normName = folderName.toLowerCase();
           if (!folderIdsByName.has(normName)) {
               // Create the folder
               const newId = await addFolder({ name: folderName });
               folderIdsByName.set(normName, newId);
           }
           targetFolderId = folderIdsByName.get(normName);
        }

        let type: MaterialType = 'Catatan manual';
        const mime = file.type;
        if (mime.startsWith('image/')) type = 'Gambar';
        else if (mime.startsWith('video/')) type = 'Video';
        else if (mime.includes('pdf')) type = 'PDF';
        else type = 'Catatan manual'; // Default fallback

        itemsToUpload.push({
           material: {
              title: file.name,
              description: 'Diimpor otomatis dari folder: ' + (folderName || 'ROOT'),
              categoryId: 'uncategorized',
              subcategoryId: 'none',
              tags: ['bulk-import'],
              status: 'Belum dibaca' as MaterialStatus,
              type,
              folderId: targetFolderId,
              createdAt: Date.now(),
              fileName: file.name
           },
           blob: file
        });
      }

      await bulkAddMaterials(itemsToUpload, (current, total) => {
        setUploadProgress({ current, total });
      });
      alert(`Berhasil mengimpor ${itemsToUpload.length} file dan membuat struktur foldernya!`);
    } catch (err: any) {
      alert(`Terjadi kesalahan saat upload bulk: ${err.message}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (bulkInputRef.current) bulkInputRef.current.value = '';
    }
  };

  const filteredFolders = useMemo(() => {
     if (currentFolderId !== null) return []; // Hide folders if inside a folder for flat structure
     if (search) return folders.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
     return folders;
  }, [folders, currentFolderId, search]);

  const handleToggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Yakin ingin menghapus ${selectedIds.length} materi terpilih?`)) {
      for (const id of selectedIds) {
         await deleteMaterial(id);
      }
      setSelectedIds([]);
      setIsSelectionMode(false);
    }
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchFolder = m.folderId === currentFolderId || (!m.folderId && currentFolderId === null);
      if(!matchFolder && search === '') return false; // if searching, we search all folders

      const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
      const matchType = filterType === 'All' || m.type === filterType;
      const matchStatus = filterStatus === 'All' || m.status === filterStatus;
      
      if (search !== '') {
          return matchSearch && matchType && matchStatus && m.status !== 'Arsip';
      }
      return matchFolder && matchSearch && matchType && matchStatus && m.status !== 'Arsip';
    }).sort((a,b) => b.createdAt - a.createdAt);
  }, [materials, currentFolderId, search, filterType, filterStatus]);

  const toggleStatus = (id: string, newStatus: MaterialStatus) => {
    updateMaterial(id, { status: newStatus });
    if (activeMaterial && activeMaterial.id === id) {
        setActiveMaterial({...activeMaterial, status: newStatus});
    }
  };

  const getIcon = (type: MaterialType) => {
    if (type === 'Video') return <Video size={20} className="text-purple-400" />;
    if (type === 'Gambar') return <Image size={20} className="text-blue-400" />;
    if (['PDF', 'Word', 'TXT', 'Markdown', 'Catatan manual'].includes(type)) return <FileText size={20} className="text-emerald-400" />;
    return <FileIcon size={20} className="text-slate-400" />;
  };

  const currentFolder = folders.find(f => f.id === currentFolderId);

  return (
    <div className="h-full flex flex-col pt-2 pb-6 relative">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider mb-1">Library</h1>
          <p className="text-sm font-mono text-[#888]">{materials.length} TOTAL ITEMS // LOCAL STORAGE</p>
        </div>
        
        <div className="flex items-center gap-2">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555]" size={18} />
              <input 
                 type="text" 
                 placeholder="Search everywhere..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="w-full bg-[#111]/40 backdrop-blur-sm border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-[#00FF41]/50 transition-colors font-mono shadow-inner"
              />
           </div>
           
           <button onClick={() => { setFolderToEdit(null); setFolderModalOpen(true); }} className="flex items-center gap-2 bg-[#111] hover:bg-[#222] text-[#888] hover:text-white border border-[#222] hover:border-[#00FF41]/50 px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors">
              <FolderIcon size={18} />
              <span className="hidden md:inline">Folder Baru</span>
           </button>
           
           <button onClick={() => scanInputRef.current?.click()} disabled={isUploading} className="flex flex-col items-center justify-center gap-1 bg-[#111] hover:bg-[#222] text-[#00FF41] hover:text-white border border-[#00FF41]/30 hover:border-[#00FF41] px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap min-w-[150px] relative overflow-hidden shadow-[0_0_10px_rgba(0,255,65,0.1)]">
              <div className="flex items-center gap-2 z-10">
                <Scan size={18} />
                <span className={isUploading ? "" : "hidden md:inline"}>{isUploading && uploadProgress ? `Scanning... ${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` : 'Scan Storage (HP)'}</span>
              </div>
              {isUploading && uploadProgress && (
                 <div className="absolute left-0 bottom-0 h-1 bg-[#00FF41] transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
              )}
           </button>
           <input type="file" ref={scanInputRef} className="hidden" multiple accept="image/*,video/*,application/pdf,text/*" onChange={handleScanUpload} />

           <button onClick={() => bulkInputRef.current?.click()} disabled={isUploading} className="flex flex-col items-center justify-center gap-1 bg-[#111] hover:bg-[#222] text-[#888] hover:text-[#00FF41] border border-[#222] hover:border-[#00FF41]/50 px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap min-w-[150px] relative overflow-hidden">
              <div className="flex items-center gap-2 z-10">
                <FolderIcon size={18} />
                <span className={isUploading ? "" : "hidden md:inline"}>{isUploading && uploadProgress ? `Uploading... ${Math.round((uploadProgress.current / uploadProgress.total) * 100)}%` : 'Upload Folder (PC)'}</span>
              </div>
              {isUploading && uploadProgress && (
                 <div className="absolute left-0 bottom-0 h-1 bg-[#00FF41] transition-all duration-300" style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}></div>
              )}
           </button>
           <input type="file" ref={bulkInputRef} className="hidden" multiple {...{webkitdirectory: "true", directory: "true"} as any} onChange={handleBulkUpload} />

           <button onClick={() => setAddModalOpen(true)} className="flex items-center gap-2 bg-[#00FF41] hover:bg-[#00CC33] text-black px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors shadow-[0_0_15px_rgba(0,255,65,0.3)]">
              <Plus size={18} />
              <span className="hidden md:inline">Tambah</span>
           </button>
           <button onClick={() => setIsSelectionMode(!isSelectionMode)} className={cn("hidden md:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold tracking-widest uppercase transition-colors", isSelectionMode ? "bg-rose-500/20 text-rose-500 border border-rose-500/50" : "bg-[#111] hover:bg-[#222] text-[#888] hover:text-white border border-[#222] hover:border-white/20")}>
              {isSelectionMode ? 'Batal Pilih' : 'Pilih Multiple'}
           </button>
        </div>
      </div>

      {isSelectionMode && (
          <div className="flex items-center justify-between mb-4 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl overflow-x-auto gap-4">
             <span className="text-sm text-rose-500 font-mono font-bold tracking-widest uppercase whitespace-nowrap">{selectedIds.length} Terpilih</span>
             <div className="flex items-center gap-2">
                <button onClick={() => {
                    if (selectedIds.length === filteredMaterials.length) setSelectedIds([]);
                    else setSelectedIds(filteredMaterials.map(m => m.id));
                }} className="bg-[#111] hover:bg-[#222] text-[#00FF41] border border-[#00FF41]/30 px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap">
                    {selectedIds.length === filteredMaterials.length ? 'Batal Semua' : 'Pilih Semua'}
                </button>
                <button onClick={handleBulkDelete} disabled={selectedIds.length === 0} className="bg-rose-500 hover:bg-rose-600 disabled:bg-[#333] text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap">Hapus Terpilih</button>
                <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="bg-[#222] hover:bg-[#333] text-[#888] hover:text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-widest transition-colors whitespace-nowrap">Batal</button>
             </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 scrollbar-none font-mono">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#888]">
              <button onClick={() => setCurrentFolderId(null)} className={cn("hover:text-white transition-colors", currentFolderId === null ? "text-[#00FF41]" : "")}>ROOT</button>
              {currentFolder && (
                 <>
                    <ChevronRight size={14} className="text-[#333]"/>
                    <span className="text-white bg-[#111] px-2 py-1 rounded border border-[#222]">{currentFolder.name}</span>
                 </>
              )}
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {['All', 'Video', 'Gambar', 'PDF', 'Catatan manual'].map(t => (
                 <button 
                    key={t}
                    onClick={() => setFilterType(t as any)}
                    className={cn("px-4 py-1.5 rounded-sm text-[10px] uppercase font-bold whitespace-nowrap transition-colors", 
                      filterType === t ? "bg-[#00FF41]/10 text-white border-b-2 border-[#00FF41]" : "bg-[#111] border border-[#222] text-[#888] hover:text-white"
                    )}
                 >
                    {t}
                 </button>
              ))}
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12">
           {/* Render Folders First if any */}
           {filteredFolders.map(f => (
               <div 
                   key={f.id}
                   className="group bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 hover:border-[#00FF41]/50 rounded-xl p-4 flex items-center justify-between transition-all cursor-pointer shadow-lg"
                   onClick={() => setCurrentFolderId(f.id)}
               >
                   <div className="flex items-center gap-3">
                       <div className="p-2.5 bg-[#111] rounded border border-[#222]"><FolderIcon size={20} className="text-[#00FF41]" /></div>
                       <div>
                           <h3 className="text-white font-bold text-sm">{f.name}</h3>
                           <p className="text-[#555] font-mono text-[10px] tracking-widest uppercase">{materials.filter(m => m.folderId === f.id).length} ITEMS</p>
                       </div>
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={(e) => { e.stopPropagation(); setFolderToEdit(f); setFolderModalOpen(true); }} className="p-1.5 text-[#888] hover:text-[#00FF41] hover:bg-[#111] rounded"><Edit2 size={14}/></button>
                       <button onClick={(e) => { e.stopPropagation(); if(confirm('Hapus folder ini? Materi di dalamnya akan pindah ke ROOT.')) deleteFolder(f.id); }} className="p-1.5 text-[#888] hover:text-rose-500 hover:bg-[#111] rounded"><Trash2 size={14}/></button>
                   </div>
               </div>
           ))}

           {/* Render Materials */}
           {filteredMaterials.map(m => (
              <motion.div 
                 key={m.id}
                 layout
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className={cn("group backdrop-blur-md rounded-xl p-4 flex flex-col gap-3 transition-all cursor-pointer relative overflow-hidden shadow-lg", isSelectionMode && selectedIds.includes(m.id) ? "bg-[#00FF41]/10 border-2 border-[#00FF41]" : "bg-[#111]/40 border border-white/5 hover:border-[#00FF41]/50")}
                 onClick={(e) => {
                     if (isSelectionMode) {
                         handleToggleSelection(m.id, e);
                     } else {
                         setActiveMaterial(m);
                     }
                 }}
              >
                  {isSelectionMode && (
                     <div className={cn("absolute top-2 right-2 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors z-10", selectedIds.includes(m.id) ? "bg-[#00FF41] border-[#00FF41]" : "border-white/20 bg-[#111]")}>
                         {selectedIds.includes(m.id) && <span className="text-black text-xs">✓</span>}
                     </div>
                  )}
                  {m.status === 'Selesai' && !isSelectionMode && <div className="absolute top-0 right-0 w-2 h-full bg-[#00FF41]/60 shadow-[0_0_10px_rgba(0,255,65,0.5)]"></div>}
                  {m.status === 'Favorit' && !isSelectionMode && <div className="absolute top-0 right-0 w-2 h-full bg-rose-500/60 shadow-[0_0_10px_rgba(244,63,94,0.5)]"></div>}
                 
                  <div className="flex items-start justify-between gap-2">
                     <div className="p-2.5 bg-[#0A0A0A] rounded border border-[#222]">{getIcon(m.type)}</div>
                     <span className="text-[10px] font-mono px-2 py-1 bg-[#222] text-[#00FF41] rounded-full uppercase tracking-widest border border-[#333]">{m.type}</span>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-semibold text-sm line-clamp-2 leading-tight group-hover:text-[#00FF41] transition-colors">{m.title}</h3>
                    {m.description && <p className="text-[#888] text-xs mt-2 line-clamp-2">{m.description}</p>}
                  </div>
                  
                  <div className="mt-auto pt-3 flex flex-wrap gap-1.5 font-mono">
                     {m.tags.slice(0,3).map(tag => (
                        <span key={tag} className="text-[9px] px-1.5 py-0.5 border border-[#333] text-[#555] rounded uppercase">#{tag}</span>
                     ))}
                     {m.tags.length > 3 && <span className="text-[9px] px-1.5 py-0.5 border border-[#333] text-[#555] rounded uppercase">+{m.tags.length - 3}</span>}
                  </div>
              </motion.div>
           ))}

           {filteredMaterials.length === 0 && filteredFolders.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-[#111] rounded-2xl border border-[#222] border-dashed">
                <FileText size={48} className="text-[#333] mb-4" />
                <p className="text-[#888] font-mono text-sm uppercase">EMPTY_RESULT // No items found here</p>
             </div>
           )}
      </div>

      {/* Add Material Modal */}
      <AddMaterialModal 
          isOpen={addModalOpen} 
          currentFolderId={currentFolderId}
          folders={folders}
          onClose={() => setAddModalOpen(false)} 
          onSave={addMaterial}
      />

      {/* Folder Modal */}
      <FolderModal
          isOpen={folderModalOpen}
          initialFolder={folderToEdit}
          onClose={() => setFolderModalOpen(false)}
          onSave={(name) => {
              if (folderToEdit) {
                  updateFolder(folderToEdit.id, { name });
              } else {
                  addFolder({ name });
              }
              setFolderModalOpen(false);
          }}
      />
      
      {activeMaterial && (
          <Viewer 
             material={activeMaterial}
             allMaterials={filteredMaterials}
             onNavigate={setActiveMaterial}
             onUpdate={updateMaterial}
             onDelete={deleteMaterial}
             onClose={() => setActiveMaterial(null)}
             onToggleStatus={toggleStatus}
          />
      )}
    </div>
  );
};

const FolderModal = ({ isOpen, initialFolder, onClose, onSave }: any) => {
    const [name, setName] = useState('');
    
    React.useEffect(() => {
        if (isOpen) {
            setName(initialFolder ? initialFolder.name : '');
        }
    }, [isOpen, initialFolder]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(name.trim()) onSave(name.trim());
    };

    if(!isOpen) return null;

    return (
      <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
         <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]/60">
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">{initialFolder ? 'Edit Folder' : 'Folder Baru'}</h2>
                <button onClick={onClose} className="text-[#555] hover:text-[#00FF41]"><X size={18}/></button>
            </div>
            <div className="p-6 font-mono">
                <form id="folder-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase text-[#888] mb-1">Nama Folder</label>
                        <input required autoFocus type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors" placeholder="e.g. SMC Strategy" />
                    </div>
                </form>
            </div>
            <div className="p-4 border-t border-white/5 bg-[#111]/60 flex justify-end gap-3 font-mono">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest text-[#888] hover:text-white hover:bg-[#222] transition-colors border border-transparent hover:border-[#333]">Batal</button>
                <button type="submit" form="folder-form" className="px-5 py-2 rounded text-xs font-bold uppercase tracking-widest bg-[#00FF41] hover:bg-[#00CC33] text-black transition-colors">Simpan</button>
            </div>
         </motion.div>
      </div>
    );
};

const AddMaterialModal = ({ isOpen, currentFolderId, folders, onClose, onSave }: any) => {
    const fileRef = useRef<HTMLInputElement>(null);
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [type, setType] = useState<MaterialType>('Catatan manual');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [fileBlob, setFileBlob] = useState<File | null>(null);
    const [folderId, setFolderId] = useState<string>(currentFolderId || 'root');

    React.useEffect(() => {
        if(isOpen) setFolderId(currentFolderId || 'root');
    }, [isOpen, currentFolderId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!title) return;
        
        await onSave({
            title,
            description: desc,
            categoryId: 'uncategorized',
            subcategoryId: 'none',
            tags: tags.split(',').map((t: string) => t.trim()).filter(Boolean),
            status: 'Belum dibaca',
            type,
            folderId: folderId === 'root' ? undefined : folderId,
            content,
            fileName: fileBlob?.name,
            createdAt: Date.now(),
            progress: 0
        }, fileBlob);
        
        onClose();
        // reset
        setTitle(''); setDesc(''); setContent(''); setTags(''); setFileBlob(null);
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
         <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="bg-[#0A0A0A]/80 backdrop-blur-xl border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] shadow-[0_10px_40px_rgba(0,0,0,0.8)]">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#111]/60">
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">Tambah Materi Baru</h2>
                <button onClick={onClose} className="text-[#555] hover:text-[#00FF41]"><X size={18}/></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 font-mono">
                <form id="add-mat-form" onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] uppercase text-[#888] mb-1">Judul Materi *</label>
                        <input required type="text" value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors" placeholder="Contoh: SMC Liquidity Concepts" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Tipe File</label>
                            <select value={type} onChange={e=>setType(e.target.value as any)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors">
                                <option value="Catatan manual">Teks / Markdown</option>
                                <option value="Video">Video Lokal</option>
                                <option value="Gambar">Gambar</option>
                                <option value="PDF">PDF</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase text-[#888] mb-1">Simpan di Folder (Internal App)</label>
                            <select value={folderId} onChange={e=>setFolderId(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors">
                                <option value="root">-- ROOT --</option>
                                {folders.map((f: Folder) => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] uppercase text-[#888] mb-1">Tag (koma)</label>
                        <input type="text" value={tags} onChange={e=>setTags(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] transition-colors" placeholder="smc, video" />
                    </div>
                    
                    <div>
                        <label className="block text-[10px] uppercase text-[#888] mb-1">Deskripsi Singkat</label>
                        <textarea rows={2} value={desc} onChange={e=>setDesc(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] resize-none transition-colors" placeholder="Deskripsi..." />
                    </div>
                    
                    {type === 'Catatan manual' ? (
                        <div>
                           <label className="block text-[10px] uppercase text-[#888] mb-1">Konten (Markdown)</label>
                           <textarea rows={6} value={content} onChange={e=>setContent(e.target.value)} className="w-full bg-[#111] border border-[#333] rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] resize-y transition-colors" placeholder="# Judul..." />
                        </div>
                    ) : (
                        <div className="border border-dashed border-[#444] rounded p-6 flex flex-col items-center gap-3 bg-[#111]/30 hover:bg-[#111] transition-colors">
                            <input type="file" ref={fileRef} className="hidden" accept={type==='Video' ? 'video/*' : type==='Gambar' ? 'image/*' : type==='PDF' ? 'application/pdf' : '*/*'} onChange={(e) => setFileBlob(e.target.files?.[0] || null)} multiple />
                            <div className="p-3 bg-[#222] rounded-full text-[#00FF41]"><FileIcon size={20}/></div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-white">{fileBlob ? fileBlob.name : 'Pilih file lokal'}</p>
                                <p className="text-[10px] text-[#555] mt-1 max-w-xs">{fileBlob ? `${(fileBlob.size / 1024 / 1024).toFixed(2)} MB` : 'Batas sesuai storage browser.'}</p>
                            </div>
                            <button type="button" onClick={()=>fileRef.current?.click()} className="mt-2 text-xs border border-[#444] bg-[#222] hover:bg-[#333] hover:text-[#00FF41] text-[#CCC] px-4 py-2 rounded font-bold uppercase transition-colors">
                                Browse
                            </button>
                        </div>
                    )}
                </form>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-[#111]/60 flex justify-end gap-3 font-mono">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded text-xs font-bold uppercase tracking-widest text-[#888] hover:text-white hover:bg-[#222] transition-colors border border-transparent hover:border-[#333]">Batal</button>
                <button type="submit" form="add-mat-form" className="px-5 py-2 rounded text-xs font-bold uppercase tracking-widest bg-[#00FF41] hover:bg-[#00CC33] text-black transition-colors shadow-[0_0_10px_rgba(0,255,65,0.2)]">Simpan</button>
            </div>
         </motion.div>
      </div>
    );
}

export default Library;
