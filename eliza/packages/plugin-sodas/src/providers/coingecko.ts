import axios from 'axios';

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BASE_URL = 'https://api.coingecko.com/api/v3';

// Types for API responses
interface CoinGeckoPrice {
  usd: number;
}

interface CoinGeckoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
}

// Cache configuration
const CACHE_DURATION = 30 * 1000; // 30 seconds
let priceCache: { prices: Record<string, number>; timestamp: number } = {
  prices: {},
  timestamp: 0
};

// Helper function to check if cache is valid
function isCacheValid(): boolean {
  return Date.now() - priceCache.timestamp < CACHE_DURATION;
}

// Popular tokens to track
const POPULAR_TOKENS = [
  'bitcoin',
  'ethereum',
  'solana',
  'cardano',
  'polkadot',
  'ripple',
  'dogecoin',
  'chainlink',
  'uniswap',
  'avalanche-2'
] as const;

// Initialize axios instance with API key
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'x-cg-pro-api-key': COINGECKO_API_KEY
  }
});

// Format currency with 2 decimal places
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

// Format price change percentage
export function formatPriceChange(value: number): string {
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    signDisplay: 'always'
  }).format(value / 100);
  return formatted;
}

export const coinGeckoProvider = {
  // Fetch prices for multiple tokens in a single request
  getPrices: async (): Promise<Record<string, number>> => {
    try {
      // Check cache first
      if (isCacheValid()) {
        console.log('📦 Returning cached prices');
        return priceCache.prices;
      }

      console.log('🌐 Fetching fresh prices from CoinGecko');
      const response = await api.get<Record<string, CoinGeckoPrice>>('/simple/price', {
        params: {
          ids: POPULAR_TOKENS.join(','),
          vs_currencies: 'usd'
        }
      });

      // Transform response to simpler format
      const prices: Record<string, number> = {};
      for (const [token, data] of Object.entries(response.data)) {
        prices[token] = data.usd;
      }

      // Update cache
      priceCache = {
        prices,
        timestamp: Date.now()
      };

      return prices;
    } catch (error) {
      console.error('Error fetching prices:', error);
      throw error;
    }
  },

  // Get market data for tokens
  getMarketData: async (limit = 10): Promise<CoinGeckoMarketData[]> => {
    try {
      const response = await api.get<CoinGeckoMarketData[]>('/coins/markets', {
        params: {
          vs_currency: 'usd',
          order: 'market_cap_desc',
          per_page: limit,
          page: 1,
          sparkline: false
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching market data:', error);
      throw error;
    }
  }
};
