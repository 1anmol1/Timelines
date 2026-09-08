import { db } from "@/lib/db";

// ─── Create Node ────────────────────────────────────────────────────────────

export async function createNode(params: {
  timelineId: string;
  title: string;
  description?: string;
  position?: number;
  isLocked?: boolean;
}) {
  // If no position specified, add at end
  if (params.position === undefined) {
    const lastNode = await db.node.findFirst({
      where: { timelineId: params.timelineId },
      orderBy: { position: "desc" },
    });
    params.position = lastNode ? lastNode.position + 1 : 0;
  } else {
    // Shift existing nodes down
    await db.node.updateMany({
      where: {
        timelineId: params.timelineId,
        position: { gte: params.position },
      },
      data: { position: { increment: 1 } },
    });
  }

  return db.node.create({
    data: {
      timelineId: params.timelineId,
      title: params.title,
      description: params.description || null,
      position: params.position,
      isLocked: params.isLocked || false,
    },
    include: {
      blocks: { orderBy: { position: "asc" } },
      unlockRules: true,
    },
  });
}

// ─── Update Node ────────────────────────────────────────────────────────────

export async function updateNode(
  id: string,
  data: {
    title?: string;
    description?: string | null;
    isLocked?: boolean;
  }
) {
  return db.node.update({
    where: { id },
    data,
    include: {
      blocks: { orderBy: { position: "asc" } },
      unlockRules: true,
    },
  });
}

// ─── Delete Node ────────────────────────────────────────────────────────────

export async function deleteNode(id: string) {
  const node = await db.node.findUnique({ where: { id } });
  if (!node) throw new Error("Node not found");

  // Delete and re-position siblings
  await db.$transaction([
    db.node.delete({ where: { id } }),
    db.node.updateMany({
      where: {
        timelineId: node.timelineId,
        position: { gt: node.position },
      },
      data: { position: { decrement: 1 } },
    }),
  ]);

  return node;
}

// ─── Duplicate Node ─────────────────────────────────────────────────────────

export async function duplicateNode(id: string) {
  const original = await db.node.findUnique({
    where: { id },
    include: { blocks: true },
  });
  if (!original) throw new Error("Node not found");

  // Make room at next position
  await db.node.updateMany({
    where: {
      timelineId: original.timelineId,
      position: { gt: original.position },
    },
    data: { position: { increment: 1 } },
  });

  const newNode = await db.node.create({
    data: {
      timelineId: original.timelineId,
      title: `${original.title} (Copy)`,
      description: original.description,
      position: original.position + 1,
      isLocked: false,
    },
    include: {
      blocks: { orderBy: { position: "asc" } },
      unlockRules: true,
    },
  });

  // Copy blocks
  if (original.blocks.length > 0) {
    await db.nodeBlock.createMany({
      data: original.blocks.map((block) => ({
        nodeId: newNode.id,
        type: block.type,
        position: block.position,
        content: block.content,
        mediaId: block.mediaId,
      })),
    });
  }

  return db.node.findUnique({
    where: { id: newNode.id },
    include: {
      blocks: { orderBy: { position: "asc" } },
      unlockRules: true,
    },
  });
}

// ─── Reorder Nodes ──────────────────────────────────────────────────────────

export async function reorderNodes(timelineId: string, nodeIds: string[]) {
  const updates = nodeIds.map((id, index) =>
    db.node.update({
      where: { id },
      data: { position: index },
    })
  );

  await db.$transaction(updates);

  return db.node.findMany({
    where: { timelineId },
    include: {
      blocks: { orderBy: { position: "asc" } },
      unlockRules: true,
    },
    orderBy: { position: "asc" },
  });
}

// ─── Block Operations ───────────────────────────────────────────────────────

export async function createBlock(params: {
  nodeId: string;
  type: string;
  content?: string;
  position?: number;
  mediaId?: string;
}) {
  if (params.position === undefined) {
    const lastBlock = await db.nodeBlock.findFirst({
      where: { nodeId: params.nodeId },
      orderBy: { position: "desc" },
    });
    params.position = lastBlock ? lastBlock.position + 1 : 0;
  }

  return db.nodeBlock.create({
    data: {
      nodeId: params.nodeId,
      type: params.type,
      position: params.position,
      content: params.content || "{}",
      mediaId: params.mediaId || null,
    },
  });
}

export async function updateBlock(
  id: string,
  data: {
    type?: string;
    content?: string;
    position?: number;
    mediaId?: string | null;
  }
) {
  return db.nodeBlock.update({
    where: { id },
    data,
  });
}

export async function deleteBlock(id: string) {
  const block = await db.nodeBlock.findUnique({ where: { id } });
  if (!block) throw new Error("Block not found");

  await db.$transaction([
    db.nodeBlock.delete({ where: { id } }),
    db.nodeBlock.updateMany({
      where: {
        nodeId: block.nodeId,
        position: { gt: block.position },
      },
      data: { position: { decrement: 1 } },
    }),
  ]);

  return block;
}

// ─── Unlock Rule Operations ─────────────────────────────────────────────────

export async function setUnlockRule(params: {
  nodeId: string;
  type: string;
  config?: string;
}) {
  // Remove existing rules for this node
  await db.unlockRule.deleteMany({
    where: { nodeId: params.nodeId },
  });

  // Also set the node as locked
  await db.node.update({
    where: { id: params.nodeId },
    data: { isLocked: true },
  });

  return db.unlockRule.create({
    data: {
      nodeId: params.nodeId,
      type: params.type,
      config: params.config || "{}",
    },
  });
}

export async function removeUnlockRule(nodeId: string) {
  await db.unlockRule.deleteMany({
    where: { nodeId },
  });

  return db.node.update({
    where: { id: nodeId },
    data: { isLocked: false },
  });
}
