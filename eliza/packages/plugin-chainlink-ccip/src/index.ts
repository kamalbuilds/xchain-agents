import { Plugin } from "@ai16z/eliza";
import { ccipProvider } from "./providers/ccipProvider";

export const chainlinkCcipPlugin: Plugin = {
  name: "chainlink-ccip",
  description: "Chainlink CCIP cross-chain interoperability plugin for cross-chain AI prediction market arbitrage",
  actions: [],
  providers: [ccipProvider],
  evaluators: [],
  services: [],
};

export default chainlinkCcipPlugin;

// Export the provider for direct use
export { ccipProvider } from "./providers/ccipProvider";

// Types for CCIP integration
export interface CCIPMessage {
  receiver: string;
  data: string;
  tokenAmounts: TokenAmount[];
  feeToken: string;
  extraArgs: string;
}

export interface TokenAmount {
  token: string;
  amount: bigint;
}

export interface CrossChainTransfer {
  sourceChain: number;
  destinationChain: number;
  amount: bigint;
  recipient: string;
  token?: string;
}

export interface ArbitrageOpportunity {
  marketIdBuy: string;
  marketIdSell: string;
  buyPrice: bigint;
  sellPrice: bigint;
  expectedProfit: bigint;
  buyChain: number;
  sellChain: number;
} 