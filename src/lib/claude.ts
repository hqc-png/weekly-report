import Anthropic from "@anthropic-ai/sdk";
import { GitHubCommit } from "./types";
import { formatDateRange } from "./date-utils";
import { generateBasicReport } from "./fallback-summary";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

/**
 * Summarize commits using Claude API
 */
export async function summarizeCommits(
  commits: GitHubCommit[],
  dateRange: { start: string; end: string }
): Promise<{ summary: string; markdown: string }> {
  // Group commits by repository
  const commitsByRepo: Record<string, GitHubCommit[]> = {};
  commits.forEach((commit) => {
    if (!commitsByRepo[commit.repository]) {
      commitsByRepo[commit.repository] = [];
    }
    commitsByRepo[commit.repository].push(commit);
  });

  // Format commits for the prompt
  const formattedCommits = Object.entries(commitsByRepo)
    .map(([repo, repoCommits]) => {
      const commitList = repoCommits
        .map(
          (c) =>
            `  - ${c.message.split("\n")[0]} (${new Date(c.date).toLocaleDateString()})`
        )
        .join("\n");
      return `**${repo}** (${repoCommits.length} commits):\n${commitList}`;
    })
    .join("\n\n");

  const dateRangeStr = formatDateRange(dateRange.start, dateRange.end);

  const prompt = `You are a professional technical writer creating a weekly work report. Below are ${commits.length} commits from ${dateRangeStr}.

Commits by repository:
${formattedCommits}

Please create a well-structured weekly report in Markdown format that includes:

1. **Executive Summary**: A brief 2-3 sentence overview of the week's accomplishments
2. **Work by Project/Repository**: Group the work by repository and describe what was accomplished
3. **Key Achievements**: Highlight the most important accomplishments or milestones
4. **Technical Details** (if applicable): Any significant technical decisions or implementations

Guidelines:
- Use clear, professional language
- Focus on impact and outcomes, not just tasks
- Use proper Markdown formatting (headers, lists, bold, etc.)
- Be concise but informative
- Maintain a positive, achievement-oriented tone

Date Range: ${dateRangeStr}`;

  try {
    const message = await anthropic.messages.create({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const fullMarkdown = message.content[0].type === "text"
      ? message.content[0].text
      : "";

    // Extract executive summary (first paragraph or section)
    const lines = fullMarkdown.split("\n").filter((line) => line.trim());
    const summaryEndIndex = lines.findIndex(
      (line, idx) => idx > 0 && line.startsWith("#")
    );
    const summary =
      summaryEndIndex > 0
        ? lines.slice(0, summaryEndIndex).join(" ").substring(0, 300)
        : lines.slice(0, 3).join(" ").substring(0, 300);

    return {
      summary: summary || "Weekly report generated successfully.",
      markdown: fullMarkdown,
    };
  } catch (error: any) {
    console.error("Claude API error:", error);
    console.warn("⚠️  AI service unavailable, generating basic report...");

    // Fallback: generate basic report without AI
    return generateBasicReport(commits, dateRange);
  }
}
