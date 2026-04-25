import { create } from "zustand";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  timestamp: string;
}

interface DispatchStore {
  serverUrl: string;
  secretToken: string;
  isConnected: boolean;
  lastScreenshot: string | null;
  history: any[];
  messages: Message[];
  setServerUrl: (url: string) => void;
  setSecretToken: (token: string) => void;
  setConnected: (v: boolean) => void;
  setScreenshot: (b64: string) => void;
  addHistory: (entry: any) => void;
  addMessage: (text: string, sender: "user" | "ai") => void;
}

export const useDispatchStore = create<DispatchStore>((set) => ({
  serverUrl: "https://marmalade-coerce-eternal.ngrok-free.dev",
  secretToken: "bbf98f66a0b486d8450a54a9eaf8b2a7",
  isConnected: false,
  lastScreenshot: null,
  history: [],
  messages: [],
  setServerUrl: (url) => set({ serverUrl: url }),
  setSecretToken: (token) => set({ secretToken: token }),
  setConnected: (v) => set({ isConnected: v }),
  setScreenshot: (b64) => set({ lastScreenshot: b64 }),
  addHistory: (entry) => set((s) => ({ history: [entry, ...s.history].slice(0, 100) })),
  addMessage: (text, sender) => set((s) => ({ 
    messages: [...s.messages, { 
      id: Math.random().toString(36).substring(7), 
      text, 
      sender, 
      timestamp: new Date().toISOString() 
    }] 
  })),
}));
