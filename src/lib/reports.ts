import { Report, ReportSummary } from "./types";

// Check if running on Vercel (has Blob storage)
const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;

/**
 * Helper function to read text from ReadableStream
 */
async function streamToText(stream: ReadableStream): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }

  // Flush any remaining bytes
  result += decoder.decode();
  return result;
}

/**
 * Ensure reports directory exists (filesystem only)
 */
async function ensureReportsDir() {
  const path = await import("path");
  const fs = await import("fs/promises");

  const REPORTS_DIR = path.join(process.cwd(), "reports");

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

  const path = await import("path");
  const fs = await import("fs/promises");
  const REPORTS_DIR = path.join(process.cwd(), "reports");

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
  // Cloudflare Pages test mode: disable saving
  if (process.env.CF_PAGES === '1') {
    console.log('⚠️ Cloudflare Pages test mode: Report saving disabled');
    return report.report_id;
  }

  return IS_VERCEL
    ? saveReportToBlob(report)
    : saveReportToFilesystem(report);
}

/**
 * List reports from filesystem (local development)
 */
async function listReportsFromFilesystem(): Promise<ReportSummary[]> {
  await ensureReportsDir();

  const path = await import("path");
  const fs = await import("fs/promises");
  const REPORTS_DIR = path.join(process.cwd(), "reports");

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
          const text = await streamToText(result.stream);
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
  // Cloudflare Pages test mode: return empty list
  if (process.env.CF_PAGES === '1') {
    console.log('⚠️ Cloudflare Pages test mode: Report listing disabled');
    return [];
  }

  return IS_VERCEL
    ? listReportsFromBlob()
    : listReportsFromFilesystem();
}

/**
 * Get report from filesystem (local development)
 */
async function getReportFromFilesystem(id: string): Promise<Report | null> {
  const path = await import("path");
  const fs = await import("fs/promises");
  const REPORTS_DIR = path.join(process.cwd(), "reports");

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
    const text = await streamToText(result.stream);
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
  // Cloudflare Pages test mode: not supported
  if (process.env.CF_PAGES === '1') {
    console.log('⚠️ Cloudflare Pages test mode: Report retrieval disabled');
    return null;
  }

  return IS_VERCEL
    ? getReportFromBlob(id)
    : getReportFromFilesystem(id);
}
