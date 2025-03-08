import { useState, useEffect } from 'react';
import { 
  connectWithKeychain,
  isKeychainInstalled,
  getKeychainDownloadLink,
  fetchAccountInfo
} from '../utils/hive';
import type { HiveAccount } from '../types/hive.types';

export const useHiveWallet = () => {
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [accountInfo, setAccountInfo] = useState<HiveAccount | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if previously connected
    const storedUsername = localStorage.getItem('hiveUsername');
    if (storedUsername) {
      setUsername(storedUsername);
      setConnected(true);
      fetchAccountInfo(storedUsername)
        .then(setAccountInfo)
        .catch(console.error);
    }
  }, []);

  const handleConnect = async (inputUsername: string) => {
    setIsLoading(true);
    try {
      const result = await connectWithKeychain(inputUsername);
      if (result.success) {
        setUsername(inputUsername);
        setConnected(true);
        if (result.account) {
          setAccountInfo(result.account);
        }
        return { success: true };
      }
      return { success: false, error: result.message };
    } catch (error) {
      console.error('Connection error:', error);
      return { success: false, error: 'Connection failed' };
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('hiveUsername');
    setUsername('');
    setConnected(false);
    setAccountInfo(null);
  };

  return {
    connected,
    username,
    accountInfo,
    isLoading,
    handleConnect,
    handleDisconnect,
    isKeychainInstalled: isKeychainInstalled(),
    keychainDownloadLink: getKeychainDownloadLink()
  };
};