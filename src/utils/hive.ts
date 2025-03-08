import { KeychainResponse, HiveAccount, TransactionResponse } from '../types/hive.types';
import { APP_NAME, client } from '../config/hive.config';

declare global {
  interface Window {
    hive_keychain: any; // You can define a more specific type if available
  }
}

// Check if Hive Keychain extension is installed
export const isKeychainInstalled = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.hive_keychain !== 'undefined' && 
         window.hive_keychain !== null;
};

// Get Hive Keychain download link
export const getKeychainDownloadLink = (): string => {
  const userAgent = navigator.userAgent;
  if (userAgent.includes("Chrome")) {
    return "https://chrome.google.com/webstore/detail/hive-keychain/jcacnejopjdphbnjgfaaobbfafkihpep";
  } else if (userAgent.includes("Firefox")) {
    return "https://addons.mozilla.org/en-US/firefox/addon/hive-keychain/";
  }
  return "https://hive-keychain.com";
};

// Connect to Hive Keychain
export const connectWithKeychain = async (username: string): Promise<{ success: boolean; message: string; account?: HiveAccount }> => {
  if (!isKeychainInstalled()) {
    return { success: false, message: "Please install Hive Keychain" };
  }

  return new Promise((resolve) => {
    window.hive_keychain.requestSignBuffer(
      username,
      `Login to ${APP_NAME} at ${new Date().toISOString()}`,
      'Posting',
      async (response: KeychainResponse) => {
        if (response.success) {
          try {
            const account = await fetchAccountInfo(username);
            localStorage.setItem('hiveUsername', username);
            resolve({ 
              success: true, 
              message: `Connected as @${username}`,
              account
            });
          } catch (error) {
            resolve({ 
              success: true, 
              message: `Connected as @${username}, but couldn't fetch details.`
            });
          }
        } else {
          resolve({ 
            success: false, 
            message: response.error || "Authentication failed"
          });
        }
      }
    );
  });
};

// Fetch account information
export const fetchAccountInfo = async (username: string): Promise<HiveAccount> => {
  try {
    const accounts = await client.database.getAccounts([username]);
    if (accounts && accounts.length > 0) {
      const account = accounts[0];
      const json_metadata = account.json_metadata ? JSON.parse(account.json_metadata) : {};
      return {
        name: account.name,
        balance: String(account.balance),
        hbd_balance: String(account.hbd_balance),
        vesting_shares: String(account.vesting_shares), 
        reputation: Number(account.reputation),
        profile_image: json_metadata.profile?.profile_image || ''
      };
    }
    throw new Error(`Account @${username} not found`);
  } catch (error) {
    console.error('Error fetching account:', error);
    throw error;
  }
};

// Send HIVE tokens
export const sendHiveTokens = async (
  from: string,
  to: string,
  amount: string,
  memo: string = ''
): Promise<TransactionResponse> => {
  if (!isKeychainInstalled()) {
    return { success: false, message: "Please install Hive Keychain" };
  }

  return new Promise((resolve) => {
    window.hive_keychain.requestTransfer(
      from,
      to,
      amount,
      memo,
      'HIVE',
      (response: KeychainResponse) => {
        if (response.success) {
          resolve({ 
            success: true, 
            message: `Sent ${amount} HIVE to @${to}`,
            txId: response.result?.id
          });
        } else {
          resolve({ 
            success: false, 
            message: response.error || "Transfer failed"
          });
        }
      }
    );
  });
};