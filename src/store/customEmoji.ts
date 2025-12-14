import { create } from "zustand";

import { CustomEmojiItem } from "@/pages/chat/queryChat/MessageItem/FaceMessageRender";
import { getUserCustomEmojis, setUserCustomEmojis } from "@/utils/storage";

interface CustomEmojiState {
  customEmojis: CustomEmojiItem[];
  refreshCustomEmojis: () => Promise<void>;
  addCustomEmoji: (emoji: CustomEmojiItem) => Promise<void>;
  deleteCustomEmoji: (idx: number) => Promise<void>;
}

export const useCustomEmojiStore = create<CustomEmojiState>((set, get) => ({
  customEmojis: [],

  refreshCustomEmojis: async () => {
    const emojis = await getUserCustomEmojis();
    set({ customEmojis: emojis });
  },

  addCustomEmoji: async (emoji) => {
    const next = [...get().customEmojis, emoji];
    set({ customEmojis: next });
    await setUserCustomEmojis(next);
  },

  deleteCustomEmoji: async (idx) => {
    const next = get().customEmojis.filter((_, i) => i !== idx);
    set({ customEmojis: next });
    await setUserCustomEmojis(next);
  },
}));

// init
useCustomEmojiStore.getState().refreshCustomEmojis();
