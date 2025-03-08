import { TransactionResponse } from '../types/hive.types';
import { BountyProgram, BountyClaim } from '../types/bounty.types';
import { sendHiveTokens } from '../utils/hive';
import { CONTRACT_ACCOUNT } from '../config/hive.config';
import { 
  parseGitHubUrl, 
  isIssueClosed, 
  getPullRequestDetails, 
  isPRLinkedToIssue 
} from '../utils/github';

export class BountyContract {
  private username: string;

  constructor(username: string) {
    this.username = username;
  }

  // Create new bounty
  async createBounty(bountyData: Omit<BountyProgram, 'id' | 'creator' | 'status' | 'created'>): Promise<TransactionResponse> {
    // Create bounty record
    const bounty: Omit<BountyProgram, 'id'> = {
      creator: this.username,
      status: 'OPEN',
      created: new Date().toISOString(),
      ...bountyData
    };

    // Store bounty data on chain (using custom_json)
    return new Promise((resolve, reject) => {
      if (!window.hive_keychain) {
        reject(new Error('Hive Keychain extension not found'));
        return;
      }

      // @ts-ignore
      window.hive_keychain.requestCustomJson(
        this.username,
        'dev-bounties', // Custom operation ID for our app
        'Active',
        JSON.stringify({
          type: 'bounty_create',
          data: bounty
        }),
        'Create Development Bounty',
        (response: any) => {
          if (response.success) {
            // First, transfer HIVE to contract account after successful custom_json
            sendHiveTokens(
              this.username,
              CONTRACT_ACCOUNT,
              bountyData.prizePool.toString(),
              `bounty-create-${response.result.id}`
            ).then(fundResult => {
              if (fundResult.success) {
                resolve({
                  success: true,
                  message: 'Bounty created successfully on blockchain',
                  txId: response.result.id
                });
              } else {
                resolve({
                  success: false,
                  message: 'Bounty created but funding failed: ' + fundResult.message
                });
              }
            }).catch(err => {
              resolve({
                success: false,
                message: 'Bounty created but funding failed: ' + err.message
              });
            });
          } else {
            resolve({
              success: false,
              message: response.error || 'Failed to create bounty'
            });
          }
        }
      );
    });
  }

  // Claim bounty with PR
  async claimBounty(
    bountyId: string,
    bountyData: BountyProgram,
    pullRequestUrl: string
  ): Promise<TransactionResponse> {
    try {
      // 1. Parse GitHub URLs
      const issueUrlInfo = parseGitHubUrl(bountyData.githubLink);
      const prUrlInfo = parseGitHubUrl(pullRequestUrl);
      
      if (!issueUrlInfo || !prUrlInfo) {
        return {
          success: false,
          message: 'Invalid GitHub URLs'
        };
      }
      
      // 2. Check if issue and PR are in the same repo
      if (issueUrlInfo.owner !== prUrlInfo.owner || issueUrlInfo.repo !== prUrlInfo.repo) {
        return {
          success: false,
          message: 'Pull request must be in the same repository as the issue'
        };
      }
      
      // 3. Check if issue is closed
      const isIssueResolved = await isIssueClosed(
        issueUrlInfo.owner,
        issueUrlInfo.repo,
        issueUrlInfo.number
      );
      
      if (!isIssueResolved) {
        return {
          success: false,
          message: 'The issue must be closed before claiming the bounty'
        };
      }
      
      // 4. Check if PR is merged and get PR creator
      const prDetails = await getPullRequestDetails(
        prUrlInfo.owner,
        prUrlInfo.repo,
        prUrlInfo.number
      );
      
      if (!prDetails.merged) {
        return {
          success: false,
          message: 'The pull request must be merged before claiming the bounty'
        };
      }
      
      if (!prDetails.user) {
        return {
          success: false,
          message: 'Could not verify pull request creator'
        };
      }
      
      // 5. Check if PR is linked to the issue
      const isPRLinked = await isPRLinkedToIssue(
        issueUrlInfo.owner,
        issueUrlInfo.repo,
        prUrlInfo.number,
        issueUrlInfo.number
      );
      
      if (!isPRLinked) {
        return {
          success: false,
          message: 'The pull request must reference the issue it resolves'
        };
      }
      
      // 6. Create claim data
      const claimData: BountyClaim = {
        bountyId,
        solver: this.username,
        pullRequestUrl,
        mergeCommitHash: prDetails.mergeCommitSha || '',
        timestamp: new Date().toISOString(),
        githubUsername: prDetails.user.login
      };
      
      // 7. Submit claim to blockchain
      return new Promise((resolve) => {
        // @ts-ignore
        window.hive_keychain.requestCustomJson(
          this.username,
          'dev-bounties',
          'Active',
          JSON.stringify({
            type: 'bounty_claim',
            data: claimData
          }),
          'Claim Development Bounty',
          (response: any) => {
            if (response.success) {
              resolve({
                success: true,
                message: 'Claim submitted successfully. The bounty creator will review your claim.',
                txId: response.result.id
              });
            } else {
              resolve({
                success: false,
                message: response.error || 'Failed to submit claim'
              });
            }
          }
        );
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error processing claim'
      };
    }
  }

  // Verify and pay bounty
  async verifyAndPayBounty(
    bountyId: string,
    claim: BountyClaim,
    bountyAmount: string
  ): Promise<TransactionResponse> {
    // Only bounty creator can verify and pay
    return sendHiveTokens(
      CONTRACT_ACCOUNT,
      claim.solver,
      bountyAmount,
      `bounty-paid-${bountyId}`
    );
  }

  // Auto-verify and pay bounty (for demo purposes)
  async autoVerifyAndPay(
    bountyId: string,
    bountyData: BountyProgram,
    pullRequestUrl: string
  ): Promise<TransactionResponse> {
    try {
      // First claim the bounty to verify GitHub data
      const claimResult = await this.claimBounty(bountyId, bountyData, pullRequestUrl);
      
      if (!claimResult.success) {
        return claimResult;
      }
      
      // For demo purposes, automatically pay the bounty
      return new Promise((resolve) => {
        // @ts-ignore
        window.hive_keychain.requestCustomJson(
          this.username,
          'dev-bounties',
          'Active',
          JSON.stringify({
            type: 'bounty_pay',
            data: {
              bountyId,
              solver: this.username,
              amount: bountyData.prizePool.toString(),
              timestamp: new Date().toISOString()
            }
          }),
          'Pay Development Bounty',
          (response: any) => {
            if (response.success) {
              resolve({
                success: true,
                message: 'Bounty payment successful!',
                txId: response.result.id
              });
            } else {
              resolve({
                success: false,
                message: response.error || 'Failed to process payment'
              });
            }
          }
        );
      });
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Error processing payment'
      };
    }
  }
}







