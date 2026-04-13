import Link from "next/link";
import { ReportSummary } from "@/lib/types";
import { formatDateRange } from "@/lib/date-utils";

interface ReportCardProps {
  report: ReportSummary;
}

export function ReportCard({ report }: ReportCardProps) {
  const dateRange = formatDateRange(
    report.date_range.start,
    report.date_range.end
  );

  return (
    <Link
      href={`/reports/${report.id}`}
      className="block rounded-lg border border-zinc-200 bg-white p-4 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
    >
      <h3 className="font-semibold text-black dark:text-white mb-1">
        {report.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        {dateRange}
      </p>
      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
        <span>{report.commit_count} commits</span>
        <span>•</span>
        <span>
          {new Date(report.generated_at).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );
}
