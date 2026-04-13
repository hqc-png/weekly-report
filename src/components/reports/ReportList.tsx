import { listReports } from "@/lib/reports";
import { ReportCard } from "./ReportCard";

export async function ReportList() {
  const reports = await listReports();

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-gray-500 dark:text-gray-400">
          No reports yet. Generate your first report above!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} />
      ))}
    </div>
  );
}
