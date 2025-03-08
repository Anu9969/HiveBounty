import { useState, useEffect } from 'react';
import { isKeychainInstalled, connectWithKeychain } from '../utils/hive';
import { HiveAccount } from '../types/hive.types';
import { toast } from 'react-hot-toast';

export const useWallet = () => {
  const [account, setAccount] = useState<HiveAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(true); // Start with true to prevent flicker
  const [error, setError] = useState<string | null>(null);
  const [keychainDetected, setKeychainDetected] = useState<boolean>(isKeychainInstalled());

  // Load account from localStorage on mount
  useEffect(() => {
    const savedAccount = localStorage.getItem('hiveAccount');
    if (savedAccount) {
      try {
        setAccount(JSON.parse(savedAccount));
      } catch (err) {
        console.error('Failed to parse saved account', err);
        localStorage.removeItem('hiveAccount');
      }
    }
  }, []);

  useEffect(() => {
    // Check for Keychain with a delay as it might load after our app
    const timer = setTimeout(() => {
      setKeychainDetected(isKeychainInstalled());
      
      // Check for saved username in localStorage
      const savedUsername = localStorage.getItem('hiveUsername');
      if (savedUsername && isKeychainInstalled() && !account) {
        handleConnect(savedUsername);
      } else {
        // If no saved username or already connected, stop the connecting state
        setIsConnecting(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleConnect = async (username: string): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      const response = await connectWithKeychain(username);
      if (response.success && response.account) {
        setAccount(response.account);
        // Save account to localStorage for persistence
        localStorage.setItem('hiveAccount', JSON.stringify(response.account));
        localStorage.setItem('hiveUsername', username);
        toast.success(`Connected as @${username}`);
        return true;
      } else {
        setError(response.message);
        toast.error(response.message);
        return false;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    localStorage.removeItem('hiveUsername');
    localStorage.removeItem('hiveAccount');
    setAccount(null);
    toast.success('Disconnected from wallet');
  };

  return {
    account,
    isConnecting,
    error,
    isKeychainInstalled: keychainDetected,
    connect: handleConnect,
    disconnect
  };
}; 