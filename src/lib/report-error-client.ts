type ReportClientErrorInput = {
  errorMessage: string;
  stack?: string;
  action?: string;
  source?: string;
};

export async function reportClientError(input: ReportClientErrorInput) {
  try {
    const pageUrl = typeof window !== "undefined" ? window.location.href : "unknown";

    await fetch("/api/report-error", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        pageUrl,
        errorMessage: input.errorMessage,
        stack: input.stack,
        action: input.action,
        source: input.source,
      }),
    });
  } catch {
    // reporting must never break the UI
  }
}
