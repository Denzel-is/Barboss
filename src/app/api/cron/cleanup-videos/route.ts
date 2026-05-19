import { NextResponse } from "next/server";

import { cleanupExpiredSubmissionVideos } from "@/lib/video-cleanup";
import { writeAuthLog } from "@/lib/logs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return process.env.NODE_ENV !== "production";
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupExpiredSubmissionVideos(14);

  await writeAuthLog({
    action: "expired_submission_videos_cleanup",
    message: `Deleted ${result.deletedFromDb} expired non-chat video record(s).`,
    entityType: "SubmissionFile",
    metadata: result,
  });

  return NextResponse.json({ ok: true, ...result });
}
