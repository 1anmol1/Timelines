import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as nodeService from "@/lib/services/node.service";
import { updateBlockSchema } from "@/lib/validations";

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

    const block = await db.nodeBlock.findUnique({
      where: { id },
      include: { node: { include: { timeline: true } } },
    });
    if (!block || block.node.timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateBlockSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 });
    }

    const updated = await nodeService.updateBlock(id, validated.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update block error:", error);
    return NextResponse.json({ success: false, error: "Failed to update block" }, { status: 500 });
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

    const block = await db.nodeBlock.findUnique({
      where: { id },
      include: { node: { include: { timeline: true } } },
    });
    if (!block || block.node.timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await nodeService.deleteBlock(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete block error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete block" }, { status: 500 });
  }
}
