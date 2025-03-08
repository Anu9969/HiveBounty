import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { WalletConnect } from '../components/wallet/WalletConnect';
import { useBounties } from '../hooks/useBounties';
import { BountyContract } from '../contracts/bounty.contract';
import { Bounty } from '../types/hive.types';
import { toast } from 'react-hot-toast';
import { parseGitHubUrl } from '../utils/github';

const BountyDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { account } = useWalletContext();
  const { bounties, loading: bountiesLoading } = useBounties();
  
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClaimForm, setShowClaimForm] = useState(false);
  const [showConnectWallet, setShowConnectWallet] = useState(false);

  console.log("BountyDetails - ID:", id);
  console.log("BountyDetails - Bounties:", bounties);
  console.log("BountyDetails - Bounties Loading:", bountiesLoading);

  // Find the bounty by ID
  const findBounty = useCallback(() => {
    console.log("Finding bounty with ID:", id);
    
    if (!id || bounties.length === 0) {
      return;
    }
    
    const foundBounty = bounties.find(b => b.id === id);
    console.log("Found bounty:", foundBounty);
    
    if (foundBounty) {
      setBounty(foundBounty);
      setLoading(false);
    } else {
      setError('Bounty not found');
      setLoading(false);
    }
  }, [id, bounties]);

  // Only run this effect once when the component mounts or when dependencies change
  useEffect(() => {
    if (bounties.length > 0) {
      findBounty();
    } else if (!bountiesLoading) {
      setError('No bounties available');
      setLoading(false);
    }
  }, [bounties, bountiesLoading, findBounty]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      setShowConnectWallet(true);
      toast.error('Please connect your Hive wallet first');
      return;
    }
    
    if (!bounty) {
      toast.error('Bounty details not found');
      return;
    }
    
    // Validate PR URL
    const prUrlInfo = parseGitHubUrl(pullRequestUrl);
    if (!prUrlInfo || prUrlInfo.type !== 'pull') {
      toast.error('Please enter a valid GitHub pull request URL');
      return;
    }
    
    setIsSubmitting(true);
    const loadingToast = toast.loading('Verifying and processing your claim...');
    
    try {
      const bountyContract = new BountyContract(account.name);
      
      // Convert bounty to BountyProgram format
      let bountyStatus: 'OPEN' | 'CLAIMED' | 'VERIFIED' | 'PAID';
      switch (bounty.status) {
        case 'open':
          bountyStatus = 'OPEN';
          break;
        case 'in_progress':
          bountyStatus = 'CLAIMED';
          break;
        case 'completed':
          bountyStatus = 'VERIFIED';
          break;
        default:
          bountyStatus = 'PAID';
      }
      
      const bountyProgram = {
        id: bounty.id,
        title: bounty.title,
        description: bounty.description,
        githubLink: bounty.githubLink,
        prizePool: parseFloat(bounty.amount),
        creator: bounty.creator,
        status: bountyStatus,
        created: bounty.created_at
      };
      
      // For demo purposes, use autoVerifyAndPay to handle the entire flow
      const response = await bountyContract.autoVerifyAndPay(
        bounty.id,
        bountyProgram,
        pullRequestUrl
      );
      
      toast.dismiss(loadingToast);
      
      if (response.success) {
        toast.success(response.message);
        // Refresh the page or navigate back to home
        navigate('/');
      } else {
        setError(response.message);
        toast.error(response.message);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.message || 'Failed to process claim';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Bounty Details</h1>
            <WalletConnect />
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="animate-pulse flex space-x-4">
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error && !bounty) {
    return (
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">Bounty Details</h1>
            <WalletConnect />
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
            <div className="text-red-600 text-center">
              <p>{error}</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Back to Home
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!bounty) {
    return null;
  }

  const statusColors = {
    open: 'bg-green-100 text-green-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  const isCreator = account && account.name === bounty.creator;
  const canClaim = bounty.status === 'open' && account && account.name !== bounty.creator;

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Bounty Details</h1>
          <WalletConnect />
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}
          
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{bounty.title}</h2>
            <span className={`px-3 py-1 text-sm rounded-full ${statusColors[bounty.status]}`}>
              {bounty.status}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-2">Description</h3>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-line">{bounty.description}</p>
              </div>
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">GitHub Issue</h3>
                <a 
                  href={bounty.githubLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.605-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                  </svg>
                  View Issue on GitHub
                </a>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Bounty Details</h3>
              
              <div className="space-y-3">
                <div>
                  <span className="text-gray-600 block">Reward:</span>
                  <span className="text-2xl font-bold text-gray-900">{bounty.amount} {bounty.currency}</span>
                </div>
                
                <div>
                  <span className="text-gray-600 block">Created by:</span>
                  <span className="font-medium">@{bounty.creator}</span>
                </div>
                
                <div>
                  <span className="text-gray-600 block">Created on:</span>
                  <span className="font-medium">{new Date(bounty.created_at).toLocaleDateString()}</span>
                </div>
                
                {bounty.deadline && (
                  <div>
                    <span className="text-gray-600 block">Deadline:</span>
                    <span className="font-medium">{new Date(bounty.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                
                {!account && (
                  <div className="pt-4">
                    <button
                      onClick={() => setShowConnectWallet(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                    >
                      Connect Wallet to Claim
                    </button>
                  </div>
                )}
                
                {canClaim && (
                  <div className="pt-4">
                    <button
                      onClick={() => setShowClaimForm(true)}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded"
                      disabled={isSubmitting}
                    >
                      Claim This Bounty
                    </button>
                  </div>
                )}
                
                {isCreator && (
                  <div className="pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      You created this bounty. When someone submits a claim, you'll be able to review and pay it.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {showConnectWallet && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Connect Your Wallet</h3>
              <p className="mb-4 text-gray-600">
                Connect your Hive wallet to claim this bounty or create new bounties.
              </p>
              <div className="flex justify-center">
                <WalletConnect />
              </div>
            </div>
          )}
          
          {showClaimForm && (
            <div className="mt-8 border-t pt-6">
              <h3 className="text-xl font-semibold mb-4">Claim Bounty</h3>
              <form onSubmit={handleClaim}>
                <div className="mb-4">
                  <label htmlFor="pullRequestUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    GitHub Pull Request URL
                  </label>
                  <input
                    type="url"
                    id="pullRequestUrl"
                    value={pullRequestUrl}
                    onChange={(e) => setPullRequestUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo/pull/123"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the URL of the merged pull request that fixes the issue
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <button
                    type="submit"
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processing...' : 'Submit Claim'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClaimForm(false)}
                    className="text-gray-600 hover:text-gray-800"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back to Bounties
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BountyDetails;