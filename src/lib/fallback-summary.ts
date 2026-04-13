import { GitHubCommit } from "./types";
import { formatDateRange } from "./date-utils";

/**
 * Generate basic weekly report without AI
 * Used as fallback when Claude API is unavailable
 */
export function generateBasicReport(
  commits: GitHubCommit[],
  dateRange: { start: string; end: string }
): { summary: string; markdown: string } {
  // Group commits by repository
  const commitsByRepo: Record<string, GitHubCommit[]> = {};
  commits.forEach((commit) => {
    if (!commitsByRepo[commit.repository]) {
      commitsByRepo[commit.repository] = [];
    }
    commitsByRepo[commit.repository].push(commit);
  });

  const totalCommits = commits.length;
  const repoCount = Object.keys(commitsByRepo).length;
  const dateRangeStr = formatDateRange(dateRange.start, dateRange.end);

  // Generate summary
  const summary = `Completed ${totalCommits} commits across ${repoCount} ${
    repoCount === 1 ? "repository" : "repositories"
  } during ${dateRangeStr}.`;

  // Generate Markdown report
  let markdown = `# Weekly Work Report\n`;
  markdown += `**Period**: ${dateRangeStr}\n`;
  markdown += `**Total Commits**: ${totalCommits}\n`;
  markdown += `**Repositories**: ${repoCount}\n\n`;
  markdown += `---\n\n`;

  // List commits by repository
  Object.entries(commitsByRepo).forEach(([repo, repoCommits]) => {
    markdown += `## ${repo}\n\n`;
    markdown += `**${repoCommits.length} ${
      repoCommits.length === 1 ? "commit" : "commits"
    }**\n\n`;

    repoCommits.forEach((commit) => {
      const message = commit.message.split("\n")[0]; // First line only
      const date = new Date(commit.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      markdown += `- **${message}** (${date})\n`;
    });

    markdown += `\n`;
  });

  markdown += `---\n\n`;
  markdown += `*This report was generated using basic formatting (AI service unavailable).*\n`;

  return { summary, markdown };
}
