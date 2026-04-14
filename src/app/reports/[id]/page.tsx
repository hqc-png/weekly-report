import { auth } from "@/auth";
import { getReport } from "@/lib/reports";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ReportDisplay } from "@/components/reports/ReportDisplay";
import { ShareButton } from "@/components/reports/ShareButton";
import { Card } from "@/components/ui/Card";
import { formatDateRange } from "@/lib/date-utils";

export const runtime = 'edge';

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  const { id } = await params;
  const report = await getReport(id);

  if (!report) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black">
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <Card>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-black dark:text-white mb-4">
                Report Not Found
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                The report you're looking for doesn't exist.
              </p>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </Card>
        </main>
      </div>
    );
  }

  const dateRange = formatDateRange(
    report.metadata.date_range.start,
    report.metadata.date_range.end
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 mb-3 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-2">
                {report.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                <span>{dateRange}</span>
                <span>•</span>
                <span>{report.metadata.commit_count} commits</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">
                  Generated {new Date(report.metadata.generated_at).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <ShareButton />
              <a
                href={`/api/reports/${report.report_id}/download`}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <ReportDisplay markdown={report.markdown} />
        </Card>
      </main>
    </div>
  );
}
