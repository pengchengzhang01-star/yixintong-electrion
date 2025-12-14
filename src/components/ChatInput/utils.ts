import emojiRegex from "emoji-regex"; // Import emoji-regex
import Delta, { Op } from "quill-delta";
import TurndownService from "turndown";

import { MentionData } from "./models/types"; // Adjust path if necessary

export const MENTION_CURSOR_CHAR = "\u200B";

// Interface for the plain object format returned by editor.getContents()
export interface DeltaStatic {
  ops?: Op[];
}

// Make sure emojiMatcher is exported if defined here, or import it
// If it was defined within ChatInput/index.tsx previously, move it here.

export const emojiMatcher = (text: string): Delta | undefined => {
  const regex = emojiRegex();
  regex.lastIndex = 0; // Reset regex state

  if (!regex.test(text)) {
    return undefined; // No emojis, return early
  }

  const newDelta = new Delta();
  let match;
  let currentIndex = 0;
  regex.lastIndex = 0; // Reset again for exec

  while ((match = regex.exec(text)) !== null) {
    // Add preceding text if any
    if (match.index > currentIndex) {
      newDelta.insert(text.substring(currentIndex, match.index));
    }
    // Insert emoji blot
    newDelta.insert({ emoji: match[0] });
    currentIndex = match.index + match[0].length;
  }
  // Add remaining text if any
  if (currentIndex < text.length) {
    newDelta.insert(text.substring(currentIndex));
  }
  return newDelta;
};

/**
 * Converts a Quill Delta object (or its static representation) to plain text,
 * handling custom emoji and mention blots.
 *
 * @param delta - The Quill Delta object or static representation to convert.
 * @returns The plain text representation.
 */
export function getPlainText(delta: Delta | DeltaStatic): string {
  let text = "";
  if (!delta || !delta.ops) {
    return text;
  }
  const ops = Array.isArray(delta.ops) ? delta.ops : [];

  ops.forEach((op) => {
    if (op.insert) {
      if (typeof op.insert === "string") {
        text += op.insert.split(MENTION_CURSOR_CHAR).join("");
      } else if (typeof op.insert === "object") {
        // Handle common embeds
        if (op.insert.emoji) {
          text += op.insert.emoji; // Use native emoji character
        } else if (op.insert.mention) {
          const mention = op.insert.mention as MentionData;
          text += `@${mention.id} `; // Use @value format; trailing space handled by editor
        }
        // Add cases for other embeds if necessary
      }
    }
    // Ignores formatting attributes and non-insert ops
  });

  return text.replace(new RegExp(MENTION_CURSOR_CHAR, "g"), "").trim();
}

/**
 * Converts a Quill Delta object (or its static representation) to plain text,
 * handling custom emoji and mention blots.
 *
 * @param delta - The Quill Delta object or static representation to convert.
 * @returns The plain text representation.
 */
export function getPlainTextWithMentionElem(delta: Delta | DeltaStatic): string {
  let text = "";
  if (!delta || !delta.ops) {
    return text;
  }
  const ops = Array.isArray(delta.ops) ? delta.ops : [];

  ops.forEach((op) => {
    if (op.insert) {
      if (typeof op.insert === "string") {
        const sanitized = op.insert.split(MENTION_CURSOR_CHAR).join("");
        text += sanitized; // Escape HTML in plain text
      } else if (typeof op.insert === "object") {
        // Handle common embeds
        if (op.insert.emoji) {
          text += op.insert.emoji; // Use native emoji character
        } else if (op.insert.mention) {
          const mention = op.insert.mention as MentionData;
          text += `<span class="im-mention-blot" data-id="${mention.id}" data-value="${mention.value}" contenteditable="false"><span contenteditable="false">@${mention.value}</span></span>${MENTION_CURSOR_CHAR}`; // Use @value format
        }
        // Add cases for other embeds if necessary
      }
    }
    // Ignores formatting attributes and non-insert ops
  });

  // Clean up whitespace and multiple newlines
  text = text.replace(/\n+/g, "\n").trim();
  return text;
}

// --- Markdown Conversion using Turndown ---

const turndownService = new TurndownService({
  headingStyle: "atx", // Use # for headings
  codeBlockStyle: "fenced", // Use ``` for code blocks
  bulletListMarker: "-", // Use - for unordered lists
  emDelimiter: "_", // Use _ for emphasis (italic)
});

// Custom rule for EmojiBlot (span.im-emoji-blot)
turndownService.addRule("emoji", {
  filter: (node: Node): boolean => {
    // Use Node type for filter
    return (
      node.nodeName === "SPAN" &&
      (node as HTMLElement).classList?.contains("im-emoji-blot") && // Type assertion needed
      (node as HTMLElement).hasAttribute?.("data-native")
    );
  },
  replacement: (_content: string, node: Node): string => {
    // Check if it's an element before getting attribute
    if (node instanceof HTMLElement) {
      return node.getAttribute("data-native") || ""; // Return native emoji
    }
    return "";
  },
});

// Custom rule for MentionBlot (span.im-mention-blot)
turndownService.addRule("mention", {
  filter: (node: Node): boolean => {
    // Use Node type for filter
    return (
      node.nodeName === "SPAN" &&
      (node as HTMLElement).classList?.contains("im-mention-blot") &&
      (node as HTMLElement).hasAttribute?.("data-value")
    );
  },
  replacement: (_content: string, node: Node): string => {
    if (node instanceof HTMLElement) {
      const value = node.getAttribute("data-id") || "";
      return `@${value}`; // Return @value format
    }
    return "";
  },
});

// Custom rule for Quill code blocks (pre.ql-syntax)
turndownService.addRule("quill-code-block", {
  filter: (node: Node): boolean => {
    // Use Node type for filter
    return (
      node.nodeName === "PRE" && (node as HTMLElement).classList?.contains("ql-syntax")
    );
  },
  replacement: (_content: string, node: Node): string => {
    const code = node.textContent || "";
    // Return as a fenced code block
    return `\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
  },
});

/**
 * Converts HTML content (likely from Quill editor) to Markdown.
 *
 * @param html - The HTML string to convert.
 * @returns The Markdown representation.
 */
export function convertHtmlToMarkdown(html: string): string {
  try {
    // Optional: Sanitize or preprocess HTML before conversion
    // const sanitizedHtml = preprocessHtml(html);
    const markdown = turndownService.turndown(html);
    return markdown;
  } catch (error) {
    console.error("Error converting HTML to Markdown:", error);
    return "Error converting content to Markdown.";
  }
}
