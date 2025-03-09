# Hive Bounty Escrow Service

This is the escrow service for the Hive Bounty platform. It handles secure fund transfers between bounty creators and solvers.

## Setup

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Create a .env file**:
   Copy the `.env.example` file to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```

3. **Configure your Hive account**:
   - Create a Hive account to use as the escrow account
   - Add the account name and active private key to your `.env` file
   - Fund the account with some HIVE for transactions

4. **Start the server**:
   ```bash
   npm start
   ```

## API Endpoints

### GET /api/balance
Check the balance of the escrow account.

**Headers**:
- `X-API-Key`: Your API key

**Response**:
```json
{
  "success": true,
  "balance": "10.000 HIVE",
  "hbd_balance": "0.000 HBD"
}
```

### POST /api/release
Release funds from the escrow account to a recipient.

**Headers**:
- `X-API-Key`: Your API key

**Body**:
```json
{
  "to": "recipient-username",
  "amount": "5.000",
  "bountyId": "bounty-123",
  "requester": "approver-username",
  "memo": "Payment for bounty-123"
}
```

**Response**:
```json
{
  "success": true,
  "transaction_id": "abcdef123456",
  "message": "Successfully sent 5.000 HIVE to @recipient-username"
}
```

## Security

- Keep your `.env` file secure and never commit it to version control
- Use a strong API key
- Consider implementing additional authentication for production use
- Regularly monitor your escrow account for unauthorized transactions 