//updated for escrow indtead of simpcontract transfer

// import { TransactionResponse } from '../types/hive.types';
// import { BountyProgram, BountyClaim } from '../types/bounty.types';
// import { sendHiveTokens } from '../utils/hive';
// import { CONTRACT_ACCOUNT } from '../config/hive.config';
// import { escrowUtils } from '../utils/escrow';

// export class BountyContract {
//   private username: string;

//   constructor(username: string) {
//     this.username = username;
//   }

//   // Replace your existing createBounty method with this
//   async createBountyEscrow(bountyData: {
//     title: string;
//     description: string;
//     githubLink: string;
//     prizePool: number;
//   }): Promise<TransactionResponse> {
//     try {
//       // Step 1: Lock funds in escrow
//       const escrow = await escrowUtils.lockFunds(
//         this.username,
//         bountyData.prizePool,
//         Date.now().toString()
//       );

//       // Step 2: Create bounty record
//       const bountyJson = {
//         type: 'bounty_create',
//         data: {
//           ...bountyData,
//           creator: this.username,
//           escrowTx: escrow.txId,
//           status: 'OPEN',
//           created: new Date().toISOString()
//         }
//       };

//       return new Promise((resolve) => {
//         // @ts-ignore
//         window.hive_keychain.requestCustomJson(
//           this.username,
//           CONTRACT_ACCOUNT,
//           'Active',
//           JSON.stringify(bountyJson),
//           'bounty-create',
//           async (response: any) => {
//             if (response.success) {
//               resolve({
//                 success: true,
//                 message: 'Bounty created and funds escrowed',
//                 txId: response.result.id
//               });
//             } else {
//               // Refund if bounty creation fails
//               await escrowUtils.refundFunds(escrow);
//               resolve({
//                 success: false,
//                 message: 'Failed to create bounty'
//               });
//             }
//           }
//         );
//       });
//     } catch (error) {
//       console.error('Bounty creation error:', error);
//       throw error;
//     }
//   }

//   // Add these new methods to your contract class
//   async verifyAndReleaseBounty(
//     bountyId: string,
//     claim: BountyClaim
//   ): Promise<TransactionResponse> {
//     // ... copy the verifyAndReleaseBounty method from previous message
//   }

//   async cancelBounty(bountyId: string): Promise<TransactionResponse> {
//     // ... copy the cancelBounty method from previous message
//   }

//   // Update your existing methods to work with escrow
//   async getBountyDetails(bountyId: string): Promise<BountyProgram | null> {
//     // ... copy the getBountyDetails method from previous message
//   }
// }