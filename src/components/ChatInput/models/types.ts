import { MouseEvent, ReactNode } from "react";
import { Quill as QuillClass } from "react-quill";

export interface MentionData {
  id: string;
  value: string;
  // Add more fields as needed, e.g., avatar
  [key: string]: any;
}

// Props for MentionItemRenderer
export interface MentionItemRendererProps {
  item: MentionData;
  index: number;
  isHighlighted: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  // Add ref prop to get the DOM element of the highlighted item
  ref?: React.Ref<HTMLElement>;
}

// Type for the mention item rendering function
export type MentionItemRenderer = (props: MentionItemRendererProps) => ReactNode;

// Type for the image upload handler function
export type ImageUploadHandler = (file: File) => Promise<string>;
// Type for the generic file upload handler function
export type FileUploadHandler = (file: File) => Promise<string>;
// Type for specifying send key behavior
export type SendKeyBehavior = "enter" | "shift-enter";

// Ref type definition
export interface ChatInputRef {
  insertEmoji: (emoji: string) => void;
  getEditor: () => InstanceType<typeof QuillClass> | null;
  focus: (moveToEnd?: boolean) => void;
  insertMention: (mentionData: MentionData) => void;
}

export interface ChatInputProps {
  className?: string;
  value: string;
  onChange: (value: string) => void;
  fetchMentionUsers: (query: string) => Promise<MentionData[]>;
  placeholder?: string;
  showToolbar?: boolean;
  onEmojiInsert?: (position: number, emoji: string) => void;
  renderMentionItem?: MentionItemRenderer; // Custom mention item renderer function
  mentionNoResultsContent?: ReactNode; // Content when no mention results
  mentionErrorContent?: ReactNode; // Content on mention fetch error
  onPasteImageUpload?: ImageUploadHandler;
  onPasteFileUpload?: FileUploadHandler;
  sendKeyBehavior?: SendKeyBehavior; // 'enter' or 'shift-enter'
  onSend?: () => void; // Callback when send is triggered
  enableLogs?: boolean; // Enable/disable internal logging
  onDeleteWithEmpty?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLDivElement>) => void;
}
