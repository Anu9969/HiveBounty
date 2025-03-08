/**
 * GitHub API utilities for bounty verification
 */

// Extract owner, repo, and issue/PR number from GitHub URL
export const parseGitHubUrl = (url: string): { owner: string; repo: string; number: number; type: 'issues' | 'pull' } | null => {
  try {
    const regex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+)\/(issues|pull)\/(\d+)$/;
    const match = url.match(regex);
    
    if (!match) return null;
    
    return {
      owner: match[1],
      repo: match[2],
      type: match[3] as 'issues' | 'pull',
      number: parseInt(match[4])
    };
  } catch (error) {
    console.error('Error parsing GitHub URL:', error);
    return null;
  }
};

// Check if an issue is closed
export const isIssueClosed = async (owner: string, repo: string, issueNumber: number): Promise<boolean> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues/${issueNumber}`);
    const data = await response.json();
    
    return data.state === 'closed';
  } catch (error) {
    console.error('Error checking issue status:', error);
    return false;
  }
};

// Get PR details including merge status and user
export const getPullRequestDetails = async (owner: string, repo: string, prNumber: number): Promise<{
  merged: boolean;
  mergeCommitSha: string | null;
  user: {
    login: string;
    html_url: string;
  } | null;
}> => {
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`);
    const data = await response.json();
    
    return {
      merged: data.merged || false,
      mergeCommitSha: data.merge_commit_sha || null,
      user: data.user || null
    };
  } catch (error) {
    console.error('Error fetching PR details:', error);
    return {
      merged: false,
      mergeCommitSha: null,
      user: null
    };
  }
};

// Get GitHub username from profile URL
export const getGitHubUsername = (profileUrl: string): string | null => {
  try {
    const regex = /^https:\/\/github\.com\/([^\/]+)$/;
    const match = profileUrl.match(regex);
    
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error extracting GitHub username:', error);
    return null;
  }
};

// Verify if a PR is linked to an issue
export const isPRLinkedToIssue = async (owner: string, repo: string, prNumber: number, issueNumber: number): Promise<boolean> => {
  try {
    // First check PR body for mentions of the issue
    const prResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`);
    const prData = await prResponse.json();
    
    const issueRef = `#${issueNumber}`;
    const issueUrl = `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
    
    if (prData.body && (prData.body.includes(issueRef) || prData.body.includes(issueUrl))) {
      return true;
    }
    
    // Then check PR commits for mentions of the issue
    const commitsResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/commits`);
    const commits = await commitsResponse.json();
    
    for (const commit of commits) {
      if (commit.commit.message && (commit.commit.message.includes(issueRef) || commit.commit.message.includes(issueUrl))) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking PR-issue link:', error);
    return false;
  }
}; 