import {
  Action,
  IAgentRuntime,
  Memory,
  State,
  HandlerCallback,
  ActionExample,
  composeContext,
  generateObjectV2,
  ModelClass
} from '@ai16z/eliza';
import { ChainlinkDataStreamsProvider } from '../providers/dataStreamsProvider.js';
import { 
  DataStreamsConfig, 
  CryptoReport, 
  MarketDataPoint, 
  StreamMetrics, 
  SystemMetrics,
  DataStreamsError 
} from '../types/dataStreams.js';
import { z } from 'zod';

// Validation schemas
const GetLatestReportSchema = z.object({
  streamId: z.string().describe('The stream ID to fetch the latest report for'),
  symbol: z.string().optional().describe('Optional symbol name for logging')
});

const GetMarketDataSchema = z.object({
  symbol: z.string().describe('The cryptocurrency symbol (e.g., BTC, ETH)')
});

const SubscribeToStreamSchema = z.object({
  streamId: z.string().describe('The stream ID to subscribe to'),
  symbol: z.string().optional().describe('Optional symbol name for identification')
});

const GetStreamMetricsSchema = z.object({
  streamId: z.string().describe('The stream ID to get metrics for')
});

// Action to get the latest report from a Data Stream
export const getLatestReportAction: Action = {
  name: 'GET_LATEST_REPORT',
  similes: [
    'GET_PRICE_DATA',
    'FETCH_LATEST_REPORT',
    'GET_STREAM_DATA',
    'FETCH_MARKET_DATA'
  ],
  description: 'Fetches the latest report from a Chainlink Data Stream for a specific stream ID',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      const content = message.content?.text || '';
      return content.includes('latest report') || 
             content.includes('price data') || 
             content.includes('stream data') ||
             content.includes('market data');
    } catch (error) {
      return false;
    }
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      // Find the data streams provider from the array
      const provider = runtime.providers.find(p => p.constructor.name === 'ChainlinkDataStreamsProvider') as unknown as ChainlinkDataStreamsProvider;
      if (!provider) {
        throw new DataStreamsError('Data Streams provider not initialized', 'PROVIDER_NOT_FOUND');
      }

      const context = composeContext({
        state,
        template: `Extract the stream ID from the user's request.
        
        User request: {{message}}
        
        Respond with JSON containing the streamId.`,
      });

      const response = await generateObjectV2({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
        schema: GetLatestReportSchema,
      });

      const streamId = (response.object as z.infer<typeof GetLatestReportSchema>)?.streamId || 'default';
      const symbol = (response.object as z.infer<typeof GetLatestReportSchema>)?.symbol;
      
      console.log(`Fetching latest report for stream ${streamId}`, { symbol });
      
      const report: CryptoReport = await provider.getLatestReport(streamId);
      
      const responseText = `📊 **Latest Data Stream Report**

**Stream ID:** ${streamId}
**Symbol:** ${symbol || 'N/A'}
**Feed ID:** ${report.feedId}
**Benchmark Price:** $${parseFloat(report.reportBlob.benchmarkPrice).toLocaleString()}
**Bid Price:** $${parseFloat(report.reportBlob.bid).toLocaleString()}
**Ask Price:** $${parseFloat(report.reportBlob.ask).toLocaleString()}
**Timestamp:** ${new Date(report.reportBlob.observationsTimestamp).toISOString()}

*Data provided by Chainlink Data Streams*`;

      if (callback) {
        callback({
          text: responseText,
          content: {
            report,
            success: true,
            timestamp: Date.now()
          }
        });
      }

      return true;

    } catch (error) {
      const errorMessage = `❌ Failed to fetch latest report: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Get latest report action failed', { error });
      
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            timestamp: Date.now()
          }
        });
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Get me the latest price data for BTC stream' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Fetching the latest BTC price data from Chainlink Data Streams...' }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'What is the current ETH price from the data stream?' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Getting the latest ETH price report from the data stream...' }
      }
    ]
  ]
};

// Action to get market data for a cryptocurrency symbol
export const getMarketDataAction: Action = {
  name: 'GET_MARKET_DATA',
  similes: [
    'GET_CRYPTO_PRICE',
    'FETCH_MARKET_PRICE',
    'GET_SYMBOL_DATA',
    'CHECK_PRICE'
  ],
  description: 'Gets comprehensive market data for a cryptocurrency symbol using Chainlink Data Streams',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      const content = message.content?.text || '';
      const hasKeywords = content.includes('market data') || 
             content.includes('price') || 
             content.includes('crypto');
      const hasSymbols = /\b(BTC|ETH|LINK|USDC|USDT|BNB|ADA|DOT|MATIC)\b/i.test(content);
      return hasKeywords || hasSymbols;
    } catch (error) {
      return false;
    }
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const provider = runtime.providers.find(p => p.constructor.name === 'ChainlinkDataStreamsProvider') as unknown as ChainlinkDataStreamsProvider;
      if (!provider) {
        throw new DataStreamsError('Data Streams provider not initialized', 'PROVIDER_NOT_FOUND');
      }

      const context = composeContext({
        state,
        template: `Extract the cryptocurrency symbol from the user's request.
        
        User request: {{message}}
        
        Common symbols: BTC, ETH, LINK, USDC, USDT, BNB, ADA, DOT, MATIC
        
        Respond with JSON containing the symbol.`,
      });

      const response = await generateObjectV2({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
        schema: GetMarketDataSchema,
      });

      const symbol = (response.object as z.infer<typeof GetMarketDataSchema>)?.symbol || 'BTC';
      
      console.log(`Fetching market data for ${symbol}`);
      
      const marketData: MarketDataPoint = await provider.getMarketData(symbol);
      
      const responseText = `💰 **${symbol} Market Data**

**Current Price:** $${parseFloat(marketData.price).toLocaleString()}
**Bid Price:** $${parseFloat(marketData.bid).toLocaleString()}
**Ask Price:** $${parseFloat(marketData.ask).toLocaleString()}
**Spread:** $${(parseFloat(marketData.ask) - parseFloat(marketData.bid)).toFixed(4)}
**Last Updated:** ${new Date(marketData.timestamp).toISOString()}
**Data Source:** ${marketData.source}

*Real-time data from Chainlink Data Streams*`;

      if (callback) {
        callback({
          text: responseText,
          content: {
            marketData,
            success: true,
            timestamp: Date.now()
          }
        });
      }

      return true;

    } catch (error) {
      const errorMessage = `❌ Failed to fetch market data: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Get market data action failed', { error });
      
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            timestamp: Date.now()
          }
        });
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'What is the current BTC price?' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Getting the current BTC market data from Chainlink Data Streams...' }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Show me ETH market data' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Fetching ETH market data including bid/ask prices...' }
      }
    ]
  ]
};

