export interface BountyProgram {
    id: string;
    title: string;
    description: string;
    githubLink: string;
    prizePool: number;
    creator: string;
    status: 'OPEN' | 'CLAIMED' | 'VERIFIED' | 'PAID';
    created: string;
    solver?: string;
    pullRequestUrl?: string;
    mergeCommitHash?: string;
  }
  
  export interface BountyClaim {
    bountyId: string;
    solver: string;
    pullRequestUrl: string;
    mergeCommitHash: string;
    timestamp: string;
    githubUsername: string; // GitHub username of the PR creator
  }



//if using escrow

// Add these new interfaces to your existing types file
// export interface BountyEscrow {
//   txId: string;
//   amount: number;
//   creator: string;
//   status: 'LOCKED' | 'RELEASED' | 'REFUNDED';
//   createdAt: string;
//   releasedAt?: string;
//   releasedTo?: string;
// }

// // Update your existing BountyProgram interface
// export interface BountyProgram {
//   id: string;
//   title: string;
//   description: string;
//   githubLink: string;
//   prizePool: number;
//   creator: string;
//   status: 'OPEN' | 'CLAIMED' | 'VERIFIED' | 'PAID';
//   created: string;
//   solver?: string;
//   pullRequestUrl?: string;
//   mergeCommitHash?: string;
//   // Add these new fields
//   escrowTx: string;
//   escrowStatus: BountyEscrow['status'];
// }

// export interface BountyClaim {
//   bountyId: string;
//   solver: string;
//   pullRequestUrl: string;
//   mergeCommitHash: string;
//   timestamp: string;
//   amount: number;  // Add this field
// }