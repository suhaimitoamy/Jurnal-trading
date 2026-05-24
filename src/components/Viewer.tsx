import React, { useEffect, useState, useRef } from 'react';
import { Material } from '../types';
import { getBlob } from '../lib/db';
import { X, Heart, CheckCircle, Edit3, Trash2, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface ViewerProps {
  material: Material;
  allMaterials?: Material[];
  onNavigate?: (material: Material) => void;
  onUpdate?: (id: string, updates: Partial<Material>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  onToggleStatus: (id: string, status: Material['status']) => void;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap items-center gap-1 bg-[#111] p-2 border-b border-[#333] rounded-t-xl mb-4 text-[#888] font-mono text-xs">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>Bold</button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>Italic</button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded ${editor.isActive('strike') ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>Strike</button>
      <div className="w-px h-4 bg-[#333] mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded ${editor.isActive('heading', { level: 1 }) ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>H2</button>
      <div className="w-px h-4 bg-[#333] mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded ${editor.isActive('bulletList') ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>Bullet</button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded ${editor.isActive('orderedList') ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>Ordered</button>
      <div className="w-px h-4 bg-[#333] mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded ${editor.isActive('blockquote') ? 'bg-[#333] text-white' : 'hover:bg-[#222] hover:text-white'}`}>Quote</button>
    </div>
  );
};

const Viewer = ({ material, allMaterials, onNavigate, onUpdate, onDelete, onClose, onToggleStatus }: ViewerProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(material.title);

  const editor = useEditor({
    extensions: [StarterKit],
    content: material.content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-p:text-[#CCC] prose-headings:text-white focus:outline-none min-h-[300px]',
      },
    }
  });

  useEffect(() => {
    setEditTitle(material.title);
    if (editor && !isEditing) {
      editor.commands.setContent(material.content || '');
    }
  }, [material, editor]);

  useEffect(() => {
    if (material.fileBlob) {
      const url = URL.createObjectURL(material.fileBlob);
      setBlobUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (material.url) {
      setBlobUrl(material.url);
    } else if (material.id) {
       getBlob(material.id).then(blob => {
          if(blob) {
              const url = URL.createObjectURL(blob);
              setBlobUrl(url);
          }
       });
    }
  }, [material]);

  const handleNext = () => {
    if (!allMaterials) return;
    const idx = allMaterials.findIndex(m => m.id === material.id);
    if (idx >= 0 && idx < allMaterials.length - 1) onNavigate?.(allMaterials[idx + 1]);
  };

  const handlePrev = () => {
    if (!allMaterials) return;
    const idx = allMaterials.findIndex(m => m.id === material.id);
    if (idx > 0) onNavigate?.(allMaterials[idx - 1]);
  };

  const handleWheel = (e: React.WheelEvent) => {
     if (material.type !== 'Video' && material.type !== 'Gambar' && material.type !== 'Image') return;
     if (e.deltaY > 50) handleNext();
     else if (e.deltaY < -50) handlePrev();
  };

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientY);
  const handleTouchEnd = (e: React.TouchEvent) => {
     if (material.type !== 'Video' && material.type !== 'Gambar' && material.type !== 'Image') return;
     const touchEnd = e.changedTouches[0].clientY;
     const deltaY = touchStart - touchEnd;
     if (deltaY > 50) handleNext();
     else if (deltaY < -50) handlePrev();
  };

  const handleSave = () => {
     if (onUpdate) {
         onUpdate(material.id, { 
             title: editTitle, 
             content: editor ? editor.getHTML() : material.content 
         });
     }
     setIsEditing(false);
  };

  const renderContent = () => {
    if (isEditing) {
       return (
          <div className="w-full max-w-4xl mx-auto p-6 md:p-10 bg-[#111] min-h-full border border-[#222] overflow-y-auto font-sans flex flex-col md:rounded-xl">
             <input 
                type="text" 
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                className="w-full bg-transparent border-b border-[#333] pb-2 mb-6 text-2xl font-bold text-white focus:outline-none focus:border-[#00FF41]"
                placeholder="Judul Materi..."
             />
             <div className="flex-1 flex flex-col bg-[#050505] border border-[#222] rounded-xl overflow-hidden">
                <MenuBar editor={editor} />
                <div className="p-4 flex-1 overflow-y-auto">
                   <EditorContent editor={editor} />
                </div>
             </div>
             <div className="mt-6 flex justify-end gap-4">
                 <button onClick={() => setIsEditing(false)} className="px-6 py-2 rounded text-xs font-bold uppercase tracking-widest text-[#888] hover:text-white border border-[#333]">Batal</button>
                 <button onClick={handleSave} className="px-6 py-2 rounded text-xs font-bold uppercase tracking-widest bg-[#00FF41] text-black shadow-[0_0_15px_rgba(0,255,65,0.3)] flex items-center gap-2">
                     <Save size={16} /> Simpan
                 </button>
             </div>
          </div>
       );
    }

    switch (material.type) {
      case 'Image':
      case 'Gambar':
        return blobUrl ? <img src={blobUrl} alt={material.title} className="max-w-full max-h-full object-contain mx-auto" /> : <div>Memuat...</div>;
      case 'Video':
        return blobUrl ? <video src={blobUrl} controls autoPlay loop className="max-w-full max-h-full mx-auto" /> : <div>Memuat...</div>;
      case 'PDF':
        return blobUrl ? <iframe src={blobUrl} className="w-full h-full bg-slate-200" title={material.title} /> : <div>Memuat...</div>;
      case 'TXT':
      case 'Markdown':
      case 'Catatan manual':
      case 'File': // allow basic rich text override for any arbitrary file
        if (material.content && material.content.includes('<p>')) {
           // It's likely HTML from Tiptap
           return (
              <div className="prose prose-invert prose-p:text-[#CCC] prose-headings:text-white max-w-3xl mx-auto p-6 md:p-10 bg-[#111] min-h-full border border-[#222] shadow-2xl overflow-y-auto w-full md:rounded-xl font-sans" dangerouslySetInnerHTML={{ __html: material.content }}></div>
           );
        }
        return (
          <div className="prose prose-invert prose-p:text-[#CCC] prose-headings:text-white max-w-3xl mx-auto p-6 md:p-10 bg-[#111] min-h-full border border-[#222] shadow-2xl overflow-y-auto w-full md:rounded-xl font-sans">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{material.content || 'Tidak ada konten text. Klik mode Edit jika ingin menambahkan catatan seperti MS Word.'}</ReactMarkdown>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p>File type "{material.type}" didukung sebagian oleh Viewer internal.</p>
            {material.content && <p className="mt-2 text-sm text-[#888]">Ada catatan teks yang bisa diedit (Fitur Edit).</p>}
            {blobUrl && <a href={blobUrl} download={material.fileName} className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">Download File PDF/Word Asli</a>}
          </div>
        );
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-md flex flex-col"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="h-16 shrink-0 border-b border-[#222] px-4 flex items-center justify-between bg-[#0A0A0A]">
          <div className="text-white font-mono text-sm uppercase tracking-widest truncate flex-1 md:max-w-[40%] text-left">
              {material.title} {isEditing ? <span className="text-rose-500 ml-2">(EDITING)</span> : ''}
              {(material.type === 'Video' || material.type === 'Gambar') && <span className="hidden md:inline text-[10px] text-[#555] ml-4 font-normal normal-case">Scroll / Swipe bawah untuk lanjut</span>}
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            {!isEditing && (
              <>
                  <button onClick={() => setIsEditing(true)} className="p-2 rounded border border-transparent hover:border-[#333] hover:bg-[#111] text-[#888] transition-colors" title="Edit text/judul (mirip MS Word)">
                    <Edit3 size={18} />
                  </button>
                  <button onClick={() => { if(confirm('Hapus materi ini?')) { onDelete?.(material.id); onClose(); } }} className="p-2 rounded border border-transparent hover:border-rose-500/50 hover:bg-rose-500/10 text-[#888] hover:text-rose-500 transition-colors" title="Hapus">
                    <Trash2 size={18} />
                  </button>
                  <div className="w-px h-6 bg-[#333] mx-1"></div>
              </>
            )}

            <button 
                onClick={() => onToggleStatus(material.id, material.status === 'Selesai' ? 'Sedang dipelajari' : 'Selesai')}
                className={`p-2 rounded border transition-colors ${material.status === 'Selesai' ? 'text-[#00FF41] bg-[#00FF41]/10 border-[#00FF41]/30' : 'text-[#555] border-transparent hover:border-[#333] hover:bg-[#111]'}`}
                title="Tandai Selesai"
            >
              <CheckCircle size={18} />
            </button>
            <button 
                onClick={() => onToggleStatus(material.id, material.status === 'Favorit' ? 'Sedang dipelajari' : 'Favorit')}
                className={`p-2 rounded border transition-colors ${material.status === 'Favorit' ? 'text-rose-500 bg-rose-500/10 border-rose-500/30' : 'text-[#555] border-transparent hover:border-[#333] hover:bg-[#111]'}`}
                title="Favorit"
            >
              <Heart size={18} />
            </button>
            <div className="w-px h-6 bg-[#333] mx-1 md:mx-2"></div>
            
            {/* Navigation buttons for desktop if they don't want to scroll */}
            {(material.type === 'Video' || material.type === 'Gambar') && allMaterials && (
               <div className="hidden md:flex gap-1 mr-2">
                   <button onClick={handlePrev} className="p-2 rounded border border-[#333] text-[#888] hover:text-white hover:bg-[#111] transition-colors"><ChevronLeft size={18}/></button>
                   <button onClick={handleNext} className="p-2 rounded border border-[#333] text-[#888] hover:text-white hover:bg-[#111] transition-colors"><ChevronRight size={18}/></button>
               </div>
            )}

            <button onClick={onClose} className="p-2 rounded border border-[#333] text-[#888] hover:text-white hover:bg-rose-500/20 hover:border-rose-500/50 flex flex-row items-center gap-1 transition-colors">
                <X size={18} />
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-hidden p-0 md:p-6 bg-[#050505] h-full w-full flex items-center justify-center relative">
          {renderContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Viewer;
