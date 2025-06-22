import { z } from 'zod';

// Chain selector mappings for CCIP
export const CHAIN_SELECTORS = {
  ETHEREUM_MAINNET: '5009297550715157269',
  ETHEREUM_SEPOLIA: '16015286601757825753',
  POLYGON_MAINNET: '4051577828743386545',
  POLYGON_MUMBAI: '12532609583862916517',
  ARBITRUM_MAINNET: '4949039107694359620',
  ARBITRUM_SEPOLIA: '3478487238524512106',
  AVALANCHE_MAINNET: '6433500567565415381',
  AVALANCHE_FUJI: '14767482510784806043',
  BNB_MAINNET: '11344663589394136015',
  BNB_TESTNET: '13264668187771770619',
  BASE_MAINNET: '15971525489660198786',
  BASE_SEPOLIA: '10344971235874465080',
  OPTIMISM_MAINNET: '3734403246176062136',
  OPTIMISM_SEPOLIA: '5224473277236331295'
} as const;

export const CCIP_ROUTER_ADDRESSES = {
  ETHEREUM_MAINNET: '0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D',
  ETHEREUM_SEPOLIA: '0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59',
  POLYGON_MAINNET: '0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe',
  POLYGON_MUMBAI: '0x1035CabC275068e0F4b745A29CEDf38E13aF41b1',
  ARBITRUM_MAINNET: '0x141fa059441E0ca23ce184B6A78bafD2A517DdE8',
  ARBITRUM_SEPOLIA: '0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165',
  AVALANCHE_MAINNET: '0xF4c7E640EdA248ef95972845a62bdC74237805dB',
  AVALANCHE_FUJI: '0xF694E193200268f9a4868e4Aa017A0118C9a8177',
  BNB_MAINNET: '0x34B03Cb9086d7D758AC55af71584F81A598759FE',
  BNB_TESTNET: '0xE1053aE1857476f36A3C62580FF9b016E8EE8F6f',
  BASE_MAINNET: '0x673AA85efd75080031d44fcA061575d1dA427A28',
  BASE_SEPOLIA: '0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93',
  OPTIMISM_MAINNET: '0x3206695CaE29952f4b0c22a169725a865bc8Ce0f',
  OPTIMISM_SEPOLIA: '0x114A20A10b43D4115e5aeef7345a1A71d2a60C57'
} as const;

// Zod schemas for validation
export const ChainConfigSchema = z.object({
  chainId: z.number(),
  chainSelector: z.string(),
  routerAddress: z.string(),
  linkTokenAddress: z.string(),
  wrappedNativeAddress: z.string(),
  rpcUrl: z.string(),
  name: z.string(),
  isTestnet: z.boolean()
});

export const CCIPMessageSchema = z.object({
  receiver: z.string(),
  data: z.string(),
  tokenAmounts: z.array(z.object({
    token: z.string(),
    amount: z.string()
  })).optional(),
  feeToken: z.string(),
  gasLimit: z.number().optional()
});

export const CCIPSendRequestSchema = z.object({
  destinationChainSelector: z.string(),
  message: CCIPMessageSchema,
  fees: z.object({
    linkFee: z.string(),
    nativeFee: z.string()
  })
});

export const CCIPReceiveEventSchema = z.object({
  messageId: z.string(),
  sourceChainSelector: z.string(),
  sender: z.string(),
  data: z.string(),
  tokenAmounts: z.array(z.object({
    token: z.string(),
    amount: z.string()
  })).optional(),
  gasLimit: z.number(),
  blockNumber: z.number(),
  transactionHash: z.string(),
  timestamp: z.number()
});

export const ArbitrageOpportunitySchema = z.object({
  id: z.string(),
  sourceChain: z.string(),
  destinationChain: z.string(),
  asset: z.string(),
  sourcePrice: z.number(),
  destinationPrice: z.number(),
  priceDifference: z.number(),
  profitability: z.number(),
  estimatedGasCost: z.string(),
  netProfit: z.string(),
  confidence: z.number(),
  timestamp: z.number(),
  expiresAt: z.number()
});

export const CrossChainTransactionSchema = z.object({
  id: z.string(),
  messageId: z.string(),
  sourceChain: z.string(),
  destinationChain: z.string(),
  sourceTransactionHash: z.string(),
  destinationTransactionHash: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'success', 'failed', 'cancelled']),
  amount: z.string(),
  tokenAddress: z.string(),
  sender: z.string(),
  receiver: z.string(),
  gasUsed: z.string().optional(),
  fees: z.object({
    ccipFee: z.string(),
    gasFee: z.string(),
    totalFee: z.string()
  }),
  createdAt: z.number(),
  completedAt: z.number().optional(),
  errorMessage: z.string().optional()
});

