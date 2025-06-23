import type { Provider } from '@ai16z/eliza';
import { getAgent, initialize } from './solanaAgentKit';
import { Connection, PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { coinGeckoProvider } from './coingecko';

// Common token addresses on Solana with their CoinGecko IDs
const KNOWN_TOKENS = {
  'USDC': {
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    coingeckoId: 'usd-coin'
  },
  'USDT': {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    coingeckoId: 'tether'
  },
  'RAY': {
    mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    coingeckoId: 'raydium'
  },
  'SRM': {
    mint: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
    coingeckoId: 'serum'
  },
  'BONK': {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    coingeckoId: 'bonk'
  },
  'ORCA': {
    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
    coingeckoId: 'orca'
  },
  'MNGO': {
    mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
    coingeckoId: 'mango-markets'
  }
} as const;

export interface TokenBalance {
  mint: string;
  symbol: string;
  balance: number;
  usdValue?: number;
}

export interface Portfolio {
  solBalance: number;
  tokens: TokenBalance[];
  totalValueUSD: number;
}

export interface SolanaProvider extends Provider {
  getBalance: (address: string, getSetting: (key: string) => string | undefined | null) => Promise<number>;
  getPortfolio: (address: string, getSetting: (key: string) => string | undefined | null) => Promise<Portfolio>;
  getTokenAccounts: (owner: string, getSetting: (key: string) => string | undefined | null) => Promise<TokenBalance[]>;
}

// Helper function to find token info by mint address
function findTokenByMint(mint: string): { symbol: string; coingeckoId?: string } {
  const entry = Object.entries(KNOWN_TOKENS).find(([_, info]) => info.mint === mint);
  return entry
    ? { symbol: entry[0], coingeckoId: entry[1].coingeckoId }
    : { symbol: 'Unknown' };
}

// Solana RPC Provider
export const solanaProvider = {
  getBalance: async (_address: string, getSetting: (key: string) => string | undefined | null): Promise<number> => {
    try {
      const privateKey = getSetting('SOLANA_PRIVATE_KEY');
      if (!privateKey) {
        throw new Error('SOLANA_PRIVATE_KEY not found in settings');
      }

      const rpcUrl = getSetting('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
      const openAiKey = getSetting('OPENAI_API_KEY') || undefined;

      // Initialize if not already initialized
      try {
        getAgent();
      } catch {
        initialize(privateKey, rpcUrl, openAiKey);
      }

      const agent = getAgent();
      console.log('Wallet public key:', agent.wallet.publicKey.toString());

      // Create connection and get balance
      const connection = new Connection(rpcUrl);
      const balance = await connection.getBalance(agent.wallet.publicKey);
      return balance / 1e9; // Convert lamports to SOL
    } catch (error) {
      console.error('Error in getBalance:', error);
      throw error;
    }
  },

  getTokenAccounts: async (owner: string, getSetting: (key: string) => string | undefined | null): Promise<TokenBalance[]> => {
    try {
      const rpcUrl = getSetting('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
      const connection = new Connection(rpcUrl);
      const ownerPubkey = new PublicKey(owner);

      // Get all token accounts for the owner
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPubkey, {
        programId: TOKEN_PROGRAM_ID
      });

      const tokens: TokenBalance[] = [];

      // Process each token account
      for (const { account } of tokenAccounts.value) {
        const parsedInfo = account.data.parsed.info;
        const balance = parsedInfo.tokenAmount.uiAmount;

        // Only include tokens with non-zero balance
        if (balance > 0) {
          const mint = parsedInfo.mint;
          const { symbol } = findTokenByMint(mint);

          tokens.push({
            mint,
            symbol,
            balance,
            usdValue: 0 // Will be updated with price data
          });
        }
      }

      return tokens;
    } catch (error) {
      console.error('Error fetching token accounts:', error);
      return [];
    }
  },

  getPortfolio: async (_address: string, getSetting: (key: string) => string | undefined | null): Promise<Portfolio> => {
    try {
      const privateKey = getSetting('SOLANA_PRIVATE_KEY');
      if (!privateKey) {
        throw new Error('SOLANA_PRIVATE_KEY not found in settings');
      }

      const rpcUrl = getSetting('SOLANA_RPC_URL') || 'https://api.mainnet-beta.solana.com';
      const openAiKey = getSetting('OPENAI_API_KEY') || undefined;

      // Initialize if not already initialized
      try {
        getAgent();
      } catch {
        initialize(privateKey, rpcUrl, openAiKey);
      }

      const agent = getAgent();
      console.log('Wallet public key:', agent.wallet.publicKey.toString());

      // Create connection and get SOL balance
      const connection = new Connection(rpcUrl);
      const balance = await connection.getBalance(agent.wallet.publicKey);
      const solBalance = balance / 1e9; // Convert lamports to SOL

      // Get token balances
      const tokens = await solanaProvider.getTokenAccounts(agent.wallet.publicKey.toString(), getSetting);

      // Get prices from CoinGecko
      let totalValueUSD = 0;
      try {
        const marketData = await coinGeckoProvider.getMarketData();

        // Calculate SOL value
        const solPrice = marketData.find(token => token.symbol.toLowerCase() === 'sol')?.current_price || 0;
        const solValue = solBalance * solPrice;
        totalValueUSD += solValue;
        console.log('SOL value:', solValue);

        // Calculate token values
        for (const token of tokens) {
          const { coingeckoId } = findTokenByMint(token.mint);
          if (coingeckoId) {
            const tokenData = marketData.find(t => t.id === coingeckoId);
            if (tokenData) {
              token.usdValue = token.balance * tokenData.current_price;
              totalValueUSD += token.usdValue;
              console.log(`${token.symbol} value:`, token.usdValue);
            }
          } else if (token.symbol === 'USDC' || token.symbol === 'USDT') {
            // Stablecoins are worth $1
            token.usdValue = token.balance;
            totalValueUSD += token.usdValue;
            console.log(`${token.symbol} value:`, token.usdValue);
          }
        }
      } catch (error) {
        console.error('Error fetching prices:', error);
      }

      return {
        solBalance,
        tokens,
        totalValueUSD
      };
    } catch (error) {
      console.error('Error in getPortfolio:', error);
      throw error;
    }
  }
};
