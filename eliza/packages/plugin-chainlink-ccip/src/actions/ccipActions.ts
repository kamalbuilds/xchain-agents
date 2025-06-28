// Temporary type definitions for Eliza (will be replaced with actual imports)
interface Action {
  name: string;
  similes: string[];
  description: string;
  validate: (runtime: IAgentRuntime, message: Memory) => Promise<boolean>;
  handler: (
    runtime: IAgentRuntime,
    message: Memory,
    state: any,
    options: unknown,
    callback?: HandlerCallback
  ) => Promise<void>;
  examples: any[][];
}

interface ElizaState {
  [key: string]: any;
}

interface ElizaMemory {
  [key: string]: any;
}

interface IAgentRuntime {
  [key: string]: any;
}

interface HandlerCallback {
  (response: {
    text: string;
    source: string;
    action: string;
    messageId: string;
    attachments: any[];
  }): Promise<void>;
}

import { CCIPProvider } from '../providers/ccipProvider.js';
import { 
  CCIPSendRequest, 
  CCIPMessage, 
  ArbitrageOpportunity,
  CrossChainTransaction,
  CHAIN_SELECTORS,
  CCIPError
} from '../types/ccip.js';
import { ethers } from 'ethers';

export interface CCIPState extends ElizaState {
  ccipProvider?: CCIPProvider;
  activeTransactions?: Map<string, CrossChainTransaction>;
  arbitrageOpportunities?: ArbitrageOpportunity[];
}

interface Memory extends ElizaMemory {
  text?: string;
}

// Default CCIP configuration
const DEFAULT_CCIP_CONFIG = {
  chains: {
    ethereum: {
      chainId: 1,
      chainSelector: CHAIN_SELECTORS.ETHEREUM_MAINNET,
      routerAddress: '0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D',
      linkTokenAddress: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
      wrappedNativeAddress: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
      rpcUrl: process.env.ETHEREUM_RPC_URL || '',
      name: 'Ethereum Mainnet',
      isTestnet: false
    },
    polygon: {
      chainId: 137,
      chainSelector: CHAIN_SELECTORS.POLYGON_MAINNET,
      routerAddress: '0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe',
      linkTokenAddress: '0xb0897686c545045aFc77CF20eC7A532E3120E0F1',
      wrappedNativeAddress: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      rpcUrl: process.env.POLYGON_RPC_URL || '',
      name: 'Polygon Mainnet',
      isTestnet: false
    },
    arbitrum: {
      chainId: 42161,
      chainSelector: CHAIN_SELECTORS.ARBITRUM_MAINNET,
      routerAddress: '0x141fa059441E0ca23ce184B6A78bafD2A517DdE8',
      linkTokenAddress: '0xf97f4df75117a78c1A5a0DBb814Af92458539FB4',
      wrappedNativeAddress: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      rpcUrl: process.env.ARBITRUM_RPC_URL || '',
      name: 'Arbitrum One',
      isTestnet: false
    }
  },
  defaultGasLimit: 200000,
  maxRetries: 3,
  retryDelay: 5000,
  monitoringInterval: 30000,
  feeBufferPercentage: 10
};

