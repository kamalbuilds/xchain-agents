import type { Action } from '@ai16z/eliza';
import { PublicKey } from '@solana/web3.js';
import { getAgent } from '../providers/solanaAgentKit';

export interface SolanaOperationsAction extends Action {
  deployToken: (params: TokenDeployParams) => Promise<string>;
  transferAssets: (params: TransferParams) => Promise<string>;
  checkBalance: (params: BalanceParams) => Promise<number>;
  stakeSOL: (amount: number) => Promise<string>;
}

interface TokenDeployParams {
  decimals: number;
  initialSupply?: number;
  name?: string;
  uri?: string;
  symbol?: string;
}

interface TransferParams {
  to: string;
  amount: number;
  mint?: string;
}

interface BalanceParams {
  tokenAddress?: string;
  walletAddress?: string;
}

export const deployToken = async (params: TokenDeployParams): Promise<string> => {
  const agent = getAgent();
  const result = await agent.deploy_token(
    params.decimals,
    params.initialSupply,
    params.name,
    params.uri,
    params.symbol
  );
  return result.toString();
};

export const transferAssets = async (params: TransferParams): Promise<string> => {
  const agent = getAgent();
  const signature = await agent.transfer(
    new PublicKey(params.to),
    params.amount,
    params.mint ? new PublicKey(params.mint) : undefined
  );
  return signature;
};

export const checkBalance = async (params: BalanceParams): Promise<number> => {
  const agent = getAgent();
  const balance = await agent.get_balance(
    params.tokenAddress ? new PublicKey(params.tokenAddress) : undefined
  );
  return balance;
};

export const stakeSOL = async (amount: number): Promise<string> => {
  const agent = getAgent();
  const signature = await agent.stakeWithJup(amount);
  return signature;
};
