import type { Action } from '@ai16z/eliza';
import { PublicKey } from '@solana/web3.js';
import { getAgent } from '../providers/solanaAgentKit';

export interface JupiterOperationsAction extends Action {
  swapTokens: (params: SwapParams) => Promise<string>;
  getQuote: (params: QuoteParams) => Promise<QuoteResult>;
  findBestRoute: (params: RouteParams) => Promise<RouteInfo>;
}

interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage: number;
}

interface QuoteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
}

interface QuoteResult {
  inAmount: number;
  outAmount: number;
  priceImpactPct: number;
}

interface RouteParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippage: number;
}

interface RouteInfo {
  outAmount: number;
  priceImpactPct: number;
}

export const swapWithJupiter = async (params: SwapParams): Promise<string> => {
  const agent = getAgent();
  const signature = await agent.trade(
    new PublicKey(params.outputMint),
    params.amount,
    new PublicKey(params.inputMint),
    params.slippage
  );
  return signature;
};

export const getJupiterQuote = async (params: QuoteParams): Promise<QuoteResult> => {
  const agent = getAgent();
  const price = await agent.fetchPrice(params.inputMint);
  return {
    inAmount: params.amount,
    outAmount: params.amount * price,
    priceImpactPct: 0 // This is a simplified implementation
  };
};

export const findOptimalRoute = async (params: RouteParams): Promise<RouteInfo> => {
  const agent = getAgent();
  const price = await agent.fetchPrice(params.inputMint);
  return {
    outAmount: params.amount * price,
    priceImpactPct: 0 // This is a simplified implementation
  };
};
