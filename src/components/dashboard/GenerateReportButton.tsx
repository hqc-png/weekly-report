"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

interface GenerateReportButtonProps {
  repositories: string[];
  startDate: string;
  endDate: string;
}

export function GenerateReportButton({
  repositories,
  startDate,
  endDate,
}: GenerateReportButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (repositories.length === 0) {
        throw new Error("Please select at least one repository");
      }

      if (!startDate || !endDate) {
        throw new Error("Please select a date range");
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        throw new Error("End date must be after start date");
      }

      // Convert to ISO format with time
      const since = new Date(start).toISOString();
      const until = new Date(end.setHours(23, 59, 59, 999)).toISOString();

      // Call API to generate report
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          repositories,
          since,
          until,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate report");
      }

      const report = await response.json();

      // Navigate to the report detail page
      router.push(`/reports/${report.report_id}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={handleGenerate}
        disabled={loading || repositories.length === 0 || !startDate || !endDate}
        className="w-full text-base sm:text-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            Generating Report...
          </span>
        ) : (
          "Generate Weekly Report"
        )}
      </Button>

      {error && <ErrorMessage message={error} onRetry={handleGenerate} />}
    </div>
  );
}
