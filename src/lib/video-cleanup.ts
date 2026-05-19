import { deleteObjectByPublicUrl } from "@/lib/storage";
import { getDb } from "@/lib/db";

const DEFAULT_RETENTION_DAYS = 14;
const CLEANUP_BATCH_SIZE = 100;

export type VideoCleanupResult = {
  cutoff: string;
  matched: number;
  deletedFromDb: number;
  deletedObjects: number;
  failedObjectDeletes: number;
};

export async function cleanupExpiredSubmissionVideos(retentionDays = DEFAULT_RETENTION_DAYS): Promise<VideoCleanupResult> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  const db = getDb();
  let deletedFromDb = 0;
  let deletedObjects = 0;
  let failedObjectDeletes = 0;
  let matched = 0;

  while (true) {
    const files = await db.submissionFile.findMany({
      where: {
        createdAt: { lt: cutoffDate },
        fileType: { startsWith: "video/" },
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fileUrl: true,
      },
      take: CLEANUP_BATCH_SIZE,
    });

    if (files.length === 0) {
      break;
    }

    matched += files.length;

    for (const file of files) {
      try {
        if (await deleteObjectByPublicUrl(file.fileUrl)) {
          deletedObjects += 1;
        }
      } catch (error) {
        failedObjectDeletes += 1;
        console.warn("[video-cleanup] object delete failed", file.id, error);
      }
    }

    const deleteResult = await db.submissionFile.deleteMany({
      where: {
        id: { in: files.map((file) => file.id) },
      },
    });

    deletedFromDb += deleteResult.count;

    if (files.length < CLEANUP_BATCH_SIZE) {
      break;
    }
  }

  return {
    cutoff: cutoffDate.toISOString(),
    matched,
    deletedFromDb,
    deletedObjects,
    failedObjectDeletes,
  };
}
