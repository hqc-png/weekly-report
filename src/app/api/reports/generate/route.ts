import { auth } from "@/auth";
import { fetchUserCommits } from "@/lib/github";
import { summarizeCommits } from "@/lib/claude";
import { saveReport } from "@/lib/reports";
import { getWeekNumber, formatDateRange } from "@/lib/date-utils";
import { NextRequest, NextResponse } from "next/server";
import { Report } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const session = await auth();

    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;
    const username = (session as any).username || session.user?.name || "unknown";

    // 2. Validate request body
    const body = await request.json();
    const { repositories, since, until, title } = body;

    if (!repositories || !Array.isArray(repositories) || repositories.length === 0) {
      return NextResponse.json(
        { error: "At least one repository must be selected" },
        { status: 400 }
      );
    }

    if (!since || !until) {
      return NextResponse.json(
        { error: "Date range (since and until) is required" },
        { status: 400 }
      );
    }

    // Validate date range
    const sinceDate = new Date(since);
    const untilDate = new Date(until);

    if (isNaN(sinceDate.getTime()) || isNaN(untilDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (untilDate <= sinceDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    // 3. Fetch commits from GitHub
    const commits = await fetchUserCommits(
      accessToken,
      username,
      repositories,
      since,
      until
    );

    // 4. Check if commits array is empty
    if (commits.length === 0) {
      return NextResponse.json(
        { error: "No commits found for this period" },
        { status: 400 }
      );
    }

    // 5. Send commits to Claude for summarization
    const { summary, markdown } = await summarizeCommits(commits, {
      start: since,
      end: until,
    });

    // 6. Generate report ID
    const weekNumber = getWeekNumber(new Date(since));
    const randomHash = Math.random().toString(36).substring(2, 8);
    const reportId = `${weekNumber}-${randomHash}`;

    // 7. Create report object
    const report: Report = {
      report_id: reportId,
      title: title || `Week Report (${formatDateRange(since, until)})`,
      summary,
      markdown,
      metadata: {
        generated_at: new Date().toISOString(),
        commit_count: commits.length,
        repositories,
        date_range: {
          start: since,
          end: until,
        },
        user: {
          username,
          email: session.user?.email || undefined,
        },
      },
    };

    // 8. Save report to disk
    await saveReport(report);

    // 9. Return report data (with Cloudflare Pages note)
    const response = {
      ...report,
      _note: process.env.CF_PAGES === '1'
        ? 'Test mode: Report generated but not saved (Cloudflare Pages deployment test)'
        : undefined
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Report generation error:", error);

    // Handle specific errors
    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: error.message },
        { status: 429 }
      );
    }

    if (error.message?.includes("authentication")) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: "Failed to generate report. Please try again." },
      { status: 500 }
    );
  }
}
