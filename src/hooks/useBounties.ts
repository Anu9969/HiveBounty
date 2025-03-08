import { useState, useEffect } from 'react';
import { client } from '../config/hive.config';
import { Bounty } from '../types/hive.types';
import { sendHiveTokens } from '../utils/hive';
import { toast } from 'react-hot-toast';

// Sample dummy bounty for demonstration
const SAMPLE_BOUNTY: Bounty = {
  id: 'sample-bounty-123',
  title: 'Fix Navigation Bug in React App',
  description: 'There is an issue with the navigation component where clicking the back button twice causes the app to crash. This needs to be fixed by properly handling the navigation history and preventing multiple back actions in quick succession.',
  amount: '10',
  currency: 'HIVE',
  creator: 'devbounties',
  status: 'open',
  created_at: new Date().toISOString(),
  githubLink: 'https://github.com/facebook/react/issues/24502',
  deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days from now
};

// Add a second sample bounty
const SAMPLE_BOUNTY_2: Bounty = {
  id: 'sample-bounty-456',
  title: 'Implement Dark Mode in React App',
  description: 'Add a dark mode feature to the application that respects the user\'s system preferences and allows manual toggling. This should include updating the color scheme and saving the preference.',
  amount: '15',
  currency: 'HIVE',
  creator: 'devbounties',
  status: 'open',
  created_at: new Date().toISOString(),
  githubLink: 'https://github.com/facebook/react/issues/16116',
  deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString() // 21 days from now
};

export const useBounties = () => {
  const [bounties, setBounties] = useState<Bounty[]>([SAMPLE_BOUNTY, SAMPLE_BOUNTY_2]); // Initialize with sample bounties
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBounties = async () => {
    console.log("Fetching bounties...");
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement actual bounty fetching from Hive blockchain
      // This is a placeholder implementation
      const response = await client.database.getDiscussions('created', { tag: 'bounty', limit: 20 });
      const parsedBounties: Bounty[] = response
        .map((post: any) => {
          try {
            const json = JSON.parse(post.json_metadata);
            if (json.bounty) {
              return {
                id: post.id,
                title: post.title,
                description: post.body,
                amount: json.bounty.amount,
                currency: json.bounty.currency,
                creator: post.author,
                status: json.bounty.status || 'open',
                created_at: post.created,
                deadline: json.bounty.deadline,
                githubLink: json.bounty.githubLink || ''
              } as Bounty;
            }
            return null;
          } catch (err) {
            return null;
          }
        })
        .filter((bounty): bounty is Bounty => bounty !== null);
      
      // Add the sample bounties to the list
      const allBounties = [SAMPLE_BOUNTY, SAMPLE_BOUNTY_2, ...parsedBounties];
      console.log("Fetched bounties:", allBounties);
      setBounties(allBounties);
    } catch (err) {
      console.error("Error fetching bounties:", err);
      setError('Failed to fetch bounties');
      // Even if fetching fails, show the sample bounties
      setBounties([SAMPLE_BOUNTY, SAMPLE_BOUNTY_2]);
    } finally {
      setLoading(false);
    }
  };

  const createBounty = async (bountyData: Omit<Bounty, 'id' | 'creator' | 'status' | 'created_at'>, username: string) => {
    try {
      // First send the tokens to escrow
      const txResponse = await sendHiveTokens(
        username,
        'bounty.escrow', // Replace with actual escrow account
        bountyData.amount,
        JSON.stringify({ type: 'bounty_creation', ...bountyData })
      );

      if (!txResponse.success) {
        throw new Error(txResponse.message);
      }

      // Add the new bounty to the list (for demo purposes)
      const newBounty: Bounty = {
        id: `bounty-${Date.now()}`,
        title: bountyData.title,
        description: bountyData.description,
        amount: bountyData.amount,
        currency: bountyData.currency as 'HIVE' | 'HBD',
        creator: username,
        status: 'open',
        created_at: new Date().toISOString(),
        githubLink: bountyData.githubLink,
        deadline: bountyData.deadline
      };
      
      setBounties(prevBounties => [newBounty, ...prevBounties]);
      toast.success('Bounty created successfully!');

      return { success: true, message: 'Bounty created successfully' };
    } catch (err: any) {
      console.error('Failed to create bounty:', err);
      return { success: false, message: err.message || 'Failed to create bounty' };
    }
  };

  useEffect(() => {
    fetchBounties();
  }, []);

  return {
    bounties,
    loading,
    error,
    refresh: fetchBounties,
    createBounty
  };
}; 