import axios from 'axios';
import { ESCROW_SERVICE_URL, ESCROW_API_KEY } from '../config/hive.config';
import { TransactionResponse } from '../types/hive.types';

// Create axios instance with base configuration
const escrowClient = axios.create({
  baseURL: ESCROW_SERVICE_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': ESCROW_API_KEY || 'your-api-key'
  }
});

// Define response types
interface BalanceResponse {
  success: boolean;
  balance?: string;
  hbd_balance?: string;
  message?: string;
}

interface ReleaseResponse {
  success: boolean;
  message?: string;
  transaction_id?: string;
}

/**
 * Check the balance of the escrow account
 */
export const checkEscrowBalance = async (): Promise<BalanceResponse> => {
  try {
    const response = await escrowClient.get<BalanceResponse>('/balance');
    return response.data;
  } catch (error) {
    console.error('Error checking escrow balance:', error);
    
    // Type cast to get access to common axios error properties
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Failed to check escrow balance'
    };
  }
};

/**
 * Release funds from the escrow account to a recipient
 */
export const releaseEscrowFunds = async (
  to: string,
  amount: string,
  bountyId: string,
  requester: string,
  memo?: string
): Promise<TransactionResponse> => {
  try {
    console.log(`Requesting escrow release: ${amount} HIVE to @${to} for bounty ${bountyId}`);
    
    const response = await escrowClient.post<ReleaseResponse>('/release', {
      to,
      amount,
      bountyId,
      requester,
      memo
    });
    
    if (response.data.success) {
      return {
        success: true,
        message: response.data.message || 'Funds released successfully',
        txId: response.data.transaction_id
      };
    } else {
      return {
        success: false,
        message: response.data.message || 'Failed to release funds'
      };
    }
  } catch (error) {
    console.error('Error releasing escrow funds:', error);
    
    // Type cast to get access to common axios error properties
    const err = error as { response?: { data?: { message?: string } }; message?: string };
    
    return {
      success: false,
      message: err.response?.data?.message || err.message || 'Failed to release funds'
    };
  }
}; 