// Action to subscribe to a data stream for real-time updates
export const subscribeToStreamAction: Action = {
  name: 'SUBSCRIBE_TO_STREAM',
  similes: [
    'START_MONITORING',
    'WATCH_PRICE',
    'SUBSCRIBE_UPDATES',
    'MONITOR_STREAM'
  ],
  description: 'Subscribes to a Chainlink Data Stream for real-time price updates',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      const content = message.content?.text || '';
      return content.includes('subscribe') || 
             content.includes('monitor') || 
             content.includes('watch') ||
             content.includes('real-time');
    } catch (error) {
      return false;
    }
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const provider = runtime.providers.find(p => p.constructor.name === 'ChainlinkDataStreamsProvider') as unknown as ChainlinkDataStreamsProvider;
      if (!provider) {
        throw new DataStreamsError('Data Streams provider not initialized', 'PROVIDER_NOT_FOUND');
      }

      const context = composeContext({
        state,
        template: `Extract the stream ID and optional symbol from the user's request.
        
        User request: {{message}}
        
        Respond with JSON containing the streamId and optional symbol.`,
      });

      const response = await generateObjectV2({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
        schema: SubscribeToStreamSchema,
      });

      const { streamId, symbol } = response.object as z.infer<typeof SubscribeToStreamSchema>;
      
      console.log(`Subscribing to stream ${streamId}`, { symbol });
      
      const subscriptionId = await provider.subscribeToStream(streamId, (report: CryptoReport) => {
        const updateText = `🔔 **Price Update - ${symbol || streamId}**

**Price:** $${parseFloat(report.reportBlob.benchmarkPrice).toLocaleString()}
**Bid:** $${parseFloat(report.reportBlob.bid).toLocaleString()}
**Ask:** $${parseFloat(report.reportBlob.ask).toLocaleString()}
**Time:** ${new Date(report.reportBlob.observationsTimestamp).toISOString()}`;

        if (callback) {
          callback({
            text: updateText,
            content: {
              report,
              subscriptionId,
              type: 'price_update',
              timestamp: Date.now()
            }
          });
        }
      });
      
      const responseText = `✅ **Stream Subscription Active**

**Stream ID:** ${streamId}
**Symbol:** ${symbol || 'N/A'}
**Subscription ID:** ${subscriptionId}

You will now receive real-time updates for this data stream.`;

      if (callback) {
        callback({
          text: responseText,
          content: {
            subscriptionId,
            streamId,
            symbol,
            success: true,
            timestamp: Date.now()
          }
        });
      }

      return true;

    } catch (error) {
      const errorMessage = `❌ Failed to subscribe to stream: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Subscribe to stream action failed', { error });
      
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            timestamp: Date.now()
          }
        });
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Subscribe to BTC price updates' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Setting up real-time BTC price monitoring...' }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'Monitor ETH stream for price changes' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Starting ETH stream monitoring for real-time updates...' }
      }
    ]
  ]
};

// Action to get stream metrics and performance data
export const getStreamMetricsAction: Action = {
  name: 'GET_STREAM_METRICS',
  similes: [
    'STREAM_STATS',
    'PERFORMANCE_DATA',
    'STREAM_HEALTH',
    'MONITORING_STATS'
  ],
  description: 'Gets performance metrics and statistics for a specific data stream',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      const content = message.content?.text || '';
      return content.includes('metrics') || 
             content.includes('stats') || 
             content.includes('performance') ||
             content.includes('health');
    } catch (error) {
      return false;
    }
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const provider = runtime.providers.find(p => p.constructor.name === 'ChainlinkDataStreamsProvider') as unknown as ChainlinkDataStreamsProvider;
      if (!provider) {
        throw new DataStreamsError('Data Streams provider not initialized', 'PROVIDER_NOT_FOUND');
      }

      const context = composeContext({
        state,
        template: `Extract the stream ID from the user's request.
        
        User request: {{message}}
        
        Respond with JSON containing the streamId.`,
      });

      const response = await generateObjectV2({
        runtime,
        context,
        modelClass: ModelClass.SMALL,
        schema: GetStreamMetricsSchema,
      });

      const { streamId } = response.object as z.infer<typeof GetStreamMetricsSchema>;
      
      console.log(`Getting metrics for stream ${streamId}`);
      
      const metrics: StreamMetrics = await provider.getStreamMetrics(streamId);
      
      const responseText = `📈 **Stream Performance Metrics**

**Stream ID:** ${streamId}
**Total Reports:** ${metrics.totalReports.toLocaleString()}
**Successful Reports:** ${metrics.successfulReports.toLocaleString()}
**Failed Reports:** ${metrics.failedReports.toLocaleString()}
**Success Rate:** ${(100 - metrics.errorRate).toFixed(2)}%
**Uptime:** ${metrics.uptime.toFixed(2)}%
**Average Latency:** ${metrics.averageLatency.toFixed(2)}ms
**Max Latency:** ${metrics.maxLatency.toFixed(2)}ms
**Min Latency:** ${metrics.minLatency.toFixed(2)}ms
**Last Update:** ${new Date(metrics.lastUpdate).toISOString()}

*Performance data from Chainlink Data Streams*`;

      if (callback) {
        callback({
          text: responseText,
          content: {
            metrics,
            success: true,
            timestamp: Date.now()
          }
        });
      }

      return true;

    } catch (error) {
      const errorMessage = `❌ Failed to get stream metrics: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Get stream metrics action failed', { error });
      
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            timestamp: Date.now()
          }
        });
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Show me the performance metrics for BTC stream' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Getting performance statistics for the BTC data stream...' }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'What are the stats for ETH stream health?' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Fetching health and performance metrics for ETH stream...' }
      }
    ]
  ]
};

