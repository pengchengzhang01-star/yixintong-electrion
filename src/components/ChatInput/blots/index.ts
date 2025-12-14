import { Quill as QuillClass } from "react-quill";

import EmojiBlot from "./emoji";
import CustomImageBlot from "./image";
import MentionBlot from "./mention";

let blotsRegistered = false;

export const registerQuillBlots = () => {
  if (blotsRegistered) return;
  try {
    // Register blots statically
    QuillClass.register(EmojiBlot, true);
    QuillClass.register(MentionBlot, true);
    QuillClass.register(CustomImageBlot, true); // Overwrites default image blot
    console.log("Static CustomImageBlot, EmojiBlot, MentionBlot registered.");
    blotsRegistered = true;
  } catch (error) {
    console.error("Error registering blots statically:", error);
  }
};
