import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import * as timelineService from "@/lib/services/timeline.service";
import { updateTimelineSchema } from "@/lib/validations";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const timeline = await timelineService.getTimelineById(id);
    if (!timeline || timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Timeline not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: timeline });
  } catch (error) {
    console.error("Get timeline error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch timeline" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = updateTimelineSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 });
    }

    const timeline = await timelineService.updateTimeline(id, session.user.id, validated.data);
    return NextResponse.json({ success: true, data: timeline });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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

    await timelineService.deleteTimeline(id, session.user.id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
