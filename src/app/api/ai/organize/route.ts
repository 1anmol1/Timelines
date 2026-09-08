import { NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { auth } from "@/lib/auth";
import { aiOrganizeSchema } from "@/lib/validations";

// POST /api/ai/organize
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = aiOrganizeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.errors[0].message },
        { status: 400 }
      );
    }

    const provider = getAIProvider();
    const suggestion = await provider.organizeContent(validated.data.items);

    return NextResponse.json({ success: true, data: suggestion });
  } catch (error) {
    console.error("AI organize error:", error);
    return NextResponse.json(
      { success: false, error: "AI service unavailable. Please try again." },
      { status: 503 }
    );
  }
}
