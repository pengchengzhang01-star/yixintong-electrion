import { Quill } from "react-quill";

import { MentionData } from "../models/types"; // Adjust path if necessary

// Import the default Image blot
const Embed = Quill.import("blots/embed");

class MentionBlot extends Embed {
  static blotName = "mention";
  static tagName = "span";
  static className = "im-mention-blot"; // Specific class for styling

  static create(value: MentionData): Node {
    const node = super.create(value) as HTMLElement;
    node.dataset.id = value.id;
    node.dataset.value = value.value;
    node.setAttribute("contenteditable", "false"); // Prevent editing
    node.innerHTML = `<span contenteditable="false">@${value.value}</span>`;
    return node;
  }

  static value(domNode: HTMLElement): MentionData {
    // Retrieve data from dataset
    return { id: domNode.dataset.id || "", value: domNode.dataset.value || "" };
  }

  // Optional: Define how formats are retrieved if needed
  formats(): { [key: string]: MentionData } {
    return { [MentionBlot.blotName]: MentionBlot.value(this.domNode as HTMLElement) };
  }
}

export default MentionBlot;
