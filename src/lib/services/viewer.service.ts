import { db } from "@/lib/db";
import { evaluateUnlock } from "./unlock.service";

// ─── Get or Create Viewer Progress ──────────────────────────────────────────

export async function getOrCreateProgress(
  timelineId: string,
  sessionId: string,
  userId?: string
) {
  let progress = await db.viewerProgress.findUnique({
    where: { timelineId_sessionId: { timelineId, sessionId } },
  });

  if (!progress) {
    // Get first node
    const firstNode = await db.node.findFirst({
      where: { timelineId, status: "ACTIVE" },
      orderBy: { position: "asc" },
    });

    progress = await db.viewerProgress.create({
      data: {
        timelineId,
        sessionId,
        userId: userId || null,
        currentNodeId: firstNode?.id || null,
        completedNodeIds: "[]",
        completionPercentage: 0,
      },
    });
  }

  return progress;
}

// ─── Mark Node as Completed ─────────────────────────────────────────────────

export async function completeNode(
  timelineId: string,
  nodeId: string,
  sessionId: string
) {
  const progress = await getOrCreateProgress(timelineId, sessionId);
  const completedIds: string[] = JSON.parse(progress.completedNodeIds);

  if (!completedIds.includes(nodeId)) {
    completedIds.push(nodeId);
  }

  // Calculate completion percentage
  const totalNodes = await db.node.count({
    where: { timelineId, status: "ACTIVE" },
  });
  const completionPercentage =
    totalNodes > 0 ? Math.round((completedIds.length / totalNodes) * 100) : 0;

  // Find next node
  const currentNode = await db.node.findUnique({ where: { id: nodeId } });
  let nextNode = null;
  if (currentNode) {
    nextNode = await db.node.findFirst({
      where: {
        timelineId,
        position: { gt: currentNode.position },
        status: "ACTIVE",
      },
      orderBy: { position: "asc" },
    });
  }

  return db.viewerProgress.update({
    where: { timelineId_sessionId: { timelineId, sessionId } },
    data: {
      completedNodeIds: JSON.stringify(completedIds),
      completionPercentage,
      currentNodeId: nextNode?.id || nodeId,
      lastViewedAt: new Date(),
    },
  });
}

// ─── Get Viewer State ───────────────────────────────────────────────────────

export async function getViewerState(timelineId: string, sessionId: string) {
  const progress = await getOrCreateProgress(timelineId, sessionId);
  const completedIds: string[] = JSON.parse(progress.completedNodeIds);

  const nodes = await db.node.findMany({
    where: { timelineId, status: "ACTIVE" },
    include: { unlockRules: true },
    orderBy: { position: "asc" },
  });

  const nodeStates = await Promise.all(
    nodes.map(async (node) => {
      const isCompleted = completedIds.includes(node.id);

      let isUnlocked = true;
      let unlockMessage = "";

      if (node.isLocked) {
        const unlockResult = await evaluateUnlock(node.id, {
          sessionId,
          timelineId,
          nodeId: node.id,
          completedNodeIds: completedIds,
        });
        isUnlocked = unlockResult.canUnlock;
        unlockMessage = unlockResult.message;
      }

      return {
        nodeId: node.id,
        isCompleted,
        isUnlocked,
        unlockMessage,
      };
    })
  );

  return {
    timelineId,
    sessionId,
    currentNodeId: progress.currentNodeId,
    completedNodeIds: completedIds,
    completionPercentage: progress.completionPercentage,
    nodeStates,
  };
}

// ─── Try Unlock Node ────────────────────────────────────────────────────────

export async function tryUnlockNode(
  timelineId: string,
  nodeId: string,
  sessionId: string,
  password?: string
) {
  const progress = await getOrCreateProgress(timelineId, sessionId);
  const completedIds: string[] = JSON.parse(progress.completedNodeIds);

  const result = await evaluateUnlock(nodeId, {
    sessionId,
    timelineId,
    nodeId,
    password,
    completedNodeIds: completedIds,
  });

  return result;
}
