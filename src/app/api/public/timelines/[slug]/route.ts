import { NextResponse } from "next/server";
import * as timelineService from "@/lib/services/timeline.service";
import * as viewerService from "@/lib/services/viewer.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const timeline = await timelineService.getTimelineBySlug(slug);

    if (!timeline) {
      return NextResponse.json({ success: false, error: "Timeline not found" }, { status: 404 });
    }

    if (timeline.visibility === "PRIVATE") {
      return NextResponse.json({ success: false, error: "This timeline is private" }, { status: 403 });
    }

    if (timeline.visibility === "PASSWORD") {
      const providedPassword = request.headers.get("X-Timeline-Password");
      if (!providedPassword) {
        return NextResponse.json({
          success: true,
          data: {
            id: timeline.id,
            title: timeline.title,
            coverUrl: timeline.coverUrl,
            visibility: "PASSWORD",
            requiresPassword: true,
          },
        });
      }
    }

    const url = new URL(request.url);
    const sessionId = url.searchParams.get("sessionId");

    let viewerState = null;
    if (sessionId) {
      viewerState = await viewerService.getViewerState(timeline.id, sessionId);
    }

    return NextResponse.json({
      success: true,
      data: { ...timeline, viewerState },
    });
  } catch (error) {
    console.error("Public timeline error:", error);
    return NextResponse.json({ success: false, error: "Failed to load timeline" }, { status: 500 });
  }
}