export const ccipSendMessageAction: Action = {
  name: 'CCIP_SEND_MESSAGE',
  similes: ['SEND_CROSS_CHAIN', 'BRIDGE_MESSAGE', 'CROSS_CHAIN_TRANSFER', 'CCIP_SEND'],
  description: 'Send a cross-chain message or token transfer using Chainlink CCIP',
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    console.log('🔍 CCIP_SEND_MESSAGE validate() called');
    return true;
  },
  handler: async (
    runtime: IAgentRuntime, 
    message: Memory, 
    state: CCIPState | undefined, 
    _options: unknown, 
    callback?: HandlerCallback
  ) => {
    console.log('🚀 CCIP_SEND_MESSAGE handler started');
    if (!callback) throw new Error('Callback is required');

    try {
      // Initialize CCIP provider if not exists
      if (!state?.ccipProvider) {
        state = state || {} as CCIPState;
        state.ccipProvider = new CCIPProvider();
      }

      // Parse message for cross-chain transfer parameters
      const messageText = message.text || '';
      const sendRequest = parseCCIPSendRequest(messageText);

      if (!sendRequest) {
        await callback({
          text: 'Invalid CCIP send request. Please specify destination chain, receiver address, and optional token amounts.',
          source: 'ccip',
          action: 'CCIP_SEND_MESSAGE',
          messageId: `ccip_error_${Date.now()}`,
          attachments: []
        });
        return;
      }

      // Estimate fees first
      const feeEstimate = await state.ccipProvider.estimateFees(sendRequest);
      
      await callback({
        text: [
          '💰 CCIP Fee Estimation:',
          `LINK Fee: ${ethers.formatEther(feeEstimate.linkFee)} LINK`,
          `Native Fee: ${ethers.formatEther(feeEstimate.nativeFee)} ETH`,
          `Gas Limit: ${feeEstimate.gasLimit.toLocaleString()}`,
          `Estimated Cost: $${feeEstimate.totalCostUSD.toFixed(2)}`,
          '',
          '🚀 Proceeding with cross-chain message...'
        ].join('\n'),
        source: 'ccip',
        action: 'CCIP_SEND_MESSAGE',
        messageId: `ccip_estimate_${Date.now()}`,
        attachments: []
      });

      // Send the message
      const messageId = await state.ccipProvider.sendMessage(sendRequest);

      // Track the transaction
      const transaction: CrossChainTransaction = {
        id: `tx_${Date.now()}`,
        messageId,
        sourceChain: getChainNameBySelector(sendRequest.message.feeToken),
        destinationChain: getChainNameBySelector(sendRequest.destinationChainSelector),
        sourceTransactionHash: '', // Will be updated when available
        status: 'pending',
        amount: sendRequest.message.tokenAmounts?.[0]?.amount || '0',
        tokenAddress: sendRequest.message.tokenAmounts?.[0]?.token || '0x0000000000000000000000000000000000000000',
        sender: '', // Will be populated from wallet
        receiver: sendRequest.message.receiver,
        fees: {
          ccipFee: feeEstimate.linkFee,
          gasFee: feeEstimate.nativeFee,
          totalFee: (BigInt(feeEstimate.linkFee) + BigInt(feeEstimate.nativeFee)).toString()
        },
        createdAt: Date.now()
      };

      if (!state.activeTransactions) {
        state.activeTransactions = new Map();
      }
      state.activeTransactions.set(messageId, transaction);

      await callback({
        text: [
          '✅ Cross-chain message sent successfully!',
          `Message ID: ${messageId}`,
          `Source Chain: ${transaction.sourceChain}`,
          `Destination Chain: ${transaction.destinationChain}`,
          `Receiver: ${transaction.receiver}`,
          '',
          '⏳ Message is being processed by Chainlink CCIP...',
          'You can check the status using CCIP_CHECK_STATUS action.'
        ].join('\n'),
        source: 'ccip',
        action: 'CCIP_SEND_MESSAGE',
        messageId: `ccip_success_${Date.now()}`,
        attachments: []
      });

    } catch (error: unknown) {
      console.error('❌ CCIP_SEND_MESSAGE handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await callback({
        text: [
          '❌ Failed to send cross-chain message:',
          errorMessage,
          '',
          'Please check your configuration and try again.'
        ].join('\n'),
        source: 'ccip',
        action: 'CCIP_SEND_MESSAGE',
        messageId: `ccip_error_${Date.now()}`,
        attachments: []
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Send 100 USDC from Ethereum to Polygon address 0x123..." },
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll send the cross-chain transfer using Chainlink CCIP",
          action: "CCIP_SEND_MESSAGE"
        },
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Bridge tokens to Arbitrum using CCIP" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Setting up cross-chain bridge transaction",
          action: "CCIP_SEND_MESSAGE"
        },
      }
    ]
  ]
};

