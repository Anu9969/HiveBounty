import { Client } from '@hiveio/dhive';

export const HIVE_NODES = [
  'https://api.hive.blog',
  'https://api.hivekings.com',
  'https://anyx.io',
  'https://api.openhive.network'
];

export const client = new Client(HIVE_NODES);

// App Constants from environment
export const APP_NAME = import.meta.env.VITE_APP_NAME;
export const APP_TAG = import.meta.env.VITE_APP_TAG;
export const CONTRACT_ACCOUNT = import.meta.env.VITE_CONTRACT_ACCOUNT;
export const CONTRACT_MEMO_PREFIX = 'bounty-';

// Escrow service configuration
export const ESCROW_SERVICE_URL = import.meta.env.VITE_ESCROW_SERVICE_URL || 'http://localhost:3000/api';
export const ESCROW_API_KEY = import.meta.env.VITE_ESCROW_API_KEY || 'your-api-key';

// Transaction Configuration
export const TRANSACTION_RETRY_ATTEMPTS = 3;
export const TRANSACTION_EXPIRY = 60000; // 60 seconds