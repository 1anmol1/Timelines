import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as viewerService from "@/lib/services/viewer.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = await request.json();
    const { action, nodeId, sessionId, password } = body;

    if (!sessionId || !nodeId) {
      return NextResponse.json({ success: false, error: "Session ID and node ID required" }, { status: 400 });
    }

    const timeline = await db.timeline.findFirst({
      where: { slug, status: "PUBLISHED" },
    });

    if (!timeline) {
      return NextResponse.json({ success: false, error: "Timeline not found" }, { status: 404 });
    }

    if (action === "complete") {
      await viewerService.completeNode(timeline.id, nodeId, sessionId);
      const viewerState = await viewerService.getViewerState(timeline.id, sessionId);
      return NextResponse.json({ success: true, data: viewerState });
    }

    if (action === "unlock") {
      const result = await viewerService.tryUnlockNode(timeline.id, nodeId, sessionId, password);
      if (result.canUnlock) {
        const viewerState = await viewerService.getViewerState(timeline.id, sessionId);
        return NextResponse.json({ success: true, data: viewerState });
      }
      return NextResponse.json({ success: false, error: result.message }, { status: 403 });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Viewer progress error:", error);
    return NextResponse.json({ success: false, error: "Failed to update progress" }, { status: 500 });
  }
}
