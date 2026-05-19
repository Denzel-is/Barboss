import { cleanupExpiredSubmissionVideos } from "../../src/lib/video-cleanup";

export async function handler() {
  const result = await cleanupExpiredSubmissionVideos(14);

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ ok: true, ...result }),
  };
}
