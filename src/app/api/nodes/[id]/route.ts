import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as nodeService from "@/lib/services/node.service";
import { updateNodeSchema } from "@/lib/validations";

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

    const node = await db.node.findUnique({
      where: { id },
      include: { timeline: true },
    });
    if (!node || node.timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = updateNodeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 });
    }

    const updated = await nodeService.updateNode(id, validated.data);
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Update node error:", error);
    return NextResponse.json({ success: false, error: "Failed to update node" }, { status: 500 });
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

    const node = await db.node.findUnique({
      where: { id },
      include: { timeline: true },
    });
    if (!node || node.timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    await nodeService.deleteNode(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete node error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete node" }, { status: 500 });
  }
}
