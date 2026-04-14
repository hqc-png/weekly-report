import fs from "fs/promises";
import path from "path";
import { Report, ReportSummary } from "./types";

const REPORTS_DIR = path.join(process.cwd(), "reports");

// Check if running on Vercel (has Blob storage)
const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Ensure reports directory exists (filesystem only)
 */
async function ensureReportsDir() {
  try {
    await fs.access(REPORTS_DIR);
  } catch {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  }
}

/**
 * Generate markdown content from report
 */
function generateMarkdownContent(report: Report): string {
  return `# ${report.title}

Generated: ${new Date(report.metadata.generated_at).toLocaleString()}
Commits: ${report.metadata.commit_count}
Date Range: ${report.metadata.date_range.start.split("T")[0]} to ${report.metadata.date_range.end.split("T")[0]}

---

${report.markdown}
`;
}

/**
 * Save report to filesystem (local development)
 */
async function saveReportToFilesystem(report: Report): Promise<string> {
  await ensureReportsDir();

  const jsonPath = path.join(REPORTS_DIR, `${report.report_id}.json`);
  const mdPath = path.join(REPORTS_DIR, `${report.report_id}.md`);

  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2), "utf-8");
  await fs.writeFile(mdPath, generateMarkdownContent(report), "utf-8");

  return report.report_id;
}

/**
 * Save report to Vercel Blob (production)
 */
async function saveReportToBlob(report: Report): Promise<string> {
  try {
    const { put } = await import("@vercel/blob");

    const jsonContent = JSON.stringify(report, null, 2);
    const mdContent = generateMarkdownContent(report);

    // Save both JSON and Markdown to blob storage
    // Using private access to match Blob store configuration
    await put(`reports/${report.report_id}.json`, jsonContent, {
      access: "private",
      addRandomSuffix: false,
    });

    await put(`reports/${report.report_id}.md`, mdContent, {
      access: "private",
      addRandomSuffix: false,
    });

    console.log(`✅ Report saved to Blob: ${report.report_id}`);
    return report.report_id;
  } catch (error) {
    console.error("Failed to save report to Blob:", error);
    throw error;
  }
}

/**
 * Save a report (auto-detects environment)
 */
export async function saveReport(report: Report): Promise<string> {
  return IS_VERCEL
    ? saveReportToBlob(report)
    : saveReportToFilesystem(report);
}

/**
 * List reports from filesystem (local development)
 */
async function listReportsFromFilesystem(): Promise<ReportSummary[]> {
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
 * List reports from Vercel Blob (production)
 */
async function listReportsFromBlob(): Promise<ReportSummary[]> {
  try {
    const { list, get } = await import("@vercel/blob");

    const { blobs } = await list({ prefix: "reports/", limit: 1000 });
    const jsonBlobs = blobs.filter((b) => b.pathname.endsWith(".json"));

    const reports = await Promise.all(
      jsonBlobs.map(async (blob) => {
        try {
          // Use get() method for private blob access
          const result = await get(blob.pathname, {
            access: "private",
          });

          if (!result || result.statusCode !== 200) {
            return null;
          }

          // Read content from stream
          const text = await result.stream.text();
          const report: Report = JSON.parse(text);

          return {
            id: report.report_id,
            title: report.title,
            generated_at: report.metadata.generated_at,
            commit_count: report.metadata.commit_count,
            date_range: report.metadata.date_range,
          };
        } catch (error) {
          console.error(`Failed to read blob: ${blob.pathname}`, error);
          return null;
        }
      })
    );

    // Filter out failed reads and sort
    return reports
      .filter((r) => r !== null)
      .sort(
        (a, b) =>
          new Date(b.generated_at).getTime() -
          new Date(a.generated_at).getTime()
      );
  } catch (error) {
    console.error("Error listing reports from Blob:", error);
    return [];
  }
}

/**
 * List all saved reports (sorted by date, newest first)
 */
export async function listReports(): Promise<ReportSummary[]> {
  return IS_VERCEL
    ? listReportsFromBlob()
    : listReportsFromFilesystem();
}

/**
 * Get report from filesystem (local development)
 */
async function getReportFromFilesystem(id: string): Promise<Report | null> {
  const filePath = path.join(REPORTS_DIR, `${id}.json`);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Report not found: ${id}`, error);
    return null;
  }
}

/**
 * Get report from Vercel Blob (production)
 */
async function getReportFromBlob(id: string): Promise<Report | null> {
  try {
    const { get } = await import("@vercel/blob");

    // Use get() method for private blob access
    const result = await get(`reports/${id}.json`, {
      access: "private",
    });

    if (!result || result.statusCode !== 200) {
      return null;
    }

    // Read content from stream
    const text = await result.stream.text();
    return JSON.parse(text);
  } catch (error) {
    console.error(`Report not found in Blob: ${id}`, error);
    return null;
  }
}

/**
 * Get a specific report by ID (auto-detects environment)
 */
export async function getReport(id: string): Promise<Report | null> {
  return IS_VERCEL
    ? getReportFromBlob(id)
    : getReportFromFilesystem(id);
}
