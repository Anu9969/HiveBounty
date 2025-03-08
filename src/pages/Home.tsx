import React from 'react';
import { Link } from 'react-router-dom';
import { WalletConnect } from '../components/wallet/WalletConnect';
import { BountyCard } from '../components/bounty/BountyCard';
import { useBounties } from '../hooks/useBounties';

const Home = () => {
  const { bounties, loading, error, refresh } = useBounties();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header with Gradient */}
      <header className="bg-white shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10"></div>
        <div className="max-w-7xl mx-auto py-6 px-4 relative">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold gradient-text">DevBounties</h1>
              <p className="mt-2 text-gray-600">Empowering Open Source with Blockchain Rewards</p>
            </div>
            <WalletConnect />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Contribute to Open Source.<br/>
                Get Rewarded in Crypto.
              </h2>
              <p className="text-lg mb-8 text-gray-100">
                Find exciting bounties, solve issues, and earn HIVE tokens for your contributions to the open-source community.
              </p>
              <div className="flex space-x-4">
                <Link to="/create" className="primary-button bg-white text-indigo-600">
                  Create Bounty
                </Link>
                <a href="#bounties" className="secondary-button bg-transparent border-white text-white">
                  View Bounties
                </a>
              </div>
            </div>
            <div className="hidden md:block">
              {/* Add your hero image or illustration here */}
              <div className="glass-card p-8 text-center">
                <div className="text-5xl mb-4">🚀</div>
                <div className="text-2xl font-semibold">Start Earning Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">{bounties.length}</div>
              <div className="text-gray-600">Active Bounties</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                {bounties.reduce((acc, b) => acc + parseFloat(b.amount), 0)} HIVE
              </div>
              <div className="text-gray-600">Total Value Locked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold gradient-text mb-2">
                {bounties.filter(b => b.status === 'completed').length}
              </div>
              <div className="text-gray-600">Completed Bounties</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bounties Section */}
      <main id="bounties" className="max-w-7xl mx-auto py-12 px-4">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold gradient-text">Active Bounties</h2>
            <p className="text-gray-600 mt-2">Find the perfect issue to solve</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={refresh}
              className="secondary-button flex items-center"
            >
              <span className="mr-2">↻</span> Refresh
            </button>
            <Link to="/create" className="primary-button">
              Create Bounty
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse bg-white rounded-xl p-6 shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : bounties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bounties.map(bounty => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎯</div>
            <h3 className="text-2xl font-semibold mb-2">No Active Bounties</h3>
            <p className="text-gray-600 mb-6">Be the first to create a bounty and start rewarding contributors!</p>
            <Link to="/create" className="primary-button inline-flex">
              Create Your First Bounty
            </Link>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold gradient-text mb-4">Ready to Start?</h2>
            <p className="text-gray-600 mb-6">
              Join the community of developers earning rewards for their open-source contributions
            </p>
            <Link to="/create" className="primary-button inline-flex">
              Create a Bounty
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;