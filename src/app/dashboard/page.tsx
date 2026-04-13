"use client";

import { SignOutButton } from "@/components/auth/SignOutButton";
import { Card } from "@/components/ui/Card";
import { RepoSelector } from "@/components/dashboard/RepoSelector";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";
import { GenerateReportButton } from "@/components/dashboard/GenerateReportButton";
import { ReportListClient } from "@/components/reports/ReportListClient";
import { Loading } from "@/components/ui/Loading";
import { getCurrentWeekRange } from "@/lib/date-utils";
import { useState, useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Initialize with current week dates
  useEffect(() => {
    const { start, end } = getCurrentWeekRange();
    setStartDate(start.split("T")[0]);
    setEndDate(end.split("T")[0]);
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-black dark:text-white mb-1">
                Weekly Report Generator
              </h1>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Welcome, {session.user?.name || session.user?.email}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Report Generator */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white mb-4 sm:mb-6">
                Generate Weekly Report
              </h2>

              <div className="space-y-6">
                <RepoSelector
                  selectedRepos={selectedRepos}
                  onSelectionChange={setSelectedRepos}
                />

                <DateRangePicker
                  startDate={startDate}
                  endDate={endDate}
                  onStartDateChange={setStartDate}
                  onEndDateChange={setEndDate}
                />

                <GenerateReportButton
                  repositories={selectedRepos}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            </Card>

            {/* Historical Reports */}
            <div className="mt-6">
              <h2 className="text-lg sm:text-xl font-semibold text-black dark:text-white mb-4">
                Historical Reports
              </h2>
              <ReportListClient />
            </div>
          </div>

          {/* Instructions */}
          <div>
            <Card>
              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
                How it works
              </h3>
              <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    1
                  </span>
                  <span>Select the repositories you want to include</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    2
                  </span>
                  <span>Choose a date range (defaults to current week)</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
                    3
                  </span>
                  <span>
                    Click generate and AI will summarize your commits into a
                    professional report
                  </span>
                </li>
              </ol>
            </Card>

            <Card className="mt-6">
              <h3 className="text-lg font-semibold text-black dark:text-white mb-3">
                Note
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Only commits authored by you will be included in the report.
                Private repositories require proper GitHub access permissions.
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
