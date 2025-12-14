import "react-quill/dist/quill.snow.css";
import "./styles.scss";

import clsx from "clsx";
import Delta from "quill-delta";
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactQuill, { Quill as QuillClass } from "react-quill";

import { registerQuillBlots } from "./blots";
import MentionSuggestions from "./components/MentionSuggestions";
import { ChatInputProps, ChatInputRef, MentionData } from "./models/types";
import { emojiMatcher, MENTION_CURSOR_CHAR } from "./utils";

// Register custom blots (run once)
registerQuillBlots();

// Convert HTML clipboard content to plain text while preserving visual newlines
const htmlToPlainText = (html: string) => {
  if (!html) return "";
  const container = document.createElement("div");
  container.innerHTML = html;
  const text = container.innerText || container.textContent || "";
  return text.replace(/\r\n?/g, "\n");
};

const RichTextChatInput = forwardRef<ChatInputRef, ChatInputProps>((props, ref) => {
  const {
    className,
    value,
    onChange,
    fetchMentionUsers,
    placeholder = "", // Default placeholder
    showToolbar = true,
    renderMentionItem,
    mentionErrorContent,
    onPasteImageUpload,
    onPasteFileUpload,
    sendKeyBehavior = "enter",
    onSend,
    enableLogs = true,
    onDeleteWithEmpty,
    onContextMenu,
  } = props;

  // Conditional logging helpers
  const logDebug = useCallback(
    (...args: unknown[]) => {
      if (enableLogs) {
        // eslint-disable-next-line
        console.log("[ChatInput]", ...args);
      }
    },
    [enableLogs],
  );

  const logWarn = useCallback(
    (...args: unknown[]) => {
      if (enableLogs) {
        // eslint-disable-next-line
        console.warn("[ChatInput]", ...args);
      }
    },
    [enableLogs],
  );

  const logError = useCallback((...args: unknown[]) => {
    // eslint-disable-next-line
    console.error("[ChatInput]", ...args);
  }, []);

  const [editorInstance, setEditorInstance] = useState<InstanceType<
    typeof QuillClass
  > | null>(null);
  const quillRef = useRef<ReactQuill>(null);

  // Use refs for props needed in listeners to prevent unnecessary effect runs
  const onSendRef = useRef(onSend);
  const sendKeyBehaviorRef = useRef(sendKeyBehavior);

  // Update refs when props change
  useEffect(() => {
    onSendRef.current = onSend;
  }, [onSend]);

  useEffect(() => {
    sendKeyBehaviorRef.current = sendKeyBehavior;
  }, [sendKeyBehavior]);

  // Method to insert emoji programmatically
  const insertEmoji = useCallback(
    (emoji: string) => {
      if (editorInstance) {
        const range = editorInstance.getSelection(true);
        editorInstance.insertEmbed(range.index, "emoji", emoji, "user");
        // Set selection after emoji and force editor focus
        editorInstance.setSelection(range.index + 1, 0, "user");
        // Force a small delay to ensure cursor visibility
        setTimeout(() => {
          editorInstance.focus();
        }, 10);
      }
    },
    [editorInstance],
  );

  // Function to focus the editor, optionally moving cursor to end
  const focusEditor = useCallback(
    (moveToEnd = true) => {
      const editor = quillRef.current?.getEditor();

      // Add parameter with default
      if (editor) {
        logDebug(
          `Calling focus(${moveToEnd ? "moveToEnd=true" : ""}) on editor instance.`,
        );
        editor.focus(); // Focus the editor first

        // Move cursor to the end if requested
        if (moveToEnd) {
          setTimeout(() => {
            try {
              const length = editor.getLength();
              // Use timeout to ensure focus is applied before setting selection
              editor.setSelection(length, 0, "user");
              logDebug(`Moved cursor to end (position ${length})`);
            } catch (e) {
              logError("Error trying to move cursor to end after focus:", e);
            }
          });
        }
      } else {
        logWarn(
          `focusEditor(${moveToEnd}) called but editorInstance is not available yet.`,
        );
      }
    },
    [logDebug, logWarn, logError],
  ); // Add logError to dependencies

  // Method to insert mention programmatically
  const insertMentionCallback = useCallback(
    (mentionData: MentionData) => {
      logDebug("Programmatically inserting mention:", mentionData);
      if (editorInstance) {
        const range = editorInstance.getSelection(true) || { index: 0, length: 0 };
        const delta = new Delta()
          .retain(range.index)
          .delete(range.length)
          .insert({ mention: mentionData })
          .insert(MENTION_CURSOR_CHAR);
        editorInstance.updateContents(delta, "user");
        editorInstance.setSelection(range.index + 2, 0, "user");
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => editorInstance.focus());
        } else {
          setTimeout(() => editorInstance.focus(), 0);
        }
      } else {
        logWarn("insertMention called but editorInstance is not available yet.");
      }
    },
    [editorInstance, logDebug, logWarn],
  ); // Dependencies

  // Expose methods via ref
  useImperativeHandle(
    ref,
    () => ({
      insertEmoji,
      getEditor: () => editorInstance,
      focus: focusEditor,
      insertMention: insertMentionCallback, // Expose insertMention
    }),
    [editorInstance, insertEmoji, focusEditor, insertMentionCallback],
  ); // Add dependencies

  // Setup editor instance, paste/keydown listeners, and clipboard matchers
  useEffect(() => {
    if (quillRef.current) {
      const editor = quillRef.current.getEditor();
      setEditorInstance(editor);
      logDebug("Editor instance available.");

      focusEditor();

      // --- Handle undo/redo operations safely ---
      const handleHistoryChange = () => {
        // Ensure selection is valid after undo/redo
        requestAnimationFrame(() => {
          try {
            const selection = editor.getSelection();
            if (!selection) {
              // If no valid selection, set to end of content
              const length = editor.getLength();
              if (length > 0) {
                editor.setSelection(length - 1, 0, "silent");
                logDebug("Reset selection after history change");
              }
            }
          } catch (e) {
            // If error occurs, reset to safe position
            logDebug("Selection error after undo/redo:", e);
            try {
              const length = editor.getLength();
              if (length > 0) {
                editor.setSelection(Math.max(0, length - 1), 0, "silent");
                logDebug("Recovered from selection error after history change");
              }
            } catch (recoveryError) {
              logError("Failed to recover selection:", recoveryError);
              // As last resort, blur and refocus to reset state
              editor.blur();
              setTimeout(() => editor.focus(), 10);
            }
          }
        });
      };

      // --- Quill Event Handlers (Custom Events) ---
      // Listen for text changes that might be from undo/redo
      const textChangeHandler = (_delta: any, _oldDelta: any, source: string) => {
        if (source === "user") {
          handleHistoryChange();
        }
      };

      // Register Quill custom event listeners
      editor.on("text-change", textChangeHandler);

      // --- Native Paste Handler ---
      const handleNativePaste = (event: ClipboardEvent) => {
        if (!event.clipboardData) return;
        const items = event.clipboardData.items;
        let filePasted = false;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === "file") {
            const file = item.getAsFile();
            if (!file) continue;

            filePasted = true;
            event.preventDefault(); // Stop default paste behavior for files
            event.stopPropagation();

            if (item.type.startsWith("image/")) {
              // Handle image paste
              const range = editor.getSelection(true) || { index: 0, length: 0 };
              if (onPasteImageUpload) {
                logDebug("Pasting image: Using custom upload handler for:", file.name);
                onPasteImageUpload(file)
                  .then((imageUrl) => {
                    logDebug("Image upload success, URL:", imageUrl);
                    if (showToolbar) {
                      editor.insertEmbed(range.index, "image", imageUrl, "user");
                      editor.setSelection(range.index + 1, 0, "user");
                    }
                  })
                  .catch((error) => {
                    logError("Error uploading pasted image:", error);
                  });
              } else {
                // Fallback to base64 if no upload handler provided
                logWarn(
                  "Pasting image: No onPasteImageUpload provided, using base64 fallback.",
                );
                const reader = new FileReader();
                reader.onload = (e) => {
                  const base64Src = e.target?.result as string;
                  if (base64Src) {
                    editor.insertEmbed(range.index, "image", base64Src, "user");
                    editor.setSelection(range.index + 1, 0, "user");
                  }
                };
                reader.onerror = (e) =>
                  logError("Error reading pasted file for base64:", e);
                reader.readAsDataURL(file);
              }
              // break; // Handle only the first image file found
            } else {
              // Handle non-image file paste
              logDebug("Pasting non-image file:", item.type, file.name);
              if (onPasteFileUpload) {
                onPasteFileUpload(file);
              } else {
                logWarn("No onPasteFileUpload handler provided for file:", file.name);
                // Consider default behavior or placeholder insertion here
              }
              // break; // Handle only the first non-image file found
            }
          }
        }
        if (!filePasted) {
          const plainText = event.clipboardData.getData("text/plain");
          const htmlText = event.clipboardData.getData("text/html");
          const mergedText = htmlText ? htmlToPlainText(htmlText) : "";
          let textToInsert = plainText || mergedText;

          if (
            mergedText &&
            (!plainText || (!plainText.includes("\n") && mergedText.includes("\n")))
          ) {
            // Prefer HTML-derived text when it preserves line breaks better
            textToInsert = mergedText;
          }

          if (textToInsert) {
            const normalizedText = textToInsert.replace(/\r\n?/g, "\n");
            const selection = editor.getSelection(true) || {
              index: editor.getLength(),
              length: 0,
            };

            logDebug(
              "Pasting text as plain content (formatting stripped).",
              normalizedText.substring(0, 50),
            );

            event.preventDefault();
            event.stopPropagation();

            if (selection.length) {
              editor.deleteText(selection.index, selection.length, "user");
            }

            editor.insertText(selection.index, normalizedText, "user");
            editor.setSelection(selection.index + normalizedText.length, 0, "silent");
            return;
          }

          logDebug("Paste event did not contain files or text for custom handling.");
        }
      };

      // --- Native Keydown Handler (Enter/Shift+Enter + Undo/Redo) ---
      const handleNativeKeyDown = (event: KeyboardEvent) => {
        if (event.defaultPrevented) return;

        // Handle undo/redo operations
        const isUndo =
          (event.ctrlKey || event.metaKey) && event.key === "z" && !event.shiftKey;
        const isRedo =
          (event.ctrlKey || event.metaKey) &&
          ((event.key === "z" && event.shiftKey) || event.key === "y");

        if (isUndo || isRedo) {
          // Delay to let Quill process the undo/redo first
          setTimeout(() => {
            handleHistoryChange();
          }, 10);
          return; // Let Quill handle the actual undo/redo
        }

        const currentSendBehavior = sendKeyBehaviorRef.current;
        const currentOnSend = onSendRef.current;

        // Handle Delete/Backspace on empty editor
        if (
          (event.key === "Backspace" || event.key === "Delete") &&
          onDeleteWithEmpty
        ) {
          const length = editor.getLength();
          const text = editor.getText().trim();
          if (length <= 1 && text === "") {
            logDebug("Native KeyDown: Delete/Backspace on empty editor");
            setTimeout(() => onDeleteWithEmpty(), 0); // Notify parent after event
          }
        }

        if (event.key === "Backspace") {
          const selection = editor.getSelection(true);
          if (selection && selection.length === 0) {
            const start = selection.index;
            if (start >= 2) {
              const beforeMention = editor.getContents(start - 2, 2);
              const ops = beforeMention?.ops ?? [];
              const isMentionOp =
                ops.length === 2 &&
                typeof ops[0].insert === "object" &&
                ops[0].insert !== null &&
                "mention" in ops[0].insert;
              const trailingText = ops[1].insert;
              const hasTrailingSpacer =
                typeof trailingText === "string" &&
                (trailingText.includes(MENTION_CURSOR_CHAR) ||
                  /\s$/.test(trailingText));
              if (isMentionOp && hasTrailingSpacer) {
                event.preventDefault();
                event.stopPropagation();
                editor.deleteText(start - 2, 2, "user");
                logDebug(
                  "Native KeyDown: Backspace removed mention and trailing space",
                );
                return;
              }
            }
          }
        }

        if (event.key === "Enter") {
          const isComposingInput = event.isComposing || event.keyCode === 229;
          if (isComposingInput) {
            logDebug("Native KeyDown: Enter ignored while IME composition is active.");
            return;
          }
          const isShiftPressed = event.shiftKey;

          if (!isShiftPressed && currentSendBehavior === "enter") {
            const isMentionListVisible = Boolean(
              document.querySelector(".mention-list-container")?.hasChildNodes(),
            );
            if (isMentionListVisible) {
              logDebug("Mention list is visible, preventing send action.");
              return;
            }
            // Handle: Enter sends
            if (currentOnSend) {
              event.preventDefault();
              event.stopPropagation();
              logDebug("Native KeyDown: Enter -> Triggering onSend");
              setTimeout(() => currentOnSend(), 0); // Use timeout to avoid timing issues
            }
          } else if (isShiftPressed && currentSendBehavior === "shift-enter") {
            // Handle: Shift+Enter sends
            if (currentOnSend) {
              event.preventDefault();
              event.stopPropagation();
              logDebug("Native KeyDown: Shift+Enter -> Triggering onSend");
              setTimeout(() => currentOnSend(), 0); // Use timeout
            }
          } else if (isShiftPressed && currentSendBehavior === "enter") {
            // Handle: Shift+Enter for newline (when Enter sends)
            const currentRange = editor.getSelection();
            if (currentRange) {
              // Special handling needed for newline after certain formats like emoji
              const formats = editor.getFormat(currentRange.index);
              if (formats && formats["emoji"]) {
                event.preventDefault();
                event.stopPropagation();
                logDebug("Native KeyDown: Shift+Enter -> Newline after Emoji");
                editor.insertText(currentRange.index, "\n", "user");
                editor.setSelection(currentRange.index + 1, 0, "user");
                return; // Explicitly handled
              }
            }
            // Otherwise, allow Quill's default Shift+Enter (usually newline)
            logDebug(
              "Native KeyDown: Shift+Enter -> Allowing default newline behavior",
            );
          } else if (!isShiftPressed && currentSendBehavior === "shift-enter") {
            // Handle: Enter for newline (when Shift+Enter sends)
            const currentRange = editor.getSelection();
            if (currentRange) {
              // Special handling needed for newline after certain formats like emoji
              const formats = editor.getFormat(currentRange.index);
              if (formats && formats["emoji"]) {
                event.preventDefault();
                event.stopPropagation();
                logDebug("Native KeyDown: Enter -> Newline after Emoji");
                editor.insertText(currentRange.index, "\n", "user");
                editor.setSelection(currentRange.index + 1, 0, "user");
                return; // Explicitly handled
              }
            }
            // Otherwise, allow Quill's default Enter (usually newline)
            logDebug("Native KeyDown: Enter -> Allowing default newline behavior");
          }
        }
      };

      // --- Native Copy Handler ---
      const handleNativeCopy = (event: ClipboardEvent) => {
        const selection = editor.getSelection();
        if (selection && selection.length > 0 && event.clipboardData) {
          logDebug("Intercepting native copy event.");

          // Get delta of the selected content to analyze its structure
          const delta = editor.getContents(selection.index, selection.length);
          let isSimpleMultilineText = true;

          // Check if the content is just text inserts possibly separated by single newlines
          // Ensure delta.ops exists before iterating
          if (delta.ops) {
            delta.ops.forEach((op) => {
              // Check if it's just a text insert or a mention
              if (typeof op.insert !== "string" && !op.insert?.mention) {
                // If it's not a string or a mention blot, it's complex
                isSimpleMultilineText = false;
                return;
              }
              // Check for block-level attributes that cause extra spacing
              if (
                op.attributes &&
                (op.attributes.blockquote ||
                  op.attributes.list ||
                  op.attributes["code-block"] ||
                  op.attributes.header)
              ) {
                isSimpleMultilineText = false;
                return;
              }
            });
          } else {
            // If delta.ops is somehow undefined, treat as complex to be safe
            isSimpleMultilineText = false;
          }

          // If it appears to be simple multi-line text (no complex blocks, just text/mentions)
          if (
            isSimpleMultilineText &&
            editor.getText(selection.index, selection.length).includes("\n")
          ) {
            const plainText = editor.getText(selection.index, selection.length);
            logDebug(
              "Copying simple multi-line text as plain text with single newlines.",
            );
            event.preventDefault(); // Prevent Quill's default HTML copy
            event.clipboardData.setData("text/plain", plainText);
            // Optionally set minimal HTML data as well
            // event.clipboardData.setData('text/html', plainText.replace(/\n/g, '<br>'));
          } else {
            logDebug(
              "Copying potentially rich text, allowing Quill's default copy handler.",
            );
            // Let Quill handle copying potentially rich content (formatting, images, complex blocks)
          }
        }
      };

      // --- Native DOM Event Listeners ---
      const editorRoot = editor.root;

      // Register native DOM event listeners
      editorRoot.addEventListener("paste", handleNativePaste, true);
      editorRoot.addEventListener("keydown", handleNativeKeyDown, true);
      editorRoot.addEventListener("copy", handleNativeCopy, true);

      logDebug(
        "Event listeners registered: Quill (text-change) and DOM (paste, keydown, copy)",
      );

      // --- Quill Clipboard Matchers (for non-file pastes) ---
      if (editor.clipboard) {
        // Add a SPAN matcher with high priority to strip all styles
        editor.clipboard.addMatcher("SPAN", (node, delta) => {
          // For SPAN elements, we want to strip all styling
          const ops = delta.ops || [];
          ops.forEach((op) => {
            if (op.attributes) {
              // Remove all style-related attributes from SPAN
              delete op.attributes.background;
              delete op.attributes["background-color"];
              delete op.attributes.color;
              delete op.attributes.style;
            }
          });
          return delta;
        });

        // Handle pasted text nodes (e.g., for emoji conversion)
        editor.clipboard.addMatcher(Node.TEXT_NODE, (node) => {
          const text = node.data;
          const copyText = JSON.parse(JSON.stringify(text));
          // eslint-disable-next-line
          const matched = emojiMatcher(copyText);
          if (matched) logDebug("Clipboard: Matched emoji in text node.");
          // eslint-disable-next-line
          return (matched || new Delta().insert(copyText)) as any;
        });

        // Handle pasted IMG elements - check if they are twemoji
        editor.clipboard.addMatcher("IMG", (node, delta) => {
          if (!(node instanceof HTMLImageElement)) {
            return delta;
          }

          // Check if this is a twemoji image
          const isTwemoji =
            node.classList.contains("emojione") ||
            node.classList.contains("im-emojione") ||
            (node.src && node.src.includes("twemoji"));

          if (isTwemoji && node.alt) {
            // Convert twemoji image to emoji blot
            logDebug("Clipboard: Converting twemoji image to emoji blot:", node.alt);
            // eslint-disable-next-line
            return new Delta().insert({ emoji: node.alt }) as any;
          }

          // Not a twemoji, let it be handled as normal image
          return delta;
        });

        // Handle pasted HTML elements (strip tags, convert emojis)
        editor.clipboard.addMatcher(Node.ELEMENT_NODE, (node, delta) => {
          // Images are handled by the IMG matcher above

          if (node.nodeName === "P") {
            logDebug("Clipboard ELEMENT_NODE: Found P, returning original delta.");
            return delta;
          }

          // Check if it's our specific mention blot span
          if (
            node.nodeName === "SPAN" &&
            node instanceof HTMLElement && // Type guard
            node.classList.contains("im-mention-blot") &&
            node.dataset.id &&
            node.dataset.value
          ) {
            const mentionData: MentionData = {
              id: node.dataset.id,
              value: node.dataset.value,
            };
            logDebug(
              "Clipboard: Identified mention element, reconstructing blot:",
              mentionData,
            );
            // Return a DeltaStatic object to insert the mention blot
            // eslint-disable-next-line
            return { ops: [{ insert: { mention: mentionData } }] } as any;
          }

          // Check for DIV elements that might contain mixed text and emoji images
          if (node.nodeName === "DIV" && node instanceof HTMLElement) {
            const newDelta = new Delta();
            let hasContent = false;

            // Process child nodes manually to preserve emoji images but strip styles
            node.childNodes.forEach((child) => {
              if (child.nodeType === Node.TEXT_NODE && child.textContent) {
                const matched = emojiMatcher(child.textContent);
                if (matched) {
                  // eslint-disable-next-line
                  newDelta.concat(matched as any);
                } else {
                  newDelta.insert(child.textContent);
                }
                hasContent = true;
              } else if (
                child.nodeName === "IMG" &&
                child instanceof HTMLImageElement
              ) {
                // Check if it's a twemoji
                const isTwemoji =
                  child.classList.contains("emojione") ||
                  child.classList.contains("im-emojione") ||
                  (child.src && child.src.includes("twemoji"));

                if (isTwemoji && child.alt) {
                  newDelta.insert({ emoji: child.alt });
                  hasContent = true;
                }
              } else if (child.nodeName === "SPAN" && child.textContent) {
                // For SPAN children, extract text without styles
                const matched = emojiMatcher(child.textContent);
                if (matched) {
                  // eslint-disable-next-line
                  newDelta.concat(matched as any);
                } else {
                  newDelta.insert(child.textContent);
                }
                hasContent = true;
              }
            });

            if (hasContent) {
              logDebug("Clipboard: Processed DIV with mixed content (styles stripped)");
              // eslint-disable-next-line
              return newDelta as any;
            }
          }

          const text = node.textContent || "";
          const copyText = text.replace(/\\n/g, "\n");
          logDebug(
            "Clipboard: Processing ELEMENT_NODE, extracting text:",
            // eslint-disable-next-line
            text.substring(0, 50) + (text.length > 50 ? "..." : ""),
          );
          // eslint-disable-next-line
          const matched = emojiMatcher(copyText);
          if (matched) logDebug("Clipboard: Matched emoji in element node text.");
          // eslint-disable-next-line
          return (matched || delta) as any;
        });
        logDebug("Clipboard matchers added.");
      } else {
        logError("Clipboard module not available.");
      }

      // --- Cleanup All Event Listeners ---
      return () => {
        // Remove native DOM event listeners
        editorRoot.removeEventListener("paste", handleNativePaste, true);
        editorRoot.removeEventListener("keydown", handleNativeKeyDown, true);
        editorRoot.removeEventListener("copy", handleNativeCopy, true);

        // Remove Quill custom event listeners
        editor.off("text-change", textChangeHandler);

        logDebug("All event listeners removed: Quill and DOM");
      };
    }
    // Effect runs once on mount; listeners use refs for prop changes
  }, []);

  // Quill Modules Configuration (Toolbar only, keyboard handled manually)
  const quillModules = useMemo(() => {
    const baseModules: any = {
      // No keyboard module configured here
    };
    // Toolbar structure is defined here; visibility controlled by CSS
    baseModules.toolbar = [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image"],
    ];
    // eslint-disable-next-line
    return baseModules;
  }, []); // Toolbar structure is static

  // Context Menu Handler for React event
  const handleReactContextMenu = (event: React.MouseEvent<HTMLDivElement>) => {
    logDebug("React Context Menu event triggered.");
    if (onContextMenu) {
      onContextMenu(event);
    }
  };

  return (
    <div
      className={`chat-input-container ${
        !showToolbar ? "hide-toolbar" : ""
      } ${className}`}
      onContextMenu={handleReactContextMenu}
    >
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={quillModules}
        placeholder={placeholder}
      />
      {editorInstance && (
        <MentionSuggestions
          editor={editorInstance}
          fetchUsers={fetchMentionUsers}
          renderItem={renderMentionItem}
          errorContent={mentionErrorContent}
          enableLogs={enableLogs}
        />
      )}
    </div>
  );
});

