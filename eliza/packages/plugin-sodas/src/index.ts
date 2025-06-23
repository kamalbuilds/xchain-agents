import type { Plugin, Action, State as ElizaState, Memory as ElizaMemory, IAgentRuntime, HandlerCallback } from '@ai16z/eliza';
import { defiLlamaProvider, formatTVL, formatPercentage } from './providers/defillama';
import { coinGeckoProvider, formatCurrency, formatPriceChange } from './providers/coingecko';
import { solanaProvider } from './providers/solana';

export interface State extends ElizaState {
  lastMessageId?: string;
}

interface Memory extends ElizaMemory {
  text?: string;
}

const tvlAction: Action = {
  name: 'TVL',
  similes: ['TVL', 'DEFI', 'METRICS', 'ANALYSIS'],
  description: 'Get detailed TVL metrics for Solana and global DeFi',
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    console.log('🔍 TVL validate() called');
    return true;
  },
  handler: async (_runtime: IAgentRuntime, _message: Memory, _state: State | undefined, _options: unknown, callback?: HandlerCallback) => {
    console.log('🚀 TVL handler started');
    if (!callback) throw new Error('Callback is required');

    try {
      console.log('📊 Fetching TVL data...');
      const tvlData = await defiLlamaProvider.getTVL();
      console.log('📈 TVL data retrieved:', tvlData);

      // Send global DeFi TVL metrics
      await callback({
        text: [
          'Global DeFi TVL Analysis:',
          `Total DeFi TVL: ${formatTVL(tvlData.globalMetrics.totalTvl)}`,
          '',
          'Top 5 Chains by TVL:',
          tvlData.globalMetrics.topChains
            .map((chain, i) =>
              `${i + 1}. ${chain.name}: ${formatTVL(chain.tvl)} (${formatPercentage(chain.percentage)})`
            )
            .join('\n')
        ].join('\n'),
        source: 'sodas',
        action: 'TVL',
        messageId: `tvl_global_${Date.now()}`,
        attachments: []
      });

      // Send Solana-specific metrics
      await callback({
        text: [
          'Solana Ecosystem Metrics:',
          `Total TVL: ${formatTVL(tvlData.tvl)}`,
          `Market Share: ${formatPercentage(tvlData.globalMetrics.solanaPercentage)}`,
          '',
          'Top 3 Solana Protocols:',
          tvlData.protocols
            .map((p, i) => `${i + 1}. ${p.name}: ${formatTVL(p.tvl)}`)
            .join('\n')
        ].join('\n'),
        source: 'sodas',
        action: 'TVL',
        messageId: `tvl_solana_${Date.now()}`,
        attachments: []
      });

      console.log('✅ TVL handler completed successfully');

    } catch (error: unknown) {
      console.error('❌ TVL handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await callback({
        text: `Error in TVL action: ${errorMessage}`,
        source: 'sodas',
        action: 'TVL',
        messageId: `tvl_error_${Date.now()}`,
        attachments: []
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "What's the current TVL in DeFi?" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll check the TVL metrics for you",
          action: "TVL"
        },
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Show me Solana's TVL stats" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Here are the TVL statistics",
          action: "TVL"
        },
      }
    ]
  ]
};

const sodasTestAction: Action = {
  name: 'SODAS-TEST',
  similes: ['SODAS', 'DEFI', 'SOLANA', 'TRADE'],
  description: 'Test action for interacting with Solana DeFi',
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    console.log('🔍 SODAS-TEST validate() called');
    return true;
  },
  handler: async (runtime: IAgentRuntime, _message: Memory, _state: State | undefined, _options: unknown, callback?: HandlerCallback) => {
    console.log('🚀 SODAS-TEST handler started');
    if (!callback) throw new Error('Callback is required');

    try {
      console.log('📊 Fetching Solana TVL data...');
      const tvlData = await defiLlamaProvider.getTVL();
      console.log('📈 TVL data retrieved:', tvlData);

      // Send global DeFi TVL metrics
      await callback({
        text: [
          'Global DeFi TVL Analysis:',
          `Total DeFi TVL: ${formatTVL(tvlData.globalMetrics.totalTvl)}`,
          '',
          'Top 5 Chains by TVL:',
          tvlData.globalMetrics.topChains
            .map((chain, i) =>
              `${i + 1}. ${chain.name}: ${formatTVL(chain.tvl)} (${formatPercentage(chain.percentage)})`
            )
            .join('\n')
        ].join('\n'),
        source: 'sodas',
        action: 'SODAS-TEST',
        messageId: `sodas_global_${Date.now()}`,
        attachments: []
      });

      // Send Solana-specific metrics
      await callback({
        text: [
          'Solana Ecosystem Metrics:',
          `Total TVL: ${formatTVL(tvlData.tvl)}`,
          `Market Share: ${formatPercentage(tvlData.globalMetrics.solanaPercentage)}`,
          '',
          'Top 3 Solana Protocols:',
          tvlData.protocols
            .map((p, i) => `${i + 1}. ${p.name}: ${formatTVL(p.tvl)}`)
            .join('\n')
        ].join('\n'),
        source: 'sodas',
        action: 'SODAS-TEST',
        messageId: `sodas_solana_${Date.now()}`,
        attachments: []
      });

      console.log('✅ SODAS-TEST handler completed successfully');

    } catch (error: unknown) {
      console.error('❌ SODAS-TEST handler error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      await callback({
        text: `Error in SODAS-TEST action: ${errorMessage}`,
        source: 'sodas',
        action: 'SODAS-TEST',
        messageId: `sodas_error_${Date.now()}`,
        attachments: []
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Can you test the SODAS action?" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll test the SODAS action for you",
          action: "SODAS-TEST"
        },
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "Try the SODAS-TEST action" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Running the SODAS test now",
          action: "SODAS-TEST"
        },
      }
    ]
  ]
};