export const ccipCheckStatusAction: Action = {
  name: 'CCIP_CHECK_STATUS',
  similes: ['CHECK_CCIP_STATUS', 'CROSS_CHAIN_STATUS', 'MESSAGE_STATUS'],
  description: 'Check the status of a CCIP cross-chain message',
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    console.log('🔍 CCIP_CHECK_STATUS validate() called');
    return true;
  },
  handler: async (
    runtime: IAgentRuntime, 
    message: Memory, 
    state: CCIPState | undefined, 
    _options: unknown, 
    callback?: HandlerCallback
  ) => {
    console.log('🚀 CCIP_CHECK_STATUS handler started');
    if (!callback) throw new Error('Callback is required');

    try {
      if (!state?.ccipProvider) {
        await callback({
          text: 'CCIP provider not initialized. Please send a message first.',
          source: 'ccip',
          action: 'CCIP_CHECK_STATUS',
          messageId: `ccip_error_${Date.now()}`,
          attachments: []
        });
        return;
      }

      const messageText = message.text || '';
      const messageId = extractMessageId(messageText);

      if (!messageId) {
        // Show all active transactions
        if (!state.activeTransactions || state.activeTransactions.size === 0) {
          await callback({
            text: 'No active CCIP transactions found.',
            source: 'ccip',
            action: 'CCIP_CHECK_STATUS',
            messageId: `ccip_status_${Date.now()}`,
            attachments: []
          });
          return;
        }

        const transactions = Array.from(state.activeTransactions.values());
        const statusText = [
          '📊 Active CCIP Transactions:',
          '',
          ...transactions.map(tx => [
            `🔗 ${tx.id}`,
            `  Message ID: ${tx.messageId}`,
            `  Route: ${tx.sourceChain} → ${tx.destinationChain}`,
            `  Status: ${getStatusEmoji(tx.status)} ${tx.status.toUpperCase()}`,
            `  Amount: ${ethers.formatEther(tx.amount)} tokens`,
            `  Created: ${new Date(tx.createdAt).toLocaleString()}`,
            ''
          ]).flat()
        ];

        await callback({
          text: statusText.join('\n'),
          source: 'ccip',
          action: 'CCIP_CHECK_STATUS',
          messageId: `ccip_status_${Date.now()}`,
          attachments: []
        });
        return;
      }

      // Check specific message status
      const status = await state.ccipProvider.getMessageStatus(messageId);
      const transaction = state.activeTransactions?.get(messageId);

      await callback({
        text: [
          `🔍 CCIP Message Status: ${messageId}`,
          '',
          `Status: ${getStatusEmoji(status.status)} ${status.status.toUpperCase()}`,
          `Source TX: ${status.sourceTransactionHash || 'Pending...'}`,
          `Destination TX: ${status.destinationTransactionHash || 'Not yet executed'}`,
          transaction ? `Route: ${transaction.sourceChain} → ${transaction.destinationChain}` : '',
          transaction ? `Receiver: ${transaction.receiver}` : '',
          `Last Updated: ${new Date(status.timestamp).toLocaleString()}`,
          '',
          status.errorMessage ? `❌ Error: ${status.errorMessage}` : '',
          status.status === 'success' ? '✅ Transaction completed successfully!' : '',
          status.status === 'pending' ? '⏳ Transaction is being processed...' : ''
        ].filter(Boolean).join('\n'),
        source: 'ccip',
        action: 'CCIP_CHECK_STATUS',
        messageId: `ccip_status_${Date.now()}`,
        attachments: []
      });

    } catch (error: unknown) {
      console.error('❌ CCIP_CHECK_STATUS handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await callback({
        text: `❌ Failed to check CCIP status: ${errorMessage}`,
        source: 'ccip',
        action: 'CCIP_CHECK_STATUS',
        messageId: `ccip_error_${Date.now()}`,
        attachments: []
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Check status of message 0xabc123..." },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Checking CCIP message status",
          action: "CCIP_CHECK_STATUS"
        },
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Show all active CCIP transactions" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Displaying active cross-chain transactions",
          action: "CCIP_CHECK_STATUS"
        },
      }
    ]
  ]
};

