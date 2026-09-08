import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as timelineService from "@/lib/services/timeline.service";
import { createTimelineSchema, updateTimelineSchema } from "@/lib/validations";

// GET /api/timelines — Get current user's timelines
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const filter = (url.searchParams.get("filter") as "all" | "draft" | "published") || "all";

    const timelines = await timelineService.getUserTimelines(session.user.id, filter);
    return NextResponse.json({ success: true, data: timelines });
  } catch (error) {
    console.error("Get timelines error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch timelines" }, { status: 500 });
  }
}

// POST /api/timelines — Create a new timeline
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createTimelineSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const timeline = await timelineService.createTimeline({
      ownerId: session.user.id,
      ...validated.data,
    });

    return NextResponse.json({ success: true, data: timeline }, { status: 201 });
  } catch (error) {
    console.error("Create timeline error:", error);
    return NextResponse.json({ success: false, error: "Failed to create timeline" }, { status: 500 });
  }
}
