import { auth } from "@/auth";
import { fetchUserRepositories } from "@/lib/github";
import { NextResponse } from "next/server";

export const runtime = 'edge';

export async function GET() {
  try {
    // Verify authentication
    const session = await auth();

    if (!session || !(session as any).accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = (session as any).accessToken;

    // Fetch repositories from GitHub
    const repositories = await fetchUserRepositories(accessToken);

    return NextResponse.json({ repositories });
  } catch (error: any) {
    console.error("API Error:", error);

    // Handle rate limits
    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "GitHub API rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Handle authentication errors
    if (error.message?.includes("authentication")) {
      return NextResponse.json(
        { error: "GitHub authentication failed. Please sign in again." },
        { status: 401 }
      );
    }

    // Generic error
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
