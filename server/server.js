require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Client, PrivateKey } = require('@hiveio/dhive');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Hive client
const client = new Client(['https://api.hive.blog', 'https://api.openhive.network']);

// Escrow account details from environment variables
const ESCROW_ACCOUNT = process.env.ESCROW_ACCOUNT;
let ACTIVE_KEY = null;

// Safely try to load the private key
try {
  if (process.env.ACTIVE_KEY) {
    ACTIVE_KEY = PrivateKey.from(process.env.ACTIVE_KEY);
    console.log('✅ Private key loaded successfully');
  } else {
    console.warn('⚠️ No private key provided. Fund releasing will be disabled.');
  }
} catch (error) {
  console.error('❌ Error loading private key:', error.message);
  console.warn('⚠️ Fund releasing will be disabled due to invalid private key.');
}

// Simple API key authentication (replace with more secure method in production)
const API_KEY = process.env.API_KEY || 'your-api-key';

// Middleware to verify API key
const verifyApiKey = (req, res, next) => {
  const providedKey = req.headers['x-api-key'];
  if (providedKey && providedKey === API_KEY) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
};

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Hive Bounty Escrow Service',
    status: 'running',
    endpoints: ['/api/balance', '/api/release']
  });
});

// Endpoint to check account balance
app.get('/api/balance', verifyApiKey, async (req, res) => {
  try {
    if (!ESCROW_ACCOUNT) {
      return res.status(500).json({
        success: false,
        message: 'Escrow account not configured'
      });
    }

    const accounts = await client.database.getAccounts([ESCROW_ACCOUNT]);
    if (accounts && accounts.length > 0) {
      res.json({
        success: true,
        balance: accounts[0].balance,
        hbd_balance: accounts[0].hbd_balance
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Endpoint to release funds from escrow
app.post('/api/release', verifyApiKey, async (req, res) => {
  try {
    const { to, amount, memo, bountyId, requester } = req.body;
    
    // Validate required parameters
    if (!to || !amount || !bountyId || !requester) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }
    
    // Validate escrow configuration
    if (!ESCROW_ACCOUNT) {
      return res.status(500).json({
        success: false,
        message: 'Escrow account not properly configured'
      });
    }

    if (!ACTIVE_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Private key not configured or invalid'
      });
    }
    
    // Check if we have sufficient balance
    const accounts = await client.database.getAccounts([ESCROW_ACCOUNT]);
    if (!accounts || accounts.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Escrow account not found'
      });
    }
    
    const balance = parseFloat(accounts[0].balance);
    const requestedAmount = parseFloat(amount);
    
    if (isNaN(requestedAmount) || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }
    
    if (balance < requestedAmount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient balance in escrow account. Available: ${balance} HIVE, Requested: ${requestedAmount} HIVE`
      });
    }
    
    // Create transfer operation
    const transfer = [
      'transfer',
      {
        from: ESCROW_ACCOUNT,
        to,
        amount: `${amount} HIVE`,
        memo: memo || `Bounty payment for ${bountyId} requested by ${requester}`
      }
    ];
    
    // Broadcast to blockchain
    const result = await client.broadcast.sendOperations([transfer], ACTIVE_KEY);
    
    res.json({
      success: true,
      transaction_id: result.id,
      message: `Successfully sent ${amount} HIVE to @${to}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Escrow service running on port ${PORT}`);
  console.log(`Escrow account: ${ESCROW_ACCOUNT || 'Not configured'}`);
}); 