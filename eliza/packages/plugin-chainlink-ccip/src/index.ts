import { Plugin } from '@ai16z/eliza';
import { ChainlinkCCIPProvider } from './providers/ccipProvider.js';
import { 
  ccipSendMessageAction,
  ccipCheckStatusAction,
  ccipArbitrageAction
} from './actions/ccipActions.js';

export const chainlinkCCIPPlugin: Plugin = {
  name: 'chainlink-ccip',
  description: 'Chainlink CCIP (Cross-Chain Interoperability Protocol) integration for cross-chain messaging and arbitrage',
  actions: [
    ccipSendMessageAction,
    ccipCheckStatusAction,
    ccipArbitrageAction
  ],
  evaluators: [],
  providers: [],
  services: []
};

// Export types and utilities
export * from './types/ccip.js';
export * from './providers/ccipProvider.js';
export * from './actions/ccipActions.js';

export default chainlinkCCIPPlugin; 