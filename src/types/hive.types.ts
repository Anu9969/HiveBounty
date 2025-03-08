// export interface BountyProgram {
//     id: string;
//     title: string;
//     description: string;
//     githubLink: string;
//     prizePool: number;    // Amount in HIVE
//     creator: string;      // Hive username
//     status: 'OPEN' | 'SOLVED' | 'CANCELLED';
//     created: string;
//     solver?: string;      // Hive username of bug solver
//     solution?: string;    // Solution description/link
//   }
  
//   export interface BountySubmission {
//     bountyId: string;
//     solver: string;
//     solutionLink: string;
//     description: string;
//     timestamp: string;
//   }

// export interface BountySubmission {
//     bountyId: string;
//     solver: string;
//     pullRequestUrl: string;  // GitHub PR URL
//     mergeCommitHash: string; // GitHub merge commit hash
//     timestamp: string;
//   }




  export interface KeychainResponse {
    success: boolean;
    error?: string;
    result?: {
      id: string;
      // Add other result properties as needed
    };
  }
  
  export interface HiveAccount {
    name: string;
    balance: string;
    hbd_balance: string;
    vesting_shares: string;
    reputation: number;
    profile_image?: string;
  }
  
  export interface TransactionResponse {
    success: boolean;
    message: string;
    txId?: string;
  }

export interface Bounty {
  id: string;
  title: string;
  description: string;
  amount: string;
  currency: 'HIVE' | 'HBD';
  creator: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  deadline?: string;
  githubLink: string;  // GitHub issue or PR URL
}

// Add Hive Keychain type to window object
declare global {
  interface Window {
    hive_keychain: any;
  }
}