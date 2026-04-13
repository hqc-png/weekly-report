import { auth } from "@/auth";
import { listReports } from "@/lib/reports";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Verify authentication
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // List all reports
    const reports = await listReports();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error listing reports:", error);
    return NextResponse.json(
      { error: "Failed to list reports" },
      { status: 500 }
    );
  }
}
