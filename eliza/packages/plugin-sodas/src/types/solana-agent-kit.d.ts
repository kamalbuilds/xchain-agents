import { PublicKey } from '@solana/web3.js';

declare module 'solana-agent-kit' {
  export class SolanaAgentKit {
    constructor(privateKey: string, rpcUrl?: string, openAiKey?: string);

    wallet: {
      publicKey: PublicKey;
    };

    // Token Operations
    deploy_token(decimals: number, initialSupply?: number, name?: string, uri?: string, symbol?: string): Promise<PublicKey>;
    transfer(to: PublicKey, amount: number, mint?: PublicKey): Promise<string>;
    get_balance(tokenAddress?: PublicKey): Promise<number>;
    stakeWithJup(amount: number): Promise<string>;

    // NFT Operations
    deploy_collection(agent: SolanaAgentKit, options: {
      name: string;
      symbol: string;
      uri: string;
      royaltyBasisPoints: number;
      creators: Array<{
        address: string;
        percentage: number;
      }>;
    }): Promise<PublicKey>;

    mintCollectionNFT(collectionMint: PublicKey, metadata: {
      name: string;
      symbol: string;
      uri: string;
      sellerFeeBasisPoints: number;
    }): Promise<PublicKey>;

    // Jupiter Operations
    trade(outputMint: PublicKey, amount: number, inputMint: PublicKey, slippage: number): Promise<string>;
    fetchPrice(tokenMint: string): Promise<number>;
  }
}
