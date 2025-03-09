import { TransactionResponse, KeychainResponse } from '../types/hive.types';
import { BountyProgram, BountyClaim } from '../types/bounty.types';
import { sendHiveTokens } from '../utils/hive';
import { CONTRACT_ACCOUNT } from '../config/hive.config';
import { 
  parseGitHubUrl, 
  isIssueClosed, 
  getPullRequestDetails, 
  isPRLinkedToIssue 
} from '../utils/github';
import { client } from '../config/hive.config';
import { releaseEscrowFunds } from '../services/escrow.service';

export class BountyContract {
  private username: string;

  constructor(username: string) {
    this.username = username;
  }

  // Create new bounty
  async createBounty(bountyData: Omit<BountyProgram, 'id' | 'creator' | 'status' | 'created'>): Promise<TransactionResponse> {
    try {
      // Validate contract account exists
      const contractAccounts = await client.database.getAccounts([CONTRACT_ACCOUNT]);
      if (!contractAccounts || contractAccounts.length === 0) {
        return {
          success: false,
          message: `Contract account ${CONTRACT_ACCOUNT} does not exist`
        };
      }

      // Create bounty record
      const bounty: Omit<BountyProgram, 'id'> = {
        creator: this.username,
        status: 'OPEN',
        created: new Date().toISOString(),
        ...bountyData
      };

      // Validate user has sufficient balance
      const accounts = await client.database.getAccounts([this.username]);
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          message: 'Could not fetch account information'
        };
      }

      const account = accounts[0];
      const userBalance = parseFloat(String(account.balance));
      const bountyAmount = parseFloat(bountyData.prizePool.toString());

      if (userBalance < bountyAmount) {
        return {
          success: false,
          message: `Insufficient balance. You have ${userBalance} HIVE but the bounty requires ${bountyAmount} HIVE`
        };
      }

      return new Promise((resolve) => {
        if (!window.hive_keychain) {
          resolve({
            success: false,
            message: 'Hive Keychain extension not found'
          });
          return;
        }

        // First create the bounty record
        window.hive_keychain.requestCustomJson(
          this.username,
          'dev-bounties',
          'Active', // Using Active authority for both operations
          JSON.stringify({
            type: 'bounty_create',
            data: bounty
          }),
          'Create Development Bounty',
          async (response: KeychainResponse) => {
            if (response.success) {
              try {
                // Then transfer the funds
                const transferResult = await sendHiveTokens(
                  this.username,
                  CONTRACT_ACCOUNT,
                  bountyData.prizePool.toString(),
                  `bounty-create-${response.result?.id ?? 'unknown'}`
                );

                if (transferResult.success) {
                  resolve({
                    success: true,
                    message: 'Bounty created and funded successfully',
                    txId: response.result?.id ?? 'unknown'
                  });
                } else {
                  // If transfer fails, we should notify but not treat it as a complete failure
                  resolve({
                    success: false,
                    message: `Bounty created but funding failed: ${transferResult.message}. Please try funding manually.`,
                    txId: response.result?.id ?? 'unknown'
                  });
                }
              } catch (error: any) {
                resolve({
                  success: false,
                  message: `Bounty created but funding failed: ${error.message}. Please try funding manually.`,
                  txId: response.result?.id ?? 'unknown'
                });
              }
            } else {
              resolve({
                success: false,
                message: response.error || 'Failed to create bounty'
              });
            }
          }
        );
      });
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to create bounty: ${error.message}`
      };
    }
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
                txId: response.result?.id ?? 'unknown'
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
    try {
      // First record approval on blockchain
      const approvalResult = await new Promise<TransactionResponse>((resolve) => {
        window.hive_keychain.requestCustomJson(
          this.username,
          'dev-bounties',
          'Active',
          JSON.stringify({
            type: 'bounty_approve',
            data: {
              bountyId,
              approver: this.username,
              solver: claim.solver,
              amount: bountyAmount,
              timestamp: new Date().toISOString()
            }
          }),
          'Approve Bounty Solution',
          (response: KeychainResponse) => {
            if (response.success) {
              resolve({
                success: true,
                message: 'Solution approval recorded on blockchain',
                txId: response.result?.id ?? 'unknown'
              });
            } else {
              resolve({
                success: false,
                message: response.error || 'Failed to record approval'
              });
            }
          }
        );
      });

      if (!approvalResult.success) {
        return approvalResult;
      }

      // Then release funds from escrow service
      return releaseEscrowFunds(
        claim.solver,
        bountyAmount,
        bountyId,
        this.username,
        `Bounty payment for ${bountyId}`
      );
    } catch (error: any) {
      return {
        success: false,
        message: `Error processing payment: ${error.message}`
      };
    }
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
                txId: response.result?.id ?? 'unknown'
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