import { auth } from "@/auth";
import { getReport } from "@/lib/reports";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

// Check if running on Vercel
const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;

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

    // Vercel environment: use Blob storage
    if (IS_VERCEL) {
      const { get } = await import("@vercel/blob");

      try {
        // Use get() method for private blob access
        const result = await get(`reports/${id}.md`, {
          access: "private",
        });

        if (!result || result.statusCode !== 200) {
          return NextResponse.json(
            { error: "Report not found" },
            { status: 404 }
          );
        }

        // Return the stream directly to the client
        return new NextResponse(result.stream, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": `attachment; filename="${id}.md"`,
            "Cache-Control": "private, no-cache",
          },
        });
      } catch (error) {
        console.error("Blob download error:", error);
        return NextResponse.json(
          { error: "Report not found" },
          { status: 404 }
        );
      }
    }

    // Local development: use filesystem
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
        "Content-Type": "text/markdown; charset=utf-8",
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
