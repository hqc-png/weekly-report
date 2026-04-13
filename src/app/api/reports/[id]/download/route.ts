import { auth } from "@/auth";
import { getReport } from "@/lib/reports";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the markdown file path
    const reportsDir = path.join(process.cwd(), "reports");
    const mdPath = path.join(reportsDir, `${id}.md`);

    // Check if file exists
    try {
      await fs.access(mdPath);
    } catch {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    // Read the markdown file
    const markdownContent = await fs.readFile(mdPath, "utf-8");

    // Return as downloadable file
    return new NextResponse(markdownContent, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${id}.md"`,
      },
    });
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}
