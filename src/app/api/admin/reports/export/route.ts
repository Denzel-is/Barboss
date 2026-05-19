import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth";
import { buildAdminReportRows, rowsToCsv } from "@/lib/admin-reports";
import {
  parseAdminOperationFilter,
  parseAdminReportPeriod,
  parseAdminStatusFilter,
} from "@/lib/history-types";
import { writeAuthLog } from "@/lib/logs";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireRole("admin");
  const { searchParams } = new URL(request.url);

  const period = parseAdminReportPeriod(searchParams.get("period") ?? undefined);
  const operation = parseAdminOperationFilter(searchParams.get("operation") ?? undefined);
  const status = parseAdminStatusFilter(searchParams.get("status") ?? undefined);

  const rows = await buildAdminReportRows({ period, operation, status });
  const csv = rowsToCsv(rows);
  const stamp = new Date().toISOString().slice(0, 10);

  await writeAuthLog({
    action: "admin_reports_exported",
    message: `rows=${rows.length}; period=${period}; operation=${operation}; status=${status}`,
    userId: admin.id,
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="barboss-report-${stamp}.csv"`,
    },
  });
}
