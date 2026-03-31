export interface GitHubPRInfo {
  title: string;
  description: string;
  author: string;
  diff: string;
}

export function parseGitHubPRUrl(url: string): {
  owner: string;
  repo: string;
  prNumber: string;
} | null {
  // Support formats:
  // https://github.com/owner/repo/pull/123
  // github.com/owner/repo/pull/123
  const match = url.match(
    /(?:https?:\/\/)?github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/
  );
  if (!match) return null;
  return { owner: match[1], repo: match[2], prNumber: match[3] };
}

export async function fetchGitHubPRDiff(
  owner: string,
  repo: string,
  prNumber: string,
  githubToken?: string
): Promise<GitHubPRInfo> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "code-review-bot",
  };

  if (githubToken) {
    headers["Authorization"] = `Bearer ${githubToken}`;
  }

  // Fetch PR metadata
  const prResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    { headers }
  );

  if (!prResponse.ok) {
    if (prResponse.status === 404) {
      throw new Error(
        `PR #${prNumber} not found in ${owner}/${repo}. Make sure the repository is public.`
      );
    }
    if (prResponse.status === 403) {
      throw new Error(
        "GitHub API rate limit exceeded. Please add a GitHub token or paste the diff directly."
      );
    }
    throw new Error(`GitHub API error: ${prResponse.status} ${prResponse.statusText}`);
  }

  const prData = await prResponse.json();

  // Fetch the diff
  const diffResponse = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        ...headers,
        Accept: "application/vnd.github.v3.diff",
      },
    }
  );

  if (!diffResponse.ok) {
    throw new Error(`Failed to fetch diff: ${diffResponse.status}`);
  }

  const diff = await diffResponse.text();

  // Limit diff size to avoid token limits
  const maxDiffLength = 15000;
  const truncatedDiff =
    diff.length > maxDiffLength
      ? diff.slice(0, maxDiffLength) +
        `\n\n... [Diff truncated. Total size: ${diff.length} chars]`
      : diff;

  return {
    title: prData.title,
    description: prData.body || "No description provided.",
    author: prData.user?.login || "Unknown",
    diff: truncatedDiff,
  };
}
