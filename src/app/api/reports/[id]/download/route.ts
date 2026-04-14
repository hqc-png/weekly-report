import { auth } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

// Check if running on Vercel or Cloudflare
const IS_VERCEL = !!process.env.BLOB_READ_WRITE_TOKEN;
const IS_CLOUDFLARE = !!process.env.IS_CLOUDFLARE_PAGES;

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

    // Cloudflare Pages: not supported in preview mode
    if (IS_CLOUDFLARE) {
      return NextResponse.json(
        { error: "Download not available in Cloudflare preview mode" },
        { status: 501 }
      );
    }

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

    // Local development: Edge runtime doesn't support fs
    return NextResponse.json(
      { error: "Download only available in production (Vercel)" },
      { status: 501 }
    );
  } catch (error) {
    console.error("Error downloading report:", error);
    return NextResponse.json(
      { error: "Failed to download report" },
      { status: 500 }
    );
  }
}
