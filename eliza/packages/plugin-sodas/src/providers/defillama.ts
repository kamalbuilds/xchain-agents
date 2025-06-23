import type { Provider, IAgentRuntime, Memory, State } from '@ai16z/eliza';
import axios from 'axios';

interface ChainTVLData {
  name: string;
  tvl: number;
  chainId: string;
  tokenSymbol: string;
}

interface ProtocolData {
  id: string;
  name: string;
  chain: string;
  tvl: number;
  chainTvls: {
    [key: string]: number;
  };
  symbol: string;
  category: string;
}

interface YieldPoolData {
  chain: string;
  name: string;
  tvl: number;
  apy: number;
}

interface ProtocolMetrics {
  name: string;
  tvl: number;
}

interface GlobalTVLResponse {
  totalTvl: number;
  solanaPercentage: number;
  solanaTvl: number;
  topChains: Array<{
    name: string;
    tvl: number;
    percentage: number;
  }>;
}

interface TVLResponse {
  tvl: number;
  protocols: ProtocolMetrics[];
  globalMetrics: GlobalTVLResponse;
}

export interface DefiLlamaProvider extends Provider {
  get: (runtime: IAgentRuntime, message: Memory, state?: State) => Promise<TVLResponse | null>;
  getTVL: () => Promise<TVLResponse>;
  getProtocolMetrics: () => Promise<ProtocolMetrics[]>;
  getYieldFarms: () => Promise<ProtocolMetrics[]>;
  getGlobalTVL: () => Promise<GlobalTVLResponse>;
}

// Format TVL numbers to be more readable
export function formatTVL(tvl: number): string {
  const billion = 1000000000;
  const million = 1000000;
  if (tvl >= billion) {
    return `$${(tvl / billion).toFixed(2)}B`;
  }
  return `$${(tvl / million).toFixed(2)}M`;
}

// Format percentage with 2 decimal places
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

// DeFiLlama API Provider implementation
export const defiLlamaProvider: DefiLlamaProvider = {
  get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State): Promise<TVLResponse | null> => {
    // Generic get method required by Provider interface
    return Promise.resolve(null);
  },

  getGlobalTVL: async (): Promise<GlobalTVLResponse> => {
    try {
      // Get all chains TVL
      const chainResponse = await axios.get<ChainTVLData[]>('https://api.llama.fi/v2/chains');
      const totalTvl = chainResponse.data.reduce((sum, chain) => sum + chain.tvl, 0);

      // Get Solana specific data
      const solanaData = chainResponse.data.find((chain) => chain.name.toLowerCase() === 'solana');
      const solanaTvl = solanaData?.tvl || 0;
      const solanaPercentage = solanaTvl / totalTvl;

      // Get top 5 chains by TVL
      const topChains = chainResponse.data
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 5)
        .map(chain => ({
          name: chain.name,
          tvl: chain.tvl,
          percentage: chain.tvl / totalTvl
        }));

      return {
        totalTvl,
        solanaTvl,
        solanaPercentage,
        topChains
      };
    } catch (error) {
      console.error('Error fetching global TVL data:', error);
      throw error;
    }
  },

  getTVL: async (): Promise<TVLResponse> => {
    try {
      // Get Solana chain TVL using the /v2/chains endpoint
      const chainResponse = await axios.get<ChainTVLData[]>('https://api.llama.fi/v2/chains');
      const solanaData = chainResponse.data.find((chain) => chain.name.toLowerCase() === 'solana');
      const totalTVL = solanaData?.tvl || 0;

      // Get protocols using the /protocols endpoint
      const protocolsResponse = await axios.get<ProtocolData[]>('https://api.llama.fi/protocols');
      const solanaProtocols = protocolsResponse.data
        .filter((protocol) => protocol.chain === 'Solana' || (protocol.chainTvls && protocol.chainTvls.Solana > 0))
        .map((protocol) => ({
          name: protocol.name,
          tvl: protocol.chainTvls?.Solana || (protocol.chain === 'Solana' ? protocol.tvl : 0)
        }))
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 3);

      // Get global TVL metrics
      const globalMetrics = await defiLlamaProvider.getGlobalTVL();

      return {
        tvl: totalTVL,
        protocols: solanaProtocols,
        globalMetrics
      };
    } catch (error) {
      console.error('Error fetching TVL data:', error);
      throw error;
    }
  },

  getProtocolMetrics: async (): Promise<ProtocolMetrics[]> => {
    const { protocols } = await defiLlamaProvider.getTVL();
    return protocols;
  },

  getYieldFarms: async (): Promise<ProtocolMetrics[]> => {
    try {
      const response = await axios.get<YieldPoolData[]>('https://api.llama.fi/pools');
      const solanaFarms = response.data
        .filter((pool) => pool.chain === 'Solana')
        .map((pool) => ({
          name: pool.name,
          tvl: pool.tvl
        }))
        .sort((a, b) => b.tvl - a.tvl)
        .slice(0, 3);

      return solanaFarms;
    } catch (error) {
      console.error('Error fetching yield farms:', error);
      throw error;
    }
  }
};
