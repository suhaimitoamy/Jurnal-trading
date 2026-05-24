import localforage from 'localforage';
import { Material, TradeJournal, ChatMessage, Folder } from '../types';

localforage.config({
  name: 'TradingLibraryManager',
  version: 1.0,
  storeName: 'dataStore',
  description: 'Local database for offline trading material and journal management.'
});

const MATERIALS_KEY = 'materials_meta';
const JOURNALS_KEY = 'journals_meta';
const CHATMESSAGES_KEY = 'chat_messages';
const FOLDERS_KEY = 'folders_meta';

export const dbStart = async () => {
    const mat = await localforage.getItem<Material[]>(MATERIALS_KEY);
    if (!mat) await localforage.setItem(MATERIALS_KEY, []);
    
    const jour = await localforage.getItem<TradeJournal[]>(JOURNALS_KEY);
    if (!jour) await localforage.setItem(JOURNALS_KEY, []);
    
    const chat = await localforage.getItem<ChatMessage[]>(CHATMESSAGES_KEY);
    if (!chat) await localforage.setItem(CHATMESSAGES_KEY, []);

    const fold = await localforage.getItem<Folder[]>(FOLDERS_KEY);
    if (!fold) await localforage.setItem(FOLDERS_KEY, []);
}

// Folders Metadata
export const getFolders = async (): Promise<Folder[]> => {
    return (await localforage.getItem<Folder[]>(FOLDERS_KEY)) || [];
}
export const saveFolders = async (data: Folder[]) => {
    await localforage.setItem(FOLDERS_KEY, data);
}

// Materials Metadata
export const getMaterials = async (): Promise<Material[]> => {
    return (await localforage.getItem<Material[]>(MATERIALS_KEY)) || [];
}
export const saveMaterials = async (data: Material[]) => {
    await localforage.setItem(MATERIALS_KEY, data);
}

// Blobs
export const getBlob = async (id: string): Promise<Blob | null> => {
    return await localforage.getItem<Blob>(`blob_${id}`);
}
export const saveBlob = async (id: string, blob: Blob) => {
    await localforage.setItem(`blob_${id}`, blob);
}
export const deleteBlob = async (id: string) => {
    await localforage.removeItem(`blob_${id}`);
}

// Journals Metadata
export const getJournals = async (): Promise<TradeJournal[]> => {
    return (await localforage.getItem<TradeJournal[]>(JOURNALS_KEY)) || [];
}
export const saveJournals = async (data: TradeJournal[]) => {
    await localforage.setItem(JOURNALS_KEY, data);
}

// Chats
export const getChatMessages = async (): Promise<ChatMessage[]> => {
    return (await localforage.getItem<ChatMessage[]>(CHATMESSAGES_KEY)) || [];
}
export const saveChatMessages = async (data: ChatMessage[]) => {
    await localforage.setItem(CHATMESSAGES_KEY, data);
}

export const exportDataJson = async () => {
    const materials = await getMaterials();
    const journals = await getJournals();
    const chats = await getChatMessages();
    return JSON.stringify({ materials, journals, chats });
}
export const importDataJson = async (jsonString: string) => {
    const data = JSON.parse(jsonString);
    if (data.materials) await saveMaterials(data.materials);
    if (data.journals) await saveJournals(data.journals);
    if (data.chats) await saveChatMessages(data.chats);
}