export const priceAction: Action = {
  name: 'PRICE',
  similes: ['show me crypto prices', 'what is the price of', 'check token prices'],
  description: 'Get current price and market data for popular cryptocurrencies',
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    console.log('🔍 PRICE validate() called');
    return true;
  },
  handler: async (_runtime: IAgentRuntime, _message: Memory, _state: State | undefined, _options: unknown, callback?: HandlerCallback) => {
    console.log('🚀 PRICE handler started');
    if (!callback) throw new Error('Callback is required');

    try {
      console.log('📊 Fetching market data for popular tokens...');
      const marketData = await coinGeckoProvider.getMarketData(10);

      // Format the response
      const priceList = marketData
        .map(token =>
          `${token.name} (${token.symbol.toUpperCase()}): ${formatCurrency(token.current_price)} (${formatPriceChange(token.price_change_percentage_24h)})`
        )
        .join('\n');

      const response = `Here are the current prices for popular cryptocurrencies:\n\n${priceList}\n\nPrices are updated every 30 seconds. Let me know if you need more specific market data!`;

      await callback({
        text: response,
        source: 'sodas',
        action: 'PRICE',
        messageId: `price_${Date.now()}`,
        attachments: []
      });

      console.log('✅ PRICE handler completed successfully');

    } catch (error) {
      console.error('Error fetching prices:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await callback({
        text: `Error fetching prices: ${errorMessage}`,
        source: 'sodas',
        action: 'PRICE',
        messageId: `price_error_${Date.now()}`,
        attachments: []
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Show me crypto prices" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll show you the current prices of popular cryptocurrencies",
          action: "PRICE"
        },
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What's the current market prices?" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll fetch the latest cryptocurrency prices for you",
          action: "PRICE"
        },
      }
    ]
  ]
};

export const portfolioAction: Action = {
  name: 'PORTFOLIO',
  similes: ['check my portfolio', 'show my balance', 'check wallet', 'token balances'],
  description: 'Get your Solana wallet portfolio value and token balances',
  validate: async (_runtime: IAgentRuntime, _message: Memory) => {
    console.log('🔍 PORTFOLIO validate() called');
    return true;
  },
  handler: async (_runtime: IAgentRuntime, _message: Memory, _state: State | undefined, _options: unknown, callback?: HandlerCallback) => {
    console.log('🚀 PORTFOLIO handler started');
    if (!callback) throw new Error('Callback is required');

    try {
      console.log('📊 Fetching portfolio data...');
      const portfolio = await solanaProvider.getPortfolio('', (key: string) => _runtime.getSetting(key));

      // Calculate SOL value
      const solUsdValue = portfolio.tokens.reduce((acc, token) => acc + (token.usdValue || 0), 0);
      const solValue = portfolio.totalValueUSD - solUsdValue;

      // Format the response in a single line with clear separators
      const balanceText = `Your Portfolio Balance: SOL Balance: ${portfolio.solBalance.toFixed(4)} SOL (${formatCurrency(solValue)}) Token Balances: ${
        portfolio.tokens.length > 0
          ? portfolio.tokens
              .map(token => `${token.symbol}: ${token.balance.toFixed(4)} (${formatCurrency(token.usdValue || 0)})`)
              .join(', ')
          : 'No additional tokens'
      } Total Portfolio Value: ${formatCurrency(portfolio.totalValueUSD)}`;

      await callback({
        text: balanceText,
        source: 'sodas',
        action: 'PORTFOLIO',
        messageId: `portfolio_${Date.now()}`,
        attachments: []
      });

      console.log('✅ PORTFOLIO handler completed successfully');

    } catch (error) {
      console.error('Error checking portfolio:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await callback({
        text: `Error checking portfolio: ${errorMessage}`,
        source: 'sodas',
        action: 'PORTFOLIO',
        messageId: `portfolio_error_${Date.now()}`,
        attachments: []
      });
    }
  },
  examples: [
    [
      {
        user: "{{user1}}",
        content: { text: "Check my portfolio balance" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "I'll check your wallet balance",
          action: "PORTFOLIO"
        },
      }
    ],
    [
      {
        user: "{{user1}}",
        content: { text: "What's in my wallet?" },
      },
      {
        user: "{{user2}}",
        content: {
          text: "Let me fetch your portfolio details",
          action: "PORTFOLIO"
        },
      }
    ]
  ]
};

export const sodasPlugin: Plugin = {
  name: 'sodas',
  description: 'A plugin for testing Solana DeFi interactions',
  actions: [sodasTestAction, tvlAction, priceAction, portfolioAction]
};

export default sodasPlugin;

