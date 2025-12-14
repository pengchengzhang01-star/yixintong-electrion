import { Quill } from "react-quill";
import twemoji from "twemoji";

// Import the default Embed blot
const Embed = Quill.import("blots/embed");

class EmojiBlot extends Embed {
  static blotName = "emoji";
  static tagName = "span";
  static className = "im-emoji-blot"; // Use a specific class name

  static create(value: string): Node {
    const node = super.create(value) as HTMLElement;
    node.dataset.native = value;
    const imgHtml = twemoji.parse(value, {
      folder: "svg",
      ext: ".svg",
      className: "im-emojione", // Specific class for the img
      base: `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/`,
    });
    node.innerHTML = imgHtml;
    // Make the emoji blot non-editable but selectable
    node.setAttribute("spellcheck", "false");
    return node;
  }

  static value(domNode: HTMLElement): string {
    return domNode.dataset.native || ""; // Retrieve the native emoji
  }

  // Override format to prevent formatting operations on emoji
  format(_name: string, _value: any): void {
    // Emojis should not be formatted, ignore all format operations
    return;
  }

  // Override formatAt to prevent range-based formatting
  formatAt(_index: number, _length: number, _name: string, _value: any): void {
    // Emojis should not be formatted, ignore all formatAt operations
    return;
  }

  // Ensure the blot cannot be split
  optimize(context: any): void {
    super.optimize(context);
    // Prevent any optimization that might break the emoji structure
    if (this.domNode.nodeType === Node.ELEMENT_NODE) {
      const elem = this.domNode as HTMLElement;
      // Ensure the emoji data is preserved
      if (!elem.dataset.native && elem.textContent) {
        elem.dataset.native = elem.textContent;
      }
    }
  }
}

export default EmojiBlot;
