import { db } from "@/lib/db";
import { generateSlug } from "@/lib/utils";
import { hash } from "bcryptjs";

// ─── Create Timeline ────────────────────────────────────────────────────────

export async function createTimeline(params: {
  ownerId: string;
  title: string;
  description?: string;
  coverUrl?: string;
  visibility?: string;
  password?: string;
}) {
  const slug = generateSlug(params.title);

  // Ensure unique slug per user
  let finalSlug = slug;
  let counter = 1;
  while (true) {
    const existing = await db.timeline.findUnique({
      where: { ownerId_slug: { ownerId: params.ownerId, slug: finalSlug } },
    });
    if (!existing) break;
    finalSlug = `${slug}-${counter}`;
    counter++;
  }

  let passwordHash: string | null = null;
  if (params.visibility === "PASSWORD" && params.password) {
    passwordHash = await hash(params.password, 12);
  }

  const timeline = await db.timeline.create({
    data: {
      ownerId: params.ownerId,
      title: params.title,
      slug: finalSlug,
      description: params.description || null,
      coverUrl: params.coverUrl || null,
      visibility: params.visibility || "PUBLIC",
      passwordHash,
    },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { nodes: true } },
    },
  });

  return timeline;
}

// ─── Get User Timelines ─────────────────────────────────────────────────────

export async function getUserTimelines(
  userId: string,
  filter?: "all" | "draft" | "published"
) {
  const where: Record<string, unknown> = { ownerId: userId };
  if (filter === "draft") where.status = "DRAFT";
  if (filter === "published") where.status = "PUBLISHED";

  return db.timeline.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { nodes: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

// ─── Get Timeline By ID ─────────────────────────────────────────────────────

export async function getTimelineById(id: string) {
  return db.timeline.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      nodes: {
        include: {
          blocks: { orderBy: { position: "asc" } },
          unlockRules: true,
        },
        orderBy: { position: "asc" },
      },
      _count: { select: { nodes: true } },
    },
  });
}

// ─── Get Timeline By Slug ───────────────────────────────────────────────────

export async function getTimelineBySlug(slug: string) {
  return db.timeline.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      nodes: {
        where: { status: "ACTIVE" },
        include: {
          blocks: { orderBy: { position: "asc" } },
          unlockRules: true,
          _count: { select: { reactions: true, comments: true } },
        },
        orderBy: { position: "asc" },
      },
    },
  });
}

// ─── Update Timeline ────────────────────────────────────────────────────────

export async function updateTimeline(
  id: string,
  ownerId: string,
  data: {
    title?: string;
    description?: string | null;
    coverUrl?: string | null;
    visibility?: string;
    password?: string;
    slug?: string;
  }
) {
  // Verify ownership
  const timeline = await db.timeline.findUnique({ where: { id } });
  if (!timeline || timeline.ownerId !== ownerId) {
    throw new Error("Timeline not found or unauthorized");
  }

  let passwordHash = timeline.passwordHash;
  if (data.visibility === "PASSWORD" && data.password) {
    passwordHash = await hash(data.password, 12);
  } else if (data.visibility && data.visibility !== "PASSWORD") {
    passwordHash = null;
  }

  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.coverUrl !== undefined) updateData.coverUrl = data.coverUrl;
  if (data.visibility !== undefined) updateData.visibility = data.visibility;
  if (data.slug !== undefined) updateData.slug = data.slug;
  updateData.passwordHash = passwordHash;

  return db.timeline.update({
    where: { id },
    data: updateData,
    include: {
      owner: { select: { id: true, name: true, avatarUrl: true } },
      _count: { select: { nodes: true } },
    },
  });
}

// ─── Delete Timeline ────────────────────────────────────────────────────────

export async function deleteTimeline(id: string, ownerId: string) {
  const timeline = await db.timeline.findUnique({ where: { id } });
  if (!timeline || timeline.ownerId !== ownerId) {
    throw new Error("Timeline not found or unauthorized");
  }

  return db.timeline.delete({ where: { id } });
}

// ─── Publish / Unpublish ────────────────────────────────────────────────────

export async function publishTimeline(id: string, ownerId: string) {
  const timeline = await db.timeline.findUnique({
    where: { id },
    include: { _count: { select: { nodes: true } } },
  });
  if (!timeline || timeline.ownerId !== ownerId) {
    throw new Error("Timeline not found or unauthorized");
  }
  if (timeline._count.nodes === 0) {
    throw new Error("Cannot publish a timeline with no nodes");
  }

  return db.timeline.update({
    where: { id },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
    },
  });
}

export async function unpublishTimeline(id: string, ownerId: string) {
  const timeline = await db.timeline.findUnique({ where: { id } });
  if (!timeline || timeline.ownerId !== ownerId) {
    throw new Error("Timeline not found or unauthorized");
  }

  return db.timeline.update({
    where: { id },
    data: { status: "DRAFT", publishedAt: null },
  });
}
