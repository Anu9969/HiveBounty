import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWalletContext } from '../context/WalletContext';
import { useBounties } from '../hooks/useBounties';
import { toast } from 'react-hot-toast';
import { BountyContract } from '../contracts/bounty.contract';

const CreateBounty = () => {
  const navigate = useNavigate();
  const { account } = useWalletContext();
  const { createBounty } = useBounties();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currency: 'HIVE',
    deadline: '',
    githubLink: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateGithubUrl = (url: string) => {
    const githubRegex = /^https:\/\/github\.com\/[a-zA-Z0-9-]+\/[a-zA-Z0-9-._]+\/(issues|pull)\/\d+$/;
    return githubRegex.test(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!account) {
      setError('Please connect your Hive wallet first');
      toast.error('Please connect your Hive wallet first');
      return;
    }

    if (!window.hive_keychain) {
      setError('Hive Keychain extension not found');
      toast.error('Hive Keychain extension not found');
      return;
    }

    if (!validateGithubUrl(formData.githubLink)) {
      setError('Please enter a valid GitHub issue or pull request URL');
      toast.error('Please enter a valid GitHub issue or pull request URL');
      return;
    }

    // Ensure amount is a valid number
    if (formData.amount === '' || isNaN(parseFloat(formData.amount))) {
      setError('Please enter a valid reward amount');
      toast.error('Please enter a valid reward amount');
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Creating bounty on blockchain...');

    try {
      // Use BountyContract directly for blockchain integration
      const bountyContract = new BountyContract(account.name);
      const response = await bountyContract.createBounty({
        title: formData.title,
        description: formData.description,
        githubLink: formData.githubLink,
        prizePool: parseFloat(formData.amount)
      });

      toast.dismiss(loadingToast);

      if (response.success) {
        toast.success('Bounty successfully created on Hive blockchain!');
        navigate('/');
      } else {
        setError(response.message);
        toast.error(response.message);
      }
    } catch (err: any) {
      toast.dismiss(loadingToast);
      const errorMessage = err.message || 'Failed to create bounty';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">Create Bounty</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white shadow-sm rounded-lg p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="githubLink" className="block text-sm font-medium text-gray-700">
                GitHub Issue/PR Link
              </label>
              <input
                type="url"
                id="githubLink"
                value={formData.githubLink}
                onChange={(e) => setFormData({ ...formData, githubLink: e.target.value })}
                placeholder="https://github.com/owner/repo/issues/123"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Link to the GitHub issue or pull request that needs to be fixed
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
                placeholder="Describe the bug and what needs to be fixed..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                  Reward Amount
                </label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                  step="0.001"
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                  Currency
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="HIVE">HIVE</option>
                  <option value="HBD">HBD</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700">
                Deadline (optional)
              </label>
              <input
                type="date"
                id="deadline"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600 disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating...' : 'Create Bounty'}
              </button>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateBounty;
