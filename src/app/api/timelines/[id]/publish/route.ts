import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as timelineService from "@/lib/services/timeline.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const timeline = await timelineService.publishTimeline(id, session.user.id);
    return NextResponse.json({ success: true, data: timeline });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to publish";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const timeline = await timelineService.unpublishTimeline(id, session.user.id);
    return NextResponse.json({ success: true, data: timeline });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to unpublish";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
