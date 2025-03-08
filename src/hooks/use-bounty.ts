import { useState } from 'react';
import { BountyContract } from '@/contracts/bounty.contract';
import { useHiveWallet } from './use-hive-wallet';

export const useBounty = () => {
  const { connectedUser } = useHiveWallet();
  const [isLoading, setIsLoading] = useState(false);

  const contract = connectedUser ? new BountyContract(connectedUser) : null;

  const createBounty = async (bountyData: any) => {
    if (!contract) throw new Error('Wallet not connected');
    setIsLoading(true);
    try {
      // First create the bounty
      const result = await contract.createBounty(bountyData);
      if (result.success) {
        // Then fund it
        const fundResult = await contract.fundBounty(
          result.txId,
          bountyData.prizePool
        );
        return fundResult;
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  };

  const submitSolution = async (submission: any) => {
    if (!contract) throw new Error('Wallet not connected');
    setIsLoading(true);
    try {
      // Verify GitHub PR is merged
      const isValidClaim = await verifyGithubMerge(
        submission.pullRequestUrl,
        submission.mergeCommitHash
      );

      if (!isValidClaim) {
        throw new Error('Invalid claim - PR not merged or hash mismatch');
      }

      return await contract.submitSolution(submission);
    } finally {
      setIsLoading(false);
    }
  };

  // Verify GitHub PR merge status and commit hash
  const verifyGithubMerge = async (prUrl: string, commitHash: string) => {
    // Extract owner, repo, and PR number from URL
    const matches = prUrl.match(/github\.com\/(.+)\/(.+)\/pull\/(\d+)/);
    if (!matches) return false;

    const [, owner, repo, prNumber] = matches;

    try {
      // Fetch PR details from GitHub API
      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`
      );
      const prData = await response.json();

      return (
        prData.merged && // PR is merged
        prData.merge_commit_sha === commitHash // Commit hash matches
      );
    } catch (error) {
      console.error('Error verifying GitHub PR:', error);
      return false;
    }
  };

  return {
    createBounty,
    submitSolution,
    isLoading
  };
};