import { Octokit } from "@octokit/rest";
import { GitHubRepository, GitHubCommit } from "./types";

/**
 * Fetch all repositories for the authenticated user
 */
export async function fetchUserRepositories(
  accessToken: string
): Promise<GitHubRepository[]> {
  const octokit = new Octokit({ auth: accessToken });

  try {
    const { data } = await octokit.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 100,
      affiliation: "owner,collaborator,organization_member",
    });

    return data.map((repo) => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      private: repo.private,
      updated_at: repo.updated_at || new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error("GitHub API error:", error);

    if (error.status === 403) {
      throw new Error("GitHub API rate limit exceeded. Please try again later.");
    }

    if (error.status === 401) {
      throw new Error("GitHub authentication failed. Please sign in again.");
    }

    throw new Error("Failed to fetch repositories from GitHub.");
  }
}

/**
 * Fetch commits for specified repositories, filtered by the authenticated user
 */
export async function fetchUserCommits(
  accessToken: string,
  username: string,
  repositories: string[],
  since: string,
  until: string
): Promise<GitHubCommit[]> {
  const octokit = new Octokit({ auth: accessToken });
  const allCommits: GitHubCommit[] = [];

  // Fetch user's email addresses to match commits
  let userEmails: string[] = [];
  try {
    const { data: emails } = await octokit.users.listEmailsForAuthenticatedUser();
    userEmails = emails.map((email) => email.email.toLowerCase());
  } catch (error) {
    console.error("Failed to fetch user emails:", error);
  }

  for (const repo of repositories) {
    const [owner, repoName] = repo.split("/");

    try {
      const { data } = await octokit.repos.listCommits({
        owner,
        repo: repoName,
        since,
        until,
        per_page: 100,
      });

      // Filter commits to only include those authored by the authenticated user
      const userCommits = data.filter((commit) => {
        const authorLogin = commit.author?.login?.toLowerCase();
        const authorEmail = commit.commit.author?.email?.toLowerCase();

        // Match by GitHub username or email
        return (
          authorLogin === username.toLowerCase() ||
          (authorEmail && userEmails.includes(authorEmail))
        );
      });

      // Transform and add to results
      userCommits.forEach((commit) => {
        allCommits.push({
          repository: repo,
          sha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || username,
          date: commit.commit.author?.date || new Date().toISOString(),
          url: commit.html_url,
        });
      });
    } catch (error: any) {
      console.error(`Failed to fetch commits for ${repo}:`, error);

      // Continue with other repos even if one fails
      // This handles cases like insufficient permissions or deleted repos
      if (error.status !== 404 && error.status !== 403) {
        // Only throw for unexpected errors
        throw new Error(`Failed to fetch commits for ${repo}`);
      }
    }
  }

  // Sort commits by date (newest first)
  return allCommits.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}
