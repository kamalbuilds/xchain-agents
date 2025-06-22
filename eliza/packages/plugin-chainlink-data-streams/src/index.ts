import { Plugin } from '@ai16z/eliza';
import { ChainlinkDataStreamsProvider } from './providers/dataStreamsProvider.js';
import { dataStreamsActions } from './actions/dataStreamsActions.js';

export const chainlinkDataStreamsPlugin: Plugin = {
  name: 'chainlink-data-streams',
  description: 'Chainlink Data Streams plugin for high-frequency market data integration',
  providers: [
    {
      get: async (runtime, message, state) => {
        const provider = new ChainlinkDataStreamsProvider({
          apiUrl: process.env.CHAINLINK_DATA_STREAMS_API_URL || 'https://api.chain.link/v1/data-streams',
          apiKey: process.env.CHAINLINK_API_KEY || '',
          apiSecret: process.env.CHAINLINK_API_SECRET || '',
          enableWebSocket: true,
          enableCache: true,
          cacheExpiry: 30000, // 30 seconds
          timeout: 10000
        });
        
        await provider.initialize();
        return provider;
      }
    }
  ],
  actions: dataStreamsActions,
  evaluators: [],
  services: [],
  clients: []
};

export default chainlinkDataStreamsPlugin;

// Export types and classes for external use
export * from './types/dataStreams.js';
export * from './providers/dataStreamsProvider.js';
export * from './actions/dataStreamsActions.js'; 