// ─── Enums (mirrored from schema, used across app) ───────────────────────

export type TimelineVisibility = "PUBLIC" | "PRIVATE" | "PASSWORD";
export type TimelineStatus = "DRAFT" | "PUBLISHED";
export type NodeStatus = "ACTIVE" | "ARCHIVED";
export type BlockType = "TEXT" | "IMAGE" | "VIDEO" | "LINK" | "FILE" | "EMBED";
export type UnlockRuleType = "PREVIOUS_COMPLETED" | "VIDEO_WATCHED" | "PASSWORD" | "DATE" | "CUSTOM";
export type MediaType = "IMAGE" | "VIDEO" | "FILE" | "AUDIO";
export type ReactionType = "HEART" | "FIRE" | "LIGHTBULB" | "CLAP";
export type CollaboratorRole = "OWNER" | "EDITOR" | "CONTRIBUTOR" | "VIEWER";
export type AnalyticsEventType = "VIEW" | "NODE_VIEW" | "NODE_COMPLETE" | "UNLOCK" | "SHARE";

// ─── Block Content Types ────────────────────────────────────────────────────

export interface TextBlockContent {
  text: string;
  format?: "plain" | "markdown";
}

export interface ImageBlockContent {
  url: string;
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface VideoBlockContent {
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  duration?: number;
  provider?: "upload" | "youtube" | "vimeo";
  embedId?: string;
}

export interface LinkBlockContent {
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  favicon?: string;
}

export interface FileBlockContent {
  url: string;
  name: string;
  size: number;
  mimeType: string;
}

export type BlockContent =
  | TextBlockContent
  | ImageBlockContent
  | VideoBlockContent
  | LinkBlockContent
  | FileBlockContent;

// ─── Unlock Rule Configs ────────────────────────────────────────────────────

export interface PreviousCompletedConfig {
  sourceNodeId: string;
}

export interface VideoWatchedConfig {
  sourceNodeId: string;
  minWatchPercentage?: number;
}

export interface PasswordConfig {
  passwordHash: string;
}

export interface DateConfig {
  unlockAt: string; // ISO 8601
}

export type UnlockRuleConfig =
  | PreviousCompletedConfig
  | VideoWatchedConfig
  | PasswordConfig
  | DateConfig
  | Record<string, unknown>;

// ─── API Response Types ─────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ─── Timeline with Relations ────────────────────────────────────────────────

export interface TimelineWithNodes {
  id: string;
  ownerId: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  visibility: TimelineVisibility;
  status: TimelineStatus;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
  owner: { id: string; name: string; avatarUrl: string | null };
  nodes: NodeWithBlocks[];
  _count?: { nodes: number };
}

export interface NodeWithBlocks {
  id: string;
  timelineId: string;
  title: string;
  description: string | null;
  position: number;
  status: NodeStatus;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  blocks: NodeBlockData[];
  unlockRules: UnlockRuleData[];
}

export interface NodeBlockData {
  id: string;
  nodeId: string;
  type: BlockType;
  position: number;
  content: string; // JSON string
  mediaId: string | null;
}

export interface UnlockRuleData {
  id: string;
  nodeId: string;
  type: UnlockRuleType;
  config: string; // JSON string
}

// ─── AI Types ───────────────────────────────────────────────────────────────

export interface ContentItem {
  type: "text" | "image" | "video" | "link" | "file";
  content: string;
  metadata?: Record<string, unknown>;
}

export interface OrganizationSuggestion {
  title: string;
  description: string;
  nodes: {
    title: string;
    description: string;
    position: number;
    blocks: {
      type: BlockType;
      content: string;
    }[];
  }[];
}

// ─── Viewer Types ───────────────────────────────────────────────────────────

export interface ViewerNodeState {
  nodeId: string;
  isCompleted: boolean;
  isUnlocked: boolean;
  unlockMessage?: string;
}

export interface ViewerState {
  timelineId: string;
  sessionId: string;
  currentNodeId: string | null;
  completedNodeIds: string[];
  completionPercentage: number;
  nodeStates: ViewerNodeState[];
}
