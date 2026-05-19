import { NOTIFICATION_TYPES } from "@/lib/notification-types";
import { createErrorReport } from "@/lib/error-reports";
import { createAdminNotifications } from "@/lib/notifications";
import { notifyAdminSiteError } from "@/lib/telegram";

export type ReportSiteErrorInput = {
  message: string;
  userId?: string;
  source?: string;
  pageUrl?: string;
  action?: string;
  stack?: string;
};

export async function reportSiteError(input: ReportSiteErrorInput) {
  const pageUrl = input.pageUrl ?? input.source ?? "unknown";
  const fullMessage = input.source ? `[${input.source}] ${input.message}` : input.message;

  try {
    await createErrorReport({
      pageUrl,
      errorMessage: input.message,
      stack: input.stack,
      action: input.action ?? input.source,
      userId: input.userId,
      source: input.source,
    });
  } catch (error) {
    console.error("[reportSiteError] createErrorReport:", error);
  }

  try {
    await createAdminNotifications({
      title: "Ошибка на сайте",
      message: fullMessage.slice(0, 500),
      type: NOTIFICATION_TYPES.siteError,
    });
  } catch (error) {
    console.error("[reportSiteError] notification:", error);
  }

  try {
    await notifyAdminSiteError({
      message: fullMessage.slice(0, 800),
      userId: input.userId,
    });
  } catch (error) {
    console.error("[reportSiteError] telegram:", error);
  }
}