// Action to get system-wide metrics
export const getSystemMetricsAction: Action = {
  name: 'GET_SYSTEM_METRICS',
  similes: [
    'SYSTEM_STATS',
    'OVERALL_METRICS',
    'SYSTEM_HEALTH',
    'PROVIDER_STATS'
  ],
  description: 'Gets system-wide metrics and statistics for the Data Streams provider',
  validate: async (runtime: IAgentRuntime, message: Memory) => {
    try {
      const content = message.content?.text || '';
      return content.includes('system metrics') || 
             content.includes('system stats') || 
             content.includes('overall') ||
             content.includes('provider stats');
    } catch (error) {
      return false;
    }
  },
  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    options: any,
    callback?: HandlerCallback
  ) => {
    try {
      const provider = runtime.providers.find(p => p.constructor.name === 'ChainlinkDataStreamsProvider') as unknown as ChainlinkDataStreamsProvider;
      if (!provider) {
        throw new DataStreamsError('Data Streams provider not initialized', 'PROVIDER_NOT_FOUND');
      }

      console.log(`Getting system metrics`);
      
      const metrics: SystemMetrics = await provider.getSystemMetrics();
      
      const responseText = `🖥️ **System Performance Metrics**

**Total Streams:** ${metrics.totalStreams}
**Active Subscriptions:** ${metrics.activeSubscriptions}
**Total Data Points:** ${metrics.totalDataPoints.toLocaleString()}
**Cache Hit Rate:** ${metrics.cacheHitRate.toFixed(2)}%
**API Calls/Minute:** ${metrics.apiCallsPerMinute}
**WebSocket Connections:** ${metrics.websocketConnections}
**Average Response Time:** ${metrics.averageResponseTime.toFixed(2)}ms
**System Uptime:** ${Math.floor(metrics.systemUptime / 1000 / 60)} minutes

*System statistics from Chainlink Data Streams Provider*`;

      if (callback) {
        callback({
          text: responseText,
          content: {
            metrics,
            success: true,
            timestamp: Date.now()
          }
        });
      }

      return true;

    } catch (error) {
      const errorMessage = `❌ Failed to get system metrics: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.error('Get system metrics action failed', { error });
      
      if (callback) {
        callback({
          text: errorMessage,
          content: {
            error: error instanceof Error ? error.message : 'Unknown error',
            success: false,
            timestamp: Date.now()
          }
        });
      }
      
      return false;
    }
  },
  examples: [
    [
      {
        user: '{{user1}}',
        content: { text: 'Show me the system metrics' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Getting overall system performance metrics...' }
      }
    ],
    [
      {
        user: '{{user1}}',
        content: { text: 'What are the provider stats?' }
      },
      {
        user: '{{user2}}',
        content: { text: 'Fetching Data Streams provider statistics...' }
      }
    ]
  ]
};

export const dataStreamsActions = [
  getLatestReportAction,
  getMarketDataAction,
  subscribeToStreamAction,
  getStreamMetricsAction,
  getSystemMetricsAction
]; 