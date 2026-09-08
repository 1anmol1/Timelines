import { db } from "@/lib/db";
import { compare } from "bcryptjs";

// ─── Unlock Evaluator Interface ─────────────────────────────────────────────

interface UnlockContext {
  sessionId: string;
  timelineId: string;
  nodeId: string;
  password?: string;
  completedNodeIds: string[];
}

interface UnlockEvaluator {
  canUnlock(config: Record<string, unknown>, context: UnlockContext): Promise<boolean>;
  getMessage(config: Record<string, unknown>): string;
}

// ─── Evaluator Implementations ──────────────────────────────────────────────

class PreviousCompletedEvaluator implements UnlockEvaluator {
  async canUnlock(config: Record<string, unknown>, context: UnlockContext): Promise<boolean> {
    const sourceNodeId = config.sourceNodeId as string;
    if (!sourceNodeId) return false;
    return context.completedNodeIds.includes(sourceNodeId);
  }

  getMessage(config: Record<string, unknown>): string {
    return "Complete the previous chapter to unlock this one";
  }
}

class VideoWatchedEvaluator implements UnlockEvaluator {
  async canUnlock(config: Record<string, unknown>, context: UnlockContext): Promise<boolean> {
    const sourceNodeId = config.sourceNodeId as string;
    if (!sourceNodeId) return false;
    // For now, treat video watched as same as node completed
    return context.completedNodeIds.includes(sourceNodeId);
  }

  getMessage(): string {
    return "Watch the video in the previous chapter to unlock";
  }
}

class PasswordEvaluator implements UnlockEvaluator {
  async canUnlock(config: Record<string, unknown>, context: UnlockContext): Promise<boolean> {
    const passwordHash = config.passwordHash as string;
    if (!passwordHash || !context.password) return false;
    return compare(context.password, passwordHash);
  }

  getMessage(): string {
    return "Enter the password to unlock this chapter";
  }
}

class DateEvaluator implements UnlockEvaluator {
  async canUnlock(config: Record<string, unknown>): Promise<boolean> {
    const unlockAt = config.unlockAt as string;
    if (!unlockAt) return false;
    return new Date() >= new Date(unlockAt);
  }

  getMessage(config: Record<string, unknown>): string {
    const unlockAt = config.unlockAt as string;
    if (!unlockAt) return "This chapter will unlock at a future date";
    const date = new Date(unlockAt);
    return `This chapter unlocks on ${date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
}

// ─── Evaluator Registry ─────────────────────────────────────────────────────

const evaluators: Record<string, UnlockEvaluator> = {
  PREVIOUS_COMPLETED: new PreviousCompletedEvaluator(),
  VIDEO_WATCHED: new VideoWatchedEvaluator(),
  PASSWORD: new PasswordEvaluator(),
  DATE: new DateEvaluator(),
};

// ─── Public API ─────────────────────────────────────────────────────────────

export async function evaluateUnlock(
  nodeId: string,
  context: UnlockContext
): Promise<{ canUnlock: boolean; message: string }> {
  const rules = await db.unlockRule.findMany({
    where: { nodeId },
  });

  if (rules.length === 0) {
    return { canUnlock: true, message: "" };
  }

  // All rules must pass
  for (const rule of rules) {
    const evaluator = evaluators[rule.type];
    if (!evaluator) {
      return { canUnlock: false, message: "Unknown unlock condition" };
    }

    const config = JSON.parse(rule.config);
    const result = await evaluator.canUnlock(config, context);

    if (!result) {
      return {
        canUnlock: false,
        message: evaluator.getMessage(config),
      };
    }
  }

  return { canUnlock: true, message: "Unlocked!" };
}

export async function getUnlockMessage(nodeId: string): Promise<string> {
  const rules = await db.unlockRule.findMany({
    where: { nodeId },
  });

  if (rules.length === 0) return "";

  const rule = rules[0];
  const evaluator = evaluators[rule.type];
  if (!evaluator) return "This chapter is locked";

  const config = JSON.parse(rule.config);
  return evaluator.getMessage(config);
}

export function getAvailableUnlockTypes() {
  return [
    { type: "PREVIOUS_COMPLETED", label: "Previous node completed", description: "Unlocks when the viewer completes the previous node" },
    { type: "VIDEO_WATCHED", label: "Video watched", description: "Unlocks when the viewer watches the video in a specific node" },
    { type: "PASSWORD", label: "Password", description: "Unlocks when the viewer enters the correct password" },
    { type: "DATE", label: "Date & time", description: "Unlocks at a specific date and time" },
  ];
}
