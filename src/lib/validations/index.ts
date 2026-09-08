import { z } from "zod";

// ─── Auth ───────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Timelines ──────────────────────────────────────────────────────────────

export const createTimelineSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  coverUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["PUBLIC", "PRIVATE", "PASSWORD"]).default("PUBLIC"),
  password: z.string().optional(),
});

export const updateTimelineSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  coverUrl: z.string().url().optional().or(z.literal("")).nullable(),
  visibility: z.enum(["PUBLIC", "PRIVATE", "PASSWORD"]).optional(),
  password: z.string().optional(),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens")
    .optional(),
});

// ─── Nodes ──────────────────────────────────────────────────────────────────

export const createNodeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  position: z.number().int().min(0).optional(),
  isLocked: z.boolean().default(false),
});

export const updateNodeSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  isLocked: z.boolean().optional(),
});

export const reorderNodesSchema = z.object({
  nodeIds: z.array(z.string()).min(1, "At least one node ID is required"),
});

// ─── Node Blocks ────────────────────────────────────────────────────────────

export const createBlockSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "LINK", "FILE", "EMBED"]),
  content: z.string().default("{}"),
  position: z.number().int().min(0).optional(),
  mediaId: z.string().optional(),
});

export const updateBlockSchema = z.object({
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "LINK", "FILE", "EMBED"]).optional(),
  content: z.string().optional(),
  position: z.number().int().min(0).optional(),
  mediaId: z.string().optional().nullable(),
});

// ─── Unlock Rules ───────────────────────────────────────────────────────────

export const createUnlockRuleSchema = z.object({
  type: z.enum(["PREVIOUS_COMPLETED", "VIDEO_WATCHED", "PASSWORD", "DATE", "CUSTOM"]),
  config: z.string().default("{}"),
});

// ─── Viewer ─────────────────────────────────────────────────────────────────

export const completeNodeSchema = z.object({
  sessionId: z.string().min(1),
});

export const unlockNodeSchema = z.object({
  sessionId: z.string().min(1),
  password: z.string().optional(),
});

// ─── AI ─────────────────────────────────────────────────────────────────────

export const aiOrganizeSchema = z.object({
  items: z.array(
    z.object({
      type: z.enum(["text", "image", "video", "link", "file"]),
      content: z.string(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
});

// ─── Comments ───────────────────────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000),
  sessionId: z.string().optional(),
});

// ─── Reactions ──────────────────────────────────────────────────────────────

export const createReactionSchema = z.object({
  type: z.enum(["HEART", "FIRE", "LIGHTBULB", "CLAP"]),
  sessionId: z.string().optional(),
});
