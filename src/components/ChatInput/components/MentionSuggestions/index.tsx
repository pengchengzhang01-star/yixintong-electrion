import "./styles.css";

import { debounce } from "lodash-es";
import React, { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Quill as QuillClass } from "react-quill";

import { MentionData, MentionItemRenderer } from "../../models/types";
import { MENTION_CURSOR_CHAR } from "../../utils";

// Component props
interface MentionSuggestionsProps {
  editor: InstanceType<typeof QuillClass> | null;
  fetchUsers: (query: string) => Promise<MentionData[]>;
  renderItem?: MentionItemRenderer; // Optional custom renderer
  noResultsContent?: ReactNode; // Optional content for no results
  errorContent?: ReactNode; // Optional content for error state
  enableLogs?: boolean; // Add prop to control logging
}

const MentionSuggestions: React.FC<MentionSuggestionsProps> = ({
  editor,
  fetchUsers,
  renderItem,
  noResultsContent,
  errorContent,
  enableLogs = false, // Destructure and default enableLogs
}) => {
  // State variables
  const [showList, setShowList] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<MentionData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [listPosition, setListPosition] = useState<{
    bottom: number;
    left: number;
  } | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  // Refs for internal state/values that don't need to trigger re-renders on change
  const showListRef = useRef<boolean>(false); // Ref for the list container
  const triggerIndex = useRef<number | null>(null); // Index where @ was typed
  const listRef = useRef<HTMLDivElement>(null); // Ref for the list container
  const isMentionActiveRef = useRef<boolean>(false); // Tracks if mention mode is active
  const usersRef = useRef<MentionData[]>([]); // Holds current user list for handlers
  const highlightedIndexRef = useRef<number>(0); // Holds current index for handlers
  const queryRef = useRef<string>(""); // Holds current query for handlers
  const highlightedItemRef = useRef<HTMLElement | null>(null); // Ref for the highlighted DOM element
  const pendingEnterSelectionRef = useRef<MentionData | null>(null); // Stores pending selection while IME composition ends

  // Ref to store Delta class constructor dynamically
  const DeltaClassRef = useRef<any>(null);

  // Conditional logging helper
  const logDebug = useCallback(
    (...args: any[]) => {
      if (enableLogs) {
        // eslint-disable-next-line
        console.log("[MentionSuggestions]", ...args);
      }
    },
    [enableLogs],
  );

  // Get Delta class constructor
  useEffect(() => {
    if (editor && !DeltaClassRef.current) {
      try {
        DeltaClassRef.current = (editor.constructor as any).import("delta");
        logDebug("Delta class constructor obtained."); // Use logger
      } catch (e) {
        console.error(
          "MentionSuggestions: Failed to obtain Delta class from editor instance:",
          e,
        );
      }
    }
  }, [editor, logDebug]); // Add logDebug to dependencies

  // Keep refs updated when state changes
  useEffect(() => {
    showListRef.current = showList;
  }, [showList]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  useEffect(() => {
    highlightedIndexRef.current = highlightedIndex;
  }, [highlightedIndex]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  // Debounced fetch function
  const debouncedFetch = useCallback(
    debounce(async (currentQuery: string) => {
      logDebug(`>>> Debounced fetch executing for query: "${currentQuery}"`); // Use logger
      setError(null);
      try {
        const results = await fetchUsers(currentQuery);
        if (isMentionActiveRef.current && triggerIndex.current !== null) {
          setUsers(results);
          setHighlightedIndex(0);
          setShowList(true);
        } else {
          logDebug("Mention no longer active, ignoring fetch results"); // Use logger
        }
      } catch (err) {
        console.error("MentionSuggestions: Error fetching mention users:", err);
        if (isMentionActiveRef.current && triggerIndex.current !== null) {
          setError("Failed to load users.");
          setUsers([]);
          setShowList(true);
        }
      }
    }, 300),
    [fetchUsers, logDebug], // Add logDebug to dependencies
  );

  // Function to insert the selected mention
  const insertMention = useCallback(
    (mentionData: MentionData) => {
      const Delta = DeltaClassRef.current;
      if (!editor || triggerIndex.current === null || !Delta) {
        // Use console.warn directly as it indicates a potential issue
        console.warn(
          "MentionSuggestions: Cannot insert mention - editor, trigger index, or Delta class not available.",
        );
        return;
      }

      const insertAt = triggerIndex.current;
      const currentQuery = queryRef.current;
      const queryLength = currentQuery.length;
      logDebug(
        `InsertMention: Inserting @${mentionData.value} replacing "@${currentQuery}" at index ${insertAt}`,
      ); // Use logger

      const delta = new Delta()
        .retain(insertAt)
        .delete(queryLength + 1)
        .insert({ mention: mentionData })
        .insert(MENTION_CURSOR_CHAR);

      logDebug("InsertMention: Applying delta:", JSON.stringify(delta)); // Use logger
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      editor.updateContents(delta, "user");
      editor.setSelection(insertAt + 2, 0, "user");
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(() => editor.focus());
      } else {
        setTimeout(() => editor.focus(), 0);
      }

      logDebug("InsertMention: Hiding list and resetting state."); // Use logger
      isMentionActiveRef.current = false;
      triggerIndex.current = null;
      setShowList(false);
      setQuery("");
      setUsers([]);
      setError(null);
    },
    [editor, logDebug],
  ); // Add logDebug to dependencies

  // Effect to scroll the highlighted item into view
  useEffect(() => {
    if (showList && highlightedItemRef.current && listRef.current) {
      const listContainer = listRef.current;
      const highlightedItem = highlightedItemRef.current;

      const containerRect = listContainer.getBoundingClientRect();
      const itemRect = highlightedItem.getBoundingClientRect();

      // Scroll up or down as needed
      const scrollPadding = 8; // Optional padding
      if (itemRect.top < containerRect.top) {
        listContainer.scrollTop -= containerRect.top - itemRect.top + scrollPadding;
      } else if (itemRect.bottom > containerRect.bottom) {
        listContainer.scrollTop +=
          itemRect.bottom - containerRect.bottom + scrollPadding;
      }
    }
  }, [highlightedIndex, showList]); // Run when index or list visibility changes

  // Effect for handling text changes and keyboard events
  useEffect(() => {
    if (!editor) return;
    logDebug("Setting up listeners for text-change and keydown."); // Use logger

    const handleTextChange = (delta: any, _: unknown, source: string) => {
      if (source !== "user") return;

      const currentSelection = editor.getSelection(true);
      if (!currentSelection) return;

      const lastOp = delta.ops[delta.ops.length - 1];
      const isAtInsert = lastOp && lastOp.insert && typeof lastOp.insert === "string";

      logDebug(
        `Mention Check - Before: showList=${showListRef.current}, triggerIndex=${triggerIndex.current}, isActiveRef=${isMentionActiveRef.current}`,
      ); // Use logger

      if (isAtInsert && lastOp.insert === "@") {
        logDebug("Mention Trigger: Typed @"); // Use logger
        isMentionActiveRef.current = true;
        triggerIndex.current = currentSelection.index - 1;
        setShowList(true);
        setQuery("");
        setUsers([]);
        setError(null);
        logDebug("Mention Trigger: Calling debouncedFetch('')"); // Use logger
        debouncedFetch("");

        const bounds = editor.getBounds(currentSelection.index);
        if (bounds) {
          const editorBounds = (
            editor.root.parentNode as HTMLElement
          ).getBoundingClientRect();
          const rootBounds = editor.root.getBoundingClientRect();
          logDebug("Bounds for positioning:", { bounds, rootBounds, editorBounds }); // Use logger
          setListPosition({
            bottom: rootBounds.height - bounds.top,
            left: bounds.left + rootBounds.left - editorBounds.left,
          });
        }
      } else if (isMentionActiveRef.current && triggerIndex.current !== null) {
        // --- In Mention Mode ---
        const startIndex = triggerIndex.current + 1;
        const length = currentSelection.index - startIndex;

        // Deactivate if cursor moves before @ or length is invalid
        if (length < 0) {
          isMentionActiveRef.current = false;
          triggerIndex.current = null;
          setShowList(false);
          return;
        }

        const textSinceTrigger = editor.getText(startIndex, length);
        const containsSpace = /\s/.test(textSinceTrigger);

        // Deactivate if space is typed
        if (containsSpace) {
          isMentionActiveRef.current = false;
          triggerIndex.current = null;
          setShowList(false);
          return;
        }

        // Update query and fetch suggestions
        setQuery(textSinceTrigger);
        logDebug(`Mention Trigger: Calling debouncedFetch("${textSinceTrigger}")`); // Use logger
        debouncedFetch(textSinceTrigger);

        // Recalculate list position if needed (e.g., if editor size changes)
        const bounds = editor.getBounds(currentSelection.index);
        if (bounds) {
          const editorBounds = (
            editor.root.parentNode as HTMLElement
          ).getBoundingClientRect();
          const rootBounds = editor.root.getBoundingClientRect();
          setListPosition({
            bottom: rootBounds.height - bounds.top,
            left: bounds.left + rootBounds.left - editorBounds.left,
          });
        }
      } else {
        // --- Not Typing @ or Mention Query ---
        // Ensure mention mode is deactivated if it was previously active
        if (isMentionActiveRef.current) {
          logDebug(
            "Mention Check: Exited active mode (e.g., @ deleted or cursor moved).",
          ); // Use logger
          isMentionActiveRef.current = false;
          triggerIndex.current = null;
          setShowList(false);
        }
      }
    };

    // Handler for keyboard events when suggestion list is shown
    const handleKeyDown = (event: KeyboardEvent) => {
      logDebug("KeyDown Event:", event.key, showListRef.current, usersRef.current); // Use logger
      // Use refs for checking state at time of event
      if (!showListRef.current || !usersRef.current.length) return;

      // Prevent default browser/editor behavior for handled keys
      if (["ArrowUp", "ArrowDown", "Enter", "Escape", "Tab"].includes(event.key)) {
        event.preventDefault();
        event.stopPropagation(); // Important: Prevent ChatInput's native listener from firing
      }

      switch (event.key) {
        case "ArrowUp":
          setHighlightedIndex((current) =>
            current > 0 ? current - 1 : usersRef.current.length - 1,
          );
          break;
        case "ArrowDown":
          setHighlightedIndex((current) =>
            current < usersRef.current.length - 1 ? current + 1 : 0,
          );
          break;
        case "Enter":
        case "Tab": {
          // Treat Tab like Enter for selection
          const selectedUser = usersRef.current[highlightedIndexRef.current];
          if (selectedUser) {
            const isComposingInput = event.isComposing || event.keyCode === 229;
            if (isComposingInput) {
              // Wait for compositionend to fire so the IME text can be fully committed.
              pendingEnterSelectionRef.current = selectedUser;
            } else {
              pendingEnterSelectionRef.current = null;
              insertMention(selectedUser);
            }
          }
          // List hiding is handled within insertMention
          break;
        }
        case "Escape":
          // Hide list and reset state on Escape
          isMentionActiveRef.current = false;
          triggerIndex.current = null;
          setShowList(false);
          pendingEnterSelectionRef.current = null;
          break;
      }
    };

    // Add listeners
    editor.on("text-change", handleTextChange);
    // Add keydown listener to capture phase to handle before ChatInput's listener
    editor.root.addEventListener("keydown", handleKeyDown, true);

    // Cleanup function
    return () => {
      logDebug("Cleaning up listeners for text-change and keydown."); // Use logger
      editor.off("text-change", handleTextChange);
      editor.root.removeEventListener("keydown", handleKeyDown, true); // Use same phase for removal
      debouncedFetch.cancel(); // Cancel any pending debounced calls
    };
    // Dependencies for setting up/tearing down listeners
  }, [editor, insertMention, debouncedFetch, logDebug]);

  useEffect(() => {
    if (!editor) return;

    const handleCompositionEnd = () => {
      if (pendingEnterSelectionRef.current) {
        const mentionToInsert = pendingEnterSelectionRef.current;
        pendingEnterSelectionRef.current = null;
        insertMention(mentionToInsert);
      }
    };

    editor.root.addEventListener("compositionend", handleCompositionEnd);

    return () => {
      editor.root.removeEventListener("compositionend", handleCompositionEnd);
    };
  }, [editor, insertMention]);

  // Component Rendering
  return (
    <div className="mention-suggestions-container">
      {/* Only render list if active and position calculated */}
      {showList && listPosition && (
        <div
          ref={listRef} // Ref for scrolling
          className="mention-list-container"
          style={{
            position: "absolute", // Position relative to ChatInput container
            left: `${listPosition.left}px`,
            bottom: `${listPosition.bottom}px`, // Position below the current line
          }}
        >
          {error ? (
            // Display error content
            <div className="mention-error">{errorContent || error}</div>
          ) : users.length > 0 ? (
            // Display user list
            <ul className="mention-list">
              {users.map((user, index) => {
                const isHighlighted = index === highlightedIndex;
                const handleClick = () => insertMention(user);
                const handleMouseEnter = () => setHighlightedIndex(index);

                // Use custom renderer if provided, otherwise default
                return renderItem ? (
                  renderItem({
                    item: user,
                    index,
                    isHighlighted,
                    onClick: handleClick,
                    onMouseEnter: handleMouseEnter,
                    // Pass ref to custom renderer for highlighted item
                    ref: isHighlighted
                      ? (el) => {
                          highlightedItemRef.current = el;
                        }
                      : undefined,
                  })
                ) : (
                  // Default list item rendering
                  <li
                    key={user.id}
                    className={`mention-list-item ${
                      isHighlighted ? "highlighted" : ""
                    }`}
                    onClick={handleClick}
                    onMouseEnter={handleMouseEnter}
                    // Set ref for highlighted item for scrolling
                    ref={
                      isHighlighted
                        ? (el) => {
                            highlightedItemRef.current = el;
                          }
                        : undefined
                    }
                  >
                    {`@${user.value}`}
                  </li>
                );
              })}
            </ul>
          ) : (
            // Display no results content if applicable
            noResultsContent && (
              <div className="mention-no-results">{noResultsContent}</div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default MentionSuggestions;
