import { NextRequest, NextResponse } from "next/server";
import { loadProfile } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const profile = await loadProfile(params.sessionId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
