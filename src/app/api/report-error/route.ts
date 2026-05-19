import { NextResponse } from "next/server";

import { getSession } from "@/lib/session";
import { reportSiteError } from "@/lib/site-errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const payload = (await request.json()) as {
      message?: string;
      errorMessage?: string;
      pageUrl?: string;
      action?: string;
      stack?: string;
      source?: string;
    };

    const errorMessage = (
      typeof payload.errorMessage === "string"
        ? payload.errorMessage
        : typeof payload.message === "string"
          ? payload.message
          : ""
    ).trim();

    if (!errorMessage) {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const pageUrl =
      (typeof payload.pageUrl === "string" ? payload.pageUrl : null) ??
      request.headers.get("referer") ??
      "unknown";

    await reportSiteError({
      message: errorMessage.slice(0, 4000),
      pageUrl: pageUrl.slice(0, 2000),
      action: typeof payload.action === "string" ? payload.action.slice(0, 200) : undefined,
      stack: typeof payload.stack === "string" ? payload.stack.slice(0, 12000) : undefined,
      source: typeof payload.source === "string" ? payload.source.slice(0, 200) : undefined,
      userId: session?.userId,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
