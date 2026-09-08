import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import * as nodeService from "@/lib/services/node.service";
import { createNodeSchema, reorderNodesSchema } from "@/lib/validations";

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

    const timeline = await db.timeline.findUnique({ where: { id } });
    if (!timeline || timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const nodes = await db.node.findMany({
      where: { timelineId: id },
      include: {
        blocks: { orderBy: { position: "asc" } },
        unlockRules: true,
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ success: true, data: nodes });
  } catch (error) {
    console.error("Get nodes error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch nodes" }, { status: 500 });
  }
}

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

    const timeline = await db.timeline.findUnique({ where: { id } });
    if (!timeline || timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = createNodeSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 });
    }

    const node = await nodeService.createNode({ timelineId: id, ...validated.data });
    return NextResponse.json({ success: true, data: node }, { status: 201 });
  } catch (error) {
    console.error("Create node error:", error);
    return NextResponse.json({ success: false, error: "Failed to create node" }, { status: 500 });
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

    const timeline = await db.timeline.findUnique({ where: { id } });
    if (!timeline || timeline.ownerId !== session.user.id) {
      return NextResponse.json({ success: false, error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const validated = reorderNodesSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ success: false, error: validated.error.errors[0].message }, { status: 400 });
    }

    const nodes = await nodeService.reorderNodes(id, validated.data.nodeIds);
    return NextResponse.json({ success: true, data: nodes });
  } catch (error) {
    console.error("Reorder nodes error:", error);
    return NextResponse.json({ success: false, error: "Failed to reorder" }, { status: 500 });
  }
}