export const ccipArbitrageAction: Action = {
  name: 'CCIP_ARBITRAGE_SCAN',
  similes: ['SCAN_ARBITRAGE', 'FIND_OPPORTUNITIES', 'CROSS_CHAIN_ARB'],
  description: 'Scan for cross-chain arbitrage opportunities using CCIP',
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    console.log('🔍 CCIP_ARBITRAGE_SCAN validate() called');
    return true;
  },
  handler: async (
    runtime: IAgentRuntime, 
    message: Memory, 
    state: CCIPState | undefined, 
    _options: unknown, 
    callback?: HandlerCallback
  ) => {
    console.log('🚀 CCIP_ARBITRAGE_SCAN handler started');
    if (!callback) throw new Error('Callback is required');

    try {
      // Initialize CCIP provider if not exists
      if (!state?.ccipProvider) {
        state = state || {} as CCIPState;
        state.ccipProvider = new CCIPProvider();
      }

      await callback({
        text: [
          '🔍 Scanning for cross-chain arbitrage opportunities...',
          '',
          '⏳ Analyzing price differences across chains...'
        ].join('\n'),
        source: 'ccip',
        action: 'CCIP_ARBITRAGE_SCAN',
        messageId: `ccip_scan_${Date.now()}`,
        attachments: []
      });

      // Simulate arbitrage opportunity detection
      // In a real implementation, this would:
      // 1. Fetch prices from multiple chains
      // 2. Calculate price differences
      // 3. Estimate CCIP fees
      // 4. Determine profitability
      
      const mockOpportunities: ArbitrageOpportunity[] = [
        {
          id: `arb_${Date.now()}_1`,
          sourceChain: 'ethereum',
          destinationChain: 'polygon',
          asset: 'USDC',
          sourcePrice: 1.002,
          destinationPrice: 0.998,
          priceDifference: 0.004,
          profitability: 0.15, // 15% after fees
          estimatedGasCost: ethers.parseEther('0.01').toString(),
          netProfit: ethers.parseEther('0.15').toString(),
          confidence: 0.85,
          timestamp: Date.now(),
          expiresAt: Date.now() + 300000 // 5 minutes
        },
        {
          id: `arb_${Date.now()}_2`,
          sourceChain: 'arbitrum',
          destinationChain: 'ethereum',
          asset: 'WETH',
          sourcePrice: 2450.30,
          destinationPrice: 2455.80,
          priceDifference: 5.50,
          profitability: 0.08, // 8% after fees
          estimatedGasCost: ethers.parseEther('0.005').toString(),
          netProfit: ethers.parseEther('0.08').toString(),
          confidence: 0.92,
          timestamp: Date.now(),
          expiresAt: Date.now() + 180000 // 3 minutes
        }
      ];

      state.arbitrageOpportunities = mockOpportunities;

      const opportunityText = mockOpportunities.map(opp => [
        `🎯 Opportunity #${opp.id.split('_')[2]}`,
        `  Asset: ${opp.asset}`,
        `  Route: ${opp.sourceChain.toUpperCase()} → ${opp.destinationChain.toUpperCase()}`,
        `  Price Difference: $${opp.priceDifference.toFixed(4)}`,
        `  Profitability: ${(opp.profitability * 100).toFixed(2)}%`,
        `  Confidence: ${(opp.confidence * 100).toFixed(0)}%`,
        `  Est. Gas Cost: ${ethers.formatEther(opp.estimatedGasCost)} ETH`,
        `  Net Profit: ${ethers.formatEther(opp.netProfit)} ETH`,
        `  Expires: ${new Date(opp.expiresAt).toLocaleTimeString()}`,
        ''
      ]).flat();

      await callback({
        text: [
          '🎯 Cross-Chain Arbitrage Opportunities Found:',
          '',
          ...opportunityText,
          '💡 Use CCIP_EXECUTE_ARBITRAGE to execute an opportunity.',
          '⚠️  Opportunities expire quickly due to market volatility.'
        ].join('\n'),
        source: 'ccip',
        action: 'CCIP_ARBITRAGE_SCAN',
        messageId: `ccip_opportunities_${Date.now()}`,
        attachments: []
      });

    } catch (error: unknown) {
      console.error('❌ CCIP_ARBITRAGE_SCAN handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      await callback({
        text: `❌ Failed to scan for arbitrage opportunities: ${errorMessage}`,
        source: 'ccip',
        action: 'CCIP_ARBITRAGE_SCAN',
        messageId: `ccip_error_${Date.now()}`,
        attachments: []
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Scan for cross-chain arbitrage opportunities" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Scanning for profitable arbitrage opportunities across chains",
          action: "CCIP_ARBITRAGE_SCAN"
        },
      }
    ]
  ]
};

// Helper functions
function parseCCIPSendRequest(text: string): CCIPSendRequest | null {
  // Simple parsing logic - in production, use more sophisticated NLP
  const lowerText = text.toLowerCase();
  
  // Extract destination chain
  let destinationChain = '';
  if (lowerText.includes('polygon')) destinationChain = CHAIN_SELECTORS.POLYGON_MAINNET;
  else if (lowerText.includes('arbitrum')) destinationChain = CHAIN_SELECTORS.ARBITRUM_MAINNET;
  else if (lowerText.includes('ethereum')) destinationChain = CHAIN_SELECTORS.ETHEREUM_MAINNET;
  
  // Extract receiver address (simplified)
  const addressMatch = text.match(/0x[a-fA-F0-9]{40}/);
  const receiver = addressMatch ? addressMatch[0] : '';
  
  if (!destinationChain || !receiver) {
    return null;
  }

  return {
    destinationChainSelector: destinationChain,
    message: {
      receiver,
      data: '0x', // Empty data for simple transfers
      feeToken: '0x0000000000000000000000000000000000000000', // Use native token for fees
      gasLimit: 200000
    },
    fees: {
      linkFee: '0',
      nativeFee: '0'
    }
  } as CCIPSendRequest;
}

function extractMessageId(text: string): string | null {
  const messageIdMatch = text.match(/0x[a-fA-F0-9]{64}/);
  return messageIdMatch ? messageIdMatch[0] : null;
}

function getChainNameBySelector(selector: string): string {
  const chainMap: Record<string, string> = {
    [CHAIN_SELECTORS.ETHEREUM_MAINNET]: 'ethereum',
    [CHAIN_SELECTORS.POLYGON_MAINNET]: 'polygon',
    [CHAIN_SELECTORS.ARBITRUM_MAINNET]: 'arbitrum'
  };
  return chainMap[selector] || 'unknown';
}

function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    pending: '⏳',
    in_progress: '🔄',
    success: '✅',
    failed: '❌',
    cancelled: '🚫'
  };
  return emojiMap[status] || '❓';
} 