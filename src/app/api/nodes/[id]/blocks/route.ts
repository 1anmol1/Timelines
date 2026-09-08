import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as nodeService from "@/lib/services/node.service";
import { createBlockSchema } from "@/lib/validations";

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

    const node = await db.node.findUnique({
      where: { id },
      include: { timeline: true },
    });
    if (!node || node.timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createBlockSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 });
    }

    const block = await nodeService.createBlock({ nodeId: id, ...validated.data });
    return NextResponse.json({ success: true, data: block }, { status: 201 });
  } catch (error) {
    console.error("Create block error:", error);
    return NextResponse.json({ success: false, error: "Failed to create block" }, { status: 500 });
  }
}