RichTextChatInput.displayName = "RichTextChatInput";

const MarkdownChatInput = forwardRef<ChatInputRef, ChatInputProps>((props, ref) => {
  const {
    className = "",
    value,
    onChange,
    placeholder = "",
    showToolbar = true,
    sendKeyBehavior = "enter",
    onSend,
    enableLogs = true,
    onContextMenu,
  } = props;

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const logDebug = useCallback(
    (...args: unknown[]) => {
      if (enableLogs) {
        // eslint-disable-next-line no-console
        console.log("[ChatInput][Markdown]", ...args);
      }
    },
    [enableLogs],
  );

  const insertPlainText = useCallback(
    (text: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const currentValue = value ?? "";
      const nextValue = currentValue.slice(0, start) + text + currentValue.slice(end);
      const cursor = start + text.length;
      onChange(nextValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    },
    [value, onChange],
  );

  const wrapSelection = useCallback(
    (prefix: string, suffix: string, placeholderText = "") => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const currentValue = value ?? "";
      const selected = currentValue.slice(start, end);
      const replacement = selected || placeholderText;
      const nextValue =
        currentValue.slice(0, start) +
        prefix +
        replacement +
        suffix +
        currentValue.slice(end);
      const selectionStart = start + prefix.length;
      const selectionEnd = selectionStart + replacement.length;

      onChange(nextValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart, selectionEnd);
      });
    },
    [value, onChange],
  );

  const applyLinePrefix = useCallback(
    (prefix: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const currentValue = value ?? "";
      const hasSelection = start !== end;
      const selection = hasSelection ? currentValue.slice(start, end) : "";
      const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
      const lookupIndex = hasSelection ? end : start;
      const nextLineBreak = currentValue.indexOf("\n", lookupIndex);
      const lineEnd = nextLineBreak === -1 ? currentValue.length : nextLineBreak;

      const targetStart = hasSelection ? start : lineStart;
      const targetEnd = hasSelection ? end : lineEnd;
      const targetText = hasSelection
        ? selection
        : currentValue.slice(lineStart, lineEnd);

      const formatted = targetText
        .split("\n")
        .map((line) => {
          if (!line) {
            return prefix;
          }
          return line.startsWith(prefix) ? line : `${prefix}${line}`;
        })
        .join("\n");

      const nextValue =
        currentValue.slice(0, targetStart) + formatted + currentValue.slice(targetEnd);

      onChange(nextValue);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(targetStart, targetStart + formatted.length);
      });
    },
    [value, onChange],
  );

  const applyOrderedList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentValue = value ?? "";
    const hasSelection = start !== end;
    const lineStart = currentValue.lastIndexOf("\n", start - 1) + 1;
    const lookupIndex = hasSelection ? end : start;
    const nextLineBreak = currentValue.indexOf("\n", lookupIndex);
    const lineEnd = nextLineBreak === -1 ? currentValue.length : nextLineBreak;

    const targetStart = hasSelection ? start : lineStart;
    const targetEnd = hasSelection ? end : lineEnd;
    const rawText = hasSelection
      ? currentValue.slice(start, end)
      : currentValue.slice(lineStart, lineEnd);

    const formatted = rawText
      .split("\n")
      .map((line, idx) => {
        const prefix = `${idx + 1}. `;
        if (!line) {
          return prefix;
        }
        return /^\d+\.\s/.test(line) ? line : `${prefix}${line}`;
      })
      .join("\n");

    const nextValue =
      currentValue.slice(0, targetStart) + formatted + currentValue.slice(targetEnd);

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(targetStart, targetStart + formatted.length);
    });
  }, [value, onChange]);

  const insertLink = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentValue = value ?? "";
    const selected = currentValue.slice(start, end) || "text";
    const template = `[${selected}](https://)`;
    const nextValue = currentValue.slice(0, start) + template + currentValue.slice(end);

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const urlStart = start + template.indexOf("(") + 1;
      const urlEnd = start + template.length - 1;
      textarea.setSelectionRange(urlStart, urlEnd);
    });
  }, [value, onChange]);

  const insertImage = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const currentValue = value ?? "";
    const selected = currentValue.slice(start, end) || "alt";
    const template = `![${selected}](https://)`;
    const nextValue = currentValue.slice(0, start) + template + currentValue.slice(end);

    onChange(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      const urlStart = start + template.indexOf("(") + 1;
      const urlEnd = start + template.length - 1;
      textarea.setSelectionRange(urlStart, urlEnd);
    });
  }, [value, onChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== "Enter") return;
      const nativeEvent = event.nativeEvent;
      const isComposingInput = nativeEvent.isComposing || nativeEvent.keyCode === 229;
      if (isComposingInput) {
        logDebug("Markdown Input: Enter ignored while IME composition is active.");
        return;
      }
      if (sendKeyBehavior === "enter" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        logDebug("Markdown Input: Enter -> Trigger onSend");
        onSend?.();
      } else if (sendKeyBehavior === "shift-enter" && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        logDebug("Markdown Input: Shift+Enter -> Trigger onSend");
        onSend?.();
      }
    },
    [sendKeyBehavior, onSend, logDebug],
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  useImperativeHandle(
    ref,
    () => ({
      insertEmoji: (emoji) => {
        insertPlainText(emoji);
      },
      getEditor: () => null,
      focus: (moveToEnd = true) => {
        const textarea = textareaRef.current;
        if (!textarea) return;
        textarea.focus();
        if (moveToEnd) {
          const length = value?.length ?? 0;
          textarea.setSelectionRange(length, length);
        }
      },
      insertMention: (mentionData) => {
        insertPlainText(`@${mentionData.value} `);
      },
    }),
    [insertPlainText, value],
  );

  const toolbarItems = useMemo(
    () => [
      { key: "h1", label: "H1", onClick: () => applyLinePrefix("# ") },
      { key: "h2", label: "H2", onClick: () => applyLinePrefix("## ") },
      { key: "h3", label: "H3", onClick: () => applyLinePrefix("### ") },
      { key: "bold", label: "B", onClick: () => wrapSelection("**", "**", "bold") },
      { key: "italic", label: "I", onClick: () => wrapSelection("_", "_", "italic") },
      {
        key: "underline",
        label: "U",
        onClick: () => wrapSelection("<u>", "</u>", "underline"),
      },
      { key: "bullet", label: "Bullets", onClick: () => applyLinePrefix("- ") },
      { key: "order", label: "Ordered", onClick: applyOrderedList },
      { key: "quote", label: "Quote", onClick: () => applyLinePrefix("> ") },
      {
        key: "code",
        label: "Code Block",
        onClick: () => wrapSelection("```\n", "\n```", "code"),
      },
      { key: "link", label: "Link", onClick: insertLink },
      { key: "image", label: "Image", onClick: insertImage },
    ],
    [applyLinePrefix, wrapSelection, applyOrderedList, insertLink, insertImage],
  );

  return (
    <div
      className={clsx("chat-input-container markdown-mode", className)}
      onContextMenu={onContextMenu}
    >
      {showToolbar && (
        <div className="markdown-toolbar">
          {toolbarItems.map((item) => (
            <button
              key={item.key}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={item.onClick}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
      <textarea
        ref={textareaRef}
        className="markdown-textarea"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <div className="markdown-hint">
        ## space for heading, - space for list, &gt; space for quote
      </div>
    </div>
  );
});

MarkdownChatInput.displayName = "MarkdownChatInput";

const ChatInput = forwardRef<ChatInputRef, ChatInputProps>((props, ref) => {
  const mode = props.inputMode ?? "rich-text";
  if (mode === "markdown") {
    return <MarkdownChatInput {...props} ref={ref} />;
  }
  return <RichTextChatInput {...props} ref={ref} />;
});

ChatInput.displayName = "ChatInput";

export { ChatInput };
export default ChatInput;
