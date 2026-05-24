import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../store';
import { Bot, Send, Settings2, Trash2, Key, Check, Command, AlertTriangle, ImageIcon, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const Asisten = () => {
  const { chatMessages, addChatMessage, clearChat, materials, journals, deleteMaterial, updateMaterial } = useAppContext();
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
      });
  };
  
  // Settings State
  const [provider, setProvider] = useState(() => localStorage.getItem('ai_provider') || 'Gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('ai_api_key') || '');
  
  const [pendingAction, setPendingAction] = useState<any>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const saveSettings = () => {
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_api_key', apiKey);
    setShowSettings(false);
  };

  // The Local Controller
  const executeLocalController = async (text: string) => {
    const lower = text.toLowerCase();
    
    // Check pending Confirmation
    if (pendingAction) {
        if (lower === 'yes' || lower === 'ya') {
            await addChatMessage({ role: 'assistant', content: 'Mengeksekusi perintah...' });
            
            if (pendingAction.type === 'delete_material') {
                 await deleteMaterial(pendingAction.targetId);
                 await addChatMessage({ role: 'assistant', content: `✔️ Berhasil dihapus: **${pendingAction.targetName}**`});
            } else if (pendingAction.type === 'archive_material') {
                 await updateMaterial(pendingAction.targetId, { status: 'Arsip' });
                 await addChatMessage({ role: 'assistant', content: `✔️ Materi berhasil diarsipkan: **${pendingAction.targetName}**`});
            } else if (pendingAction.type === 'mark_done_material') {
                 await updateMaterial(pendingAction.targetId, { status: 'Selesai' });
                 await addChatMessage({ role: 'assistant', content: `✔️ Status diperbarui menjadi Selesai: **${pendingAction.targetName}**`});
            }

            setPendingAction(null);
            return true;
        } else if (lower === 'no' || lower === 'tidak') {
            await addChatMessage({ role: 'assistant', content: 'Aksi dibatalkan.' });
            setPendingAction(null);
            return true;
        }
    }

    // Local Analysis: Win Rate
    if (lower.includes('win rate')) {
        const totalWin = journals.filter(j => j.result === 'Win').length;
        const total = journals.filter(j => ['Win', 'Loss'].includes(j.result || '')).length;
        const wr = total > 0 ? ((totalWin / total) * 100).toFixed(2) : 0;
        await addChatMessage({ role: 'assistant', content: `📊 Dari data jurnal lokal Anda, Win Rate Anda adalah **${wr}%** (${totalWin} Win dari ${total} trade yang tereksekusi).` });
        return true;
    }
    
    // Local Analysis: PnL
    if (lower.includes('pnl') || lower.includes('profit') || lower.includes('rugi') || lower.includes('untung')) {
        const totalPnl = journals.reduce((sum, j) => sum + (j.pnl || 0), 0);
        await addChatMessage({ role: 'assistant', content: `💰 Total PnL (Profit/Loss) Anda adalah **$${totalPnl.toFixed(2)}** berdasarkan jurnal.` });
        return true;
    }

    // File Action: Delete
    const deleteMatch = lower.match(/(?:hapus|delete)\s+(?:materi|file)?(.*)/i);
    if (deleteMatch && deleteMatch[1].trim() !== '') {
        const keyword = deleteMatch[1].trim();
        const found = materials.filter(m => m.title.toLowerCase().includes(keyword));
        if (found.length === 0) {
            await addChatMessage({ role: 'assistant', content: `Saya tidak menemukan materi dengan judul yang cocok dengan "${keyword}".` });
        } else if (found.length === 1) {
            setPendingAction({ type: 'delete_material', targetId: found[0].id, targetName: found[0].title });
            await addChatMessage({ role: 'assistant', content: `Yakin ingin menghapus materi **"${found[0].title}"**?\n\nKetik **YES** untuk lanjut atau **NO** untuk batal.` });
        } else {
             await addChatMessage({ role: 'assistant', content: `Saya menemukan ${found.length} materi terkait "${keyword}". Mohon tuliskan judul yang lebih spesifik.` });
        }
        return true;
    }

    // File Action: Archive
    const archiveMatch = lower.match(/(?:arsipkan|arsip)\s+(?:materi|file)?(.*)/i);
    if (archiveMatch && archiveMatch[1].trim() !== '') {
        const keyword = archiveMatch[1].trim();
        const found = materials.filter(m => m.title.toLowerCase().includes(keyword));
        if (found.length === 0) {
            await addChatMessage({ role: 'assistant', content: `Saya tidak menemukan materi dengan judul yang cocok dengan "${keyword}".` });
        } else if (found.length === 1) {
            setPendingAction({ type: 'archive_material', targetId: found[0].id, targetName: found[0].title });
            await addChatMessage({ role: 'assistant', content: `Yakin ingin mengarsipkan materi **"${found[0].title}"**?\n\nKetik **YES** untuk lanjut atau **NO** untuk batal.` });
        } else {
             await addChatMessage({ role: 'assistant', content: `Saya menemukan ${found.length} materi terkait "${keyword}". Mohon tuliskan judul yang lebih spesifik.` });
        }
        return true;
    }

    // File Action: Mark Done
    const doneMatch = lower.match(/(?:tandai selesai|selesai)\s+(?:materi|file)?(.*)/i);
    if (doneMatch && doneMatch[1].trim() !== '') {
        const keyword = doneMatch[1].trim();
        const found = materials.filter(m => m.title.toLowerCase().includes(keyword));
        if (found.length === 0) {
            await addChatMessage({ role: 'assistant', content: `Saya tidak menemukan materi dengan judul yang cocok dengan "${keyword}".` });
        } else if (found.length === 1) {
            setPendingAction({ type: 'mark_done_material', targetId: found[0].id, targetName: found[0].title });
            await addChatMessage({ role: 'assistant', content: `Tandai materi **"${found[0].title}"** sebagai selesai dibaca?\n\nKetik **YES** untuk lanjut atau **NO** untuk batal.` });
        } else {
             await addChatMessage({ role: 'assistant', content: `Saya menemukan ${found.length} materi terkait "${keyword}". Mohon tuliskan judul yang lebih spesifik.` });
        }
        return true;
    }

    // fallback to AI
    return false;
  };

  const handleSend = async () => {
    if (!input.trim() && !imageFile) return;
    const userMsg = input.trim() || 'Tolong analisa gambar ini.';
    const currentImage = imageFile;
    
    setInput('');
    setImageFile(null);
    
    let base64Image = '';
    if (currentImage) {
        base64Image = await fileToBase64(currentImage);
    }
    
    await addChatMessage({ role: 'user', content: userMsg, image: base64Image || undefined });

    // Local override first (for simple hardcoded stuff, optional since AI can do it now)
    const handledLocally = await executeLocalController(userMsg);
    if (handledLocally) return;

    // External AI
    const savedKey = localStorage.getItem('ai_api_key');
    if (!savedKey) {
        await addChatMessage({ 
            role: 'assistant', 
            content: "⚠️ **API Key belum diatur.**\n\nAI Eksternal memerlukan API Key untuk menjawab pertanyaan analitik/trading umum. Silakan masukkan API key di **Pengaturan AI**." 
        });
        return;
    }
    
    // Build context
    const libraryContext = materials.map(m => `ID: ${m.id} | Judul: ${m.title} | Tipe: ${m.type} | Status: ${m.status}\nKonten: ${m.content ? m.content.substring(0, 500) + '...' : m.description || 'Tidak ada teks'}`).join('\n\n---\n');

    const systemPrompt = `Kamu adalah Asisten AI untuk aplikasi Trading Library Manager.

Tugas dan Batasanmu:
1. FOKUS PADA MATERI / JURNAL: Kamu bisa membantu user menganalisa atau merangkum materi yang mereka upload, serta memberikan edukasi umum tentang trading.
2. ANALISA GAMBAR CHART: Jika diberikan gambar chart, pahami konteks seperti zona supply/demand, key levels, pola (patterns), struktur market, dan tawarkan bias arah atau invalidation.
<kumpulan_materi>
${libraryContext ? libraryContext : 'Belum ada materi apapun yang diupload user.'}
</kumpulan_materi>

Berikan respons yang ringkas dan to the point, serta informatif. Jika pertanyaan bukan tentang trading atau materi yang ada, tegur user secara halus.`;

    if (provider === 'Gemini' || provider === 'OpenRouter' || provider === 'OpenAI') {
        try {
            if(provider === 'Gemini') {
                const parts: any[] = [{ text: userMsg }];
                if (currentImage && base64Image) {
                    parts.push({
                        inlineData: {
                            mimeType: currentImage.type,
                            data: base64Image.split(',')[1] // remove data prefix
                        }
                    });
                }

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${savedKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        system_instruction: { parts: [{ text: systemPrompt }] },
                        contents: [{ parts }]
                    })
                });
                const data = await response.json();
                if (data.error) {
                    await addChatMessage({ role: 'assistant', content: `API Error: ${data.error.message}` });
                } else if (data.candidates && data.candidates.length > 0) {
                    let reply = data.candidates[0].content.parts[0].text as string;
                    await addChatMessage({ role: 'assistant', content: reply });
                }
            } else {
                 await addChatMessage({ role: 'assistant', content: `Simulasi: Provider ${provider} belum memiliki API caller aktif. Set ke Gemini untuk demo.` });
            }
        } catch (e: any) {
            await addChatMessage({ role: 'assistant', content: `Terjadi kesalahan saat memanggil API: ${e.message}` });
        }
    } else {
        await addChatMessage({ role: 'assistant', content: `Provider ${provider} tidak disupport.` });
    }
  };

  return (
    <div className="h-full flex flex-col pt-2 pb-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
             <div className="w-8 h-8 border border-[#00FF41] rounded flex items-center justify-center bg-[#00FF41]/10 shadow-[0_0_10px_rgba(0,255,65,0.3)]">
                <Bot size={18} className="text-[#00FF41]" />
             </div>
             Asisten AI
          </h1>
        </div>
        
        <div className="flex items-center gap-2">
            {chatMessages.length > 0 && (
                <button onClick={clearChat} className="p-2 text-[#555] hover:text-rose-500 hover:bg-rose-500/10 rounded border border-transparent transition-colors" title="Bersihkan Chat">
                  <Trash2 size={20} />
                </button>
            )}
           <button onClick={() => setShowSettings(!showSettings)} className={cn("p-2 rounded transition-colors border flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest", showSettings ? "bg-[#00FF41]/10 text-[#00FF41] border-[#00FF41]" : "text-[#888] hover:text-white border-[#333] hover:bg-[#111]")}>
              <Settings2 size={16} />
              <span className="hidden md:inline">Settings</span>
           </button>
        </div>
      </div>

      <AnimatePresence>
          {showSettings && (
             <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
             >
             <div className="bg-[#0A0A0A]/60 backdrop-blur-md border border-white/5 rounded-xl p-4 flex flex-col gap-4 shadow-lg shadow-black">
                    <div className="flex items-center gap-2 text-white border-b border-[#222] pb-2">
                       <Key size={16} className="text-[#00FF41]" />
                       <h3 className="font-mono text-xs uppercase tracking-widest opacity-80">Pengaturan Koneksi AI</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">Provider AI</label>
                            <select value={provider} onChange={e=>setProvider(e.target.value)} className="w-full bg-[#111]/40 border border-white/5 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF41] font-mono backdrop-blur-sm">
                                <option value="Gemini">Google Gemini</option>
                                <option value="OpenRouter">OpenRouter</option>
                                <option value="OpenAI">OpenAI</option>
                                <option value="Groq">Groq</option>
                                <option value="Custom">Custom Endpoint</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-[#888] mb-1">API Key (Disimpan lokal)</label>
                            <input 
                               type="password" 
                               value={apiKey} 
                               onChange={e=>setApiKey(e.target.value)} 
                               placeholder="Masukkan API key di sini" 
                               className="w-full bg-[#111]/40 border border-white/5 rounded px-3 py-2 text-sm text-[#00FF41] focus:outline-none focus:border-[#00FF41] font-mono tracking-widest backdrop-blur-sm" 
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                        <p className="text-[10px] text-[#555] max-w-xs flex items-start gap-1 font-mono">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-500" /> 
                            API Key hanya tersimpan di localStorage.
                        </p>
                        <div className="flex gap-2">
                            <button onClick={()=>setApiKey('')} className="px-3 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition-colors">Hapus</button>
                            <button onClick={saveSettings} className="px-4 py-1.5 rounded text-[10px] font-bold tracking-widest uppercase bg-[#00FF41] hover:bg-[#00CC33] text-black flex items-center gap-1 transition-colors"><Check size={14} /> Simpan</button>
                        </div>
                    </div>
                </div>
             </motion.div>
          )}
      </AnimatePresence>

      <div className="flex-1 bg-[#0A0A0A]/50 backdrop-blur-md border border-white/5 rounded-2xl flex flex-col overflow-hidden relative shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-70">
                      <div className="w-16 h-16 rounded-full border border-[#00FF41]/30 flex items-center justify-center mb-4 bg-[#111] shadow-[0_0_20px_rgba(0,255,65,0.1)]">
                         <Command size={28} className="text-[#00FF41] opacity-80" />
                      </div>
                      <p className="text-white text-sm font-mono tracking-widest uppercase">System Ready</p>
                      <p className="text-[#555] text-xs mt-2 max-w-sm font-mono">Tanya jurnal, ringkasan, atau jalankan command lokal (Coba: "Berapa win rate saya?").</p>
                  </div>
              ) : (
                  chatMessages.map(msg => (
                      <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                          <div className={cn(
                              "max-w-[85%] md:max-w-[70%] rounded-xl px-5 py-4 text-sm font-sans backdrop-blur-md shadow-lg",
                              msg.role === 'user' 
                                ? "bg-[#00FF41]/5 text-[#E0E0E0] border border-[#00FF41]/20 border-r-2 border-r-[#00FF41]" 
                                : "bg-[#111]/40 text-[#CCC] border border-white/5"
                          )}>
                             {msg.role === 'assistant' ? (
                                <div className="prose prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                </div>
                             ) : (
                                <div className="flex flex-col gap-3">
                                    {msg.image && (
                                        <img src={msg.image} className="max-w-full h-auto rounded-lg max-h-[300px] object-contain border border-[#333]" alt="Uploaded chart" referrerPolicy="no-referrer" />
                                    )}
                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                </div>
                             )}
                          </div>
                      </div>
                  ))
              )}
              <div ref={endRef} />
          </div>
          
          <div className="p-4 border-t border-white/5 bg-[#111]/60 backdrop-blur-md shrink-0 z-10 flex flex-col gap-3">
             {imageFile && (
                 <div className="flex items-center gap-3 p-2 bg-[#222]/80 border border-white/10 rounded-xl w-max shrink-0 relative group shadow-lg">
                     <img src={URL.createObjectURL(imageFile)} className="w-14 h-14 object-cover rounded-lg" alt="Preview" />
                     <div className="flex flex-col pr-4">
                         <span className="text-xs text-white truncate max-w-[150px] font-mono">{imageFile.name}</span>
                         <span className="text-[10px] text-[#888] font-mono">{(imageFile.size / 1024 / 1024).toFixed(2)} MB</span>
                     </div>
                     <button type="button" onClick={() => setImageFile(null)} className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                         <X size={14} />
                     </button>
                 </div>
             )}
             <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex gap-3">
                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => { if(e.target.files?.[0]) setImageFile(e.target.files[0]); }} />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className={cn("p-3 rounded border transition-colors flex items-center justify-center shrink-0 shadow-inner", imageFile ? "bg-[#00FF41]/20 border-[#00FF41]/50 text-[#00FF41]" : "bg-[#0A0A0A]/60 backdrop-blur-sm border-white/5 hover:border-white/20 text-[#888] hover:text-white")}>
                     <ImageIcon size={20} />
                 </button>
                 <div className="flex-1 relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#00FF41] font-mono text-sm">{'>'}</span>
                     <input 
                        type="text" 
                        value={input} 
                        onChange={e=>setInput(e.target.value)} 
                        placeholder="Ketik command, atau upload gambar chart untuk analisa..." 
                        className="w-full bg-[#0A0A0A]/60 backdrop-blur-sm border border-white/5 rounded text-sm text-white focus:outline-none focus:border-[#00FF41]/50 transition-colors py-3 pl-10 pr-4 font-mono shadow-inner hover:border-white/10"
                     />
                 </div>
                 <button 
                    type="submit" 
                    disabled={!input.trim() && !imageFile}
                    className="bg-[#00FF41] hover:bg-[#00CC33] disabled:bg-[#222]/50 disabled:text-[#555] disabled:backdrop-blur-sm disabled:border-transparent text-black border border-[#00FF41] rounded px-6 font-bold tracking-widest uppercase transition-colors shadow-[0_0_10px_rgba(0,255,65,0.2)] disabled:shadow-none"
                 >
                    <Send size={16} />
                 </button>
             </form>
          </div>
      </div>
    </div>
  );
};

export default Asisten;
