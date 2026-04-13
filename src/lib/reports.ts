import fs from "fs/promises";
import path from "path";
import { Report, ReportSummary } from "./types";

const REPORTS_DIR = path.join(process.cwd(), "reports");

/**
 * Ensure reports directory exists
 */
async function ensureReportsDir() {
  try {
    await fs.access(REPORTS_DIR);
  } catch {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Save a report to disk (JSON + Markdown)
 */
export async function saveReport(report: Report): Promise<string> {
  await ensureReportsDir();

  const jsonPath = path.join(REPORTS_DIR, `${report.report_id}.json`);
  const mdPath = path.join(REPORTS_DIR, `${report.report_id}.md`);

  // Save JSON (full report data)
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf-8");

  // Save Markdown (for easy reading/sharing)
  const markdownContent = `# ${report.title}

Generated: ${new Date(report.metadata.generated_at).toLocaleString()}
Commits: ${report.metadata.commit_count}
Date Range: ${report.metadata.date_range.start.split("T")[0]} to ${report.metadata.date_range.end.split("T")[0]}

---

${report.markdown}
`;

  await fs.writeFile(mdPath, markdownContent, "utf-8");

  return report.report_id;
}

/**
 * List all saved reports (sorted by date, newest first)
 */
export async function listReports(): Promise<ReportSummary[]> {
  await ensureReportsDir();

  try {
    const files = await fs.readdir(REPORTS_DIR);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const reports = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(
          path.join(REPORTS_DIR, file),
          "utf-8"
        );
        const report: Report = JSON.parse(content);

        return {
          id: report.report_id,
          title: report.title,
          generated_at: report.metadata.generated_at,
          commit_count: report.metadata.commit_count,
          date_range: report.metadata.date_range,
        };
      })
    );

    // Sort by generated date, newest first
    return reports.sort(
      (a, b) =>
        new Date(b.generated_at).getTime() -
        new Date(a.generated_at).getTime()
    );
  } catch (error) {
    console.error("Error listing reports:", error);
    return [];
  }
}

/**
 * Get a specific report by ID
 */
export async function getReport(id: string): Promise<Report | null> {
  const filePath = path.join(REPORTS_DIR, `${id}.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Report not found: ${id}`, error);
    return null;
  }
}
