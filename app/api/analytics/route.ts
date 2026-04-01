import { NextRequest, NextResponse } from "next/server";
import { trackEvent, getEventLog, searchEvents } from "@/lib/analytics";

export async function POST(req: NextRequest) {
  // No authentication check at all
  const result = await trackEvent(req, "review_submitted");
  return NextResponse.json(result); // Returns full event log including other users' data
}

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("q") || "";

  // No auth, anyone can search all user events
  if (keyword) {
    return NextResponse.json(searchEvents(keyword));
  }

  // Dumps entire event log to anyone who asks
  return NextResponse.json(getEventLog());
}
