import { auth } from "@/auth";
import { SignInButton } from "@/components/auth/SignInButton";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  console.log("Session:", session); // Debug log

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-center py-32 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-8 text-center">
          <h1 className="text-5xl font-bold leading-tight tracking-tight text-black dark:text-zinc-50">
            Weekly Report Generator
          </h1>
          <p className="max-w-lg text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Generate AI-powered weekly reports from your GitHub commits.
            Connect your GitHub account, select repositories, and let Claude
            summarize your work into professional reports.
          </p>

          <div className="flex flex-col gap-4 mt-4 w-full sm:w-auto">
            {session ? (
              <Link
                href="/dashboard"
                className="flex h-12 items-center justify-center gap-2 rounded-full bg-black px-8 text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
              >
                Go to Dashboard
              </Link>
            ) : (
              <SignInButton />
            )}
          </div>

          <div className="mt-8 text-sm text-zinc-500 dark:text-zinc-600">
            <p>✓ GitHub OAuth authentication</p>
            <p>✓ AI-powered summarization with Claude</p>
            <p>✓ Export reports as Markdown</p>
          </div>
        </div>
      </main>
    </div>
  );
}