// TypeScript types derived from schemas
export type ChainConfig = z.infer<typeof ChainConfigSchema>;
export type CCIPMessage = z.infer<typeof CCIPMessageSchema>;
export type CCIPSendRequest = z.infer<typeof CCIPSendRequestSchema>;
export type CCIPReceiveEvent = z.infer<typeof CCIPReceiveEventSchema>;
export type ArbitrageOpportunity = z.infer<typeof ArbitrageOpportunitySchema>;
export type CrossChainTransaction = z.infer<typeof CrossChainTransactionSchema>;

// Additional types for CCIP operations
export interface CCIPProvider {
  sendMessage(request: CCIPSendRequest): Promise<string>;
  getMessageStatus(messageId: string): Promise<CCIPMessageStatus>;
  estimateFees(request: CCIPSendRequest): Promise<CCIPFeeEstimate>;
  getSupportedChains(): Promise<ChainConfig[]>;
  subscribeToMessages(callback: (event: CCIPReceiveEvent) => void): void;
  unsubscribeFromMessages(): void;
}

export interface CCIPMessageStatus {
  messageId: string;
  status: 'pending' | 'in_progress' | 'success' | 'failed';
  sourceTransactionHash: string;
  destinationTransactionHash?: string;
  gasUsed?: string;
  errorMessage?: string;
  timestamp: number;
}

export interface CCIPFeeEstimate {
  linkFee: string;
  nativeFee: string;
  gasLimit: number;
  gasPrice: string;
  totalCostUSD: number;
}

export interface CCIPRouterContract {
  address: string;
  abi: any[];
  getSupportedTokens(chainSelector: string): Promise<string[]>;
  getFee(destinationChainSelector: string, message: CCIPMessage): Promise<string>;
  ccipSend(destinationChainSelector: string, message: CCIPMessage): Promise<string>;
}

export interface CCIPConfiguration {
  chains: Record<string, ChainConfig>;
  defaultGasLimit: number;
  maxRetries: number;
  retryDelay: number;
  monitoringInterval: number;
  feeBufferPercentage: number;
}

// Error types
export class CCIPError extends Error {
  constructor(
    message: string,
    public code: string,
    public chainSelector?: string,
    public messageId?: string
  ) {
    super(message);
    this.name = 'CCIPError';
  }
}

export class InsufficientFundsError extends CCIPError {
  constructor(required: string, available: string, token: string) {
    super(
      `Insufficient ${token} funds. Required: ${required}, Available: ${available}`,
      'INSUFFICIENT_FUNDS'
    );
  }
}

export class UnsupportedChainError extends CCIPError {
  constructor(chainSelector: string) {
    super(
      `Chain selector ${chainSelector} is not supported`,
      'UNSUPPORTED_CHAIN',
      chainSelector
    );
  }
}

export class MessageTimeoutError extends CCIPError {
  constructor(messageId: string, timeout: number) {
    super(
      `Message ${messageId} timed out after ${timeout}ms`,
      'MESSAGE_TIMEOUT',
      undefined,
      messageId
    );
  }
}

// Event types for real-time monitoring
export interface CCIPEventSubscription {
  id: string;
  chainSelector: string;
  eventType: 'CCIPSendRequested' | 'CCIPMessageReceived' | 'ExecutionStateChanged';
  callback: (event: any) => void;
  isActive: boolean;
}

export interface CCIPMetrics {
  totalMessagesSent: number;
  totalMessagesReceived: number;
  successRate: number;
  averageProcessingTime: number;
  totalFeesSpent: string;
  totalVolumeTransferred: string;
  activeSubscriptions: number;
  lastUpdated: number;
}

// Lane configuration for cross-chain routes
export interface CCIPLane {
  sourceChainSelector: string;
  destinationChainSelector: string;
  isEnabled: boolean;
  supportedTokens: string[];
  gasLimit: number;
  rateLimitCapacity: string;
  rateLimitRefillRate: string;
  priceUpdates: {
    gasPrice: string;
    tokenPrices: Record<string, string>;
  };
}

export type ChainSelector = keyof typeof CHAIN_SELECTORS;
export type RouterAddress = keyof typeof CCIP_ROUTER_ADDRESSES; 