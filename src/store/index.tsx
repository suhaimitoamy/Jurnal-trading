import React, { createContext, useContext, useEffect, useState } from 'react';
import { Material, TradeJournal, ChatMessage, ViewState, Folder } from '../types';
import * as db from '../lib/db';
import { v4 as uuidv4 } from 'uuid';

interface AppState {
  currentView: ViewState;
  setCurrentView: (v: ViewState) => void;
  materials: Material[];
  journals: TradeJournal[];
  chatMessages: ChatMessage[];
  folders: Folder[];
  addMaterial: (m: Omit<Material, 'id'>, blob?: Blob) => Promise<void>;
  bulkAddMaterials: (items: { material: Omit<Material, 'id'>, blob?: Blob }[], onProgress?: (current: number, total: number) => void) => Promise<void>;
  updateMaterial: (id: string, updates: Partial<Material>) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addJournal: (j: Omit<TradeJournal, 'id'>, blob?: Blob) => Promise<void>;
  updateJournal: (id: string, updates: Partial<TradeJournal>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addChatMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => Promise<void>;
  clearChat: () => Promise<void>;
  addFolder: (f: Omit<Folder, 'id' | 'createdAt'>) => Promise<string>;
  updateFolder: (id: string, updates: Partial<Folder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [journals, setJournals] = useState<TradeJournal[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  useEffect(() => {
    const load = async () => {
      await db.dbStart();
      setMaterials(await db.getMaterials());
      setJournals(await db.getJournals());
      setChatMessages(await db.getChatMessages());
      setFolders(await db.getFolders());
    };
    load();
  }, []);

  const addMaterial = async (m: Omit<Material, 'id'>, blob?: Blob) => {
    const newM: Material = { ...m, id: uuidv4() };
    if (blob) await db.saveBlob(newM.id, blob);
    const updated = [newM, ...materials];
    setMaterials(updated);
    await db.saveMaterials(updated);
  };

  const bulkAddMaterials = async (items: { material: Omit<Material, 'id'>, blob?: Blob }[], onProgress?: (current: number, total: number) => void) => {
    const newItems: Material[] = [];
    const total = items.length;
    let currentCount = 0;
    
    for (const item of items) {
      const id = uuidv4();
      newItems.push({ ...item.material, id });
      if (item.blob) {
        await db.saveBlob(id, item.blob);
      }
      currentCount++;
      if (onProgress) {
        onProgress(currentCount, total);
      }
    }
    const updated = [...newItems, ...materials];
    setMaterials(updated);
    await db.saveMaterials(updated);
  };

  const updateMaterial = async (id: string, updates: Partial<Material>) => {
    const updated = materials.map(m => m.id === id ? { ...m, ...updates } : m);
    setMaterials(updated);
    await db.saveMaterials(updated);
  };

  const deleteMaterial = async (id: string) => {
    await db.deleteBlob(id);
    const updated = materials.filter(m => m.id !== id);
    setMaterials(updated);
    await db.saveMaterials(updated);
  };

  const addJournal = async (j: Omit<TradeJournal, 'id'>, blob?: Blob) => {
    const newJ: TradeJournal = { ...j, id: uuidv4() };
    if (blob) await db.saveBlob(`j_${newJ.id}`, blob);
    const updated = [newJ, ...journals];
    setJournals(updated);
    await db.saveJournals(updated);
  };

  const updateJournal = async (id: string, updates: Partial<TradeJournal>) => {
    const updated = journals.map(j => j.id === id ? { ...j, ...updates } : j);
    setJournals(updated);
    await db.saveJournals(updated);
  };

  const deleteJournal = async (id: string) => {
    await db.deleteBlob(`j_${id}`);
    const updated = journals.filter(j => j.id !== id);
    setJournals(updated);
    await db.saveJournals(updated);
  };

  const addChatMessage = async (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMsg: ChatMessage = { ...msg, id: uuidv4(), timestamp: Date.now() };
    const updated = [...chatMessages, newMsg];
    setChatMessages(updated);
    await db.saveChatMessages(updated);
  };

  const clearChat = async () => {
    setChatMessages([]);
    await db.saveChatMessages([]);
  }

  const addFolder = async (f: Omit<Folder, 'id' | 'createdAt'>) => {
    const id = uuidv4();
    const newF: Folder = { ...f, id, createdAt: Date.now() };
    const updated = [newF, ...folders];
    setFolders(updated);
    await db.saveFolders(updated);
    return id;
  };

  const updateFolder = async (id: string, updates: Partial<Folder>) => {
    const updated = folders.map(f => f.id === id ? { ...f, ...updates } : f);
    setFolders(updated);
    await db.saveFolders(updated);
  };

  const deleteFolder = async (id: string) => {
    const updated = folders.filter(f => f.id !== id);
    setFolders(updated);
    await db.saveFolders(updated);
    
    // Also remove folder assignment from materials
    const updatedMaterials = materials.map(m => m.folderId === id ? { ...m, folderId: undefined } : m);
    setMaterials(updatedMaterials);
    await db.saveMaterials(updatedMaterials);
  };

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      materials, journals, chatMessages, folders,
      addMaterial, bulkAddMaterials, updateMaterial, deleteMaterial,
      addJournal, updateJournal, deleteJournal,
      addChatMessage, clearChat,
      addFolder, updateFolder, deleteFolder
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
