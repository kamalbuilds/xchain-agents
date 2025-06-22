// Network Configurations for Data Streams
export const DATA_STREAMS_NETWORKS = {
  ethereum: {
    verifierProxy: '0x5A1634A86e9b7BfEf33F0f3f3EA3b1aBBc4CC85F',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    chainId: 1
  },
  arbitrum: {
    verifierProxy: '0x478Aa2aC9F6D65F84e09D9185d126c3a17c2a93C',
    rpcUrl: 'https://arb-mainnet.g.alchemy.com/v2/',
    chainId: 42161
  },
  avalanche: {
    verifierProxy: '0x79BAa65505C6682F16F9b2C7F8afEBb1821BE3f6',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114
  },
  base: {
    verifierProxy: '0xDE1A28D87Afd0f546505B28AB50410A5c3a7387a',
    rpcUrl: 'https://mainnet.base.org',
    chainId: 8453
  },
  polygon: {
    verifierProxy: '0xF276a4BC8Da323EA3E8c3c195a4E2E7615a898d1',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137
  }
} as const;

// UUID type definition
export type UUID = `${string}-${string}-${string}-${string}-${string}`;

// Data Streams API Configuration
export interface DataStreamsConfig {
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
  websocketUrl: string;
  verifierProxyAddress: string;
  refreshInterval: number;
  maxRetries: number;
  timeout: number;
  enableWebSocket: boolean;
  enableCache: boolean;
  cacheExpiry: number;
}

// Market Data Stream Types
export interface StreamInfo {
  streamId: string;
  feedLabel: string;
  feedType: 'crypto' | 'rwa';
  deviation: number;
  heartbeat: number;
  decimals: number;
  description: string;
  marketHours: MarketHours;
}

export interface MarketHours {
  timezone: string;
  openTime: string;
  closeTime: string;
  closedDays: string[];
  isAlwaysOpen: boolean;
}

// Report Schema v3 (Crypto Streams)
export interface CryptoReport {
  feedId: string;
  validFromTimestamp: number;
  observationsTimestamp: number;
  fullReport: string; // hex encoded
  reportContext: ReportContext;
  reportBlob: ReportBlob;
  rawVs: string[];
  rawRs: string[];
  rawSs: string[];
}

export interface ReportContext {
  reportTimestamp: number;
  previousReportTimestamp: number;
  observationTimestamp: number;
  validFromTimestamp: number;
  epochAndRound: string;
  extraHash: string;
}

export interface ReportBlob {
  observationsTimestamp: number;
  benchmarkPrice: string;
  bid: string;
  ask: string;
  currentBlockNum: number;
  currentBlockHash: string;
  validFromBlockNum: number;
  currentBlockTimestamp: number;
}

// Market Data Types
export interface MarketDataPoint {
  symbol: string;
  price: string;
  bid: string;
  ask: string;
  volume24h: string;
  change24h: string;
  timestamp: number;
  source: 'data-streams' | 'fallback';
  liquidity?: string;
  volatility?: string;
}

export interface LiquidityMetrics {
  bidLiquidity: string;
  askLiquidity: string;
  totalLiquidity: string;
  liquidityScore: number;
  spreadPercentage: string;
}

export interface VolatilityMetrics {
  impliedVolatility: string;
  historicalVolatility: string;
  volatilityIndex: number;
  priceChange1h: string;
  priceChange24h: string;
  priceChange7d: string;
}

// WebSocket Stream Types
export interface StreamSubscription {
  id: string;
  streamIds: string[];
  callback: (report: CryptoReport) => void;
  errorCallback: (error: Error) => void;
  isActive: boolean;
  reconnectAttempts: number;
}

export interface WebSocketMessage {
  type: 'subscribe' | 'unsubscribe' | 'report' | 'error';
  data: any;
  timestamp: number;
}

// API Response Types
export interface DataStreamsResponse<T = any> {
  success: boolean;
  data: T;
  timestamp: number;
  metadata?: {
    source: string;
    version: string;
    latency: number;
  };
}

export interface ReportResponse {
  reports: CryptoReport[];
  streamIds: string[];
  totalCount: number;
  hasMore: boolean;
}

// Verification Types
export interface VerificationRequest {
  reportContext: string;
  reportBlob: string;
  rawRs: string[];
  rawSs: string[];
  rawVs: string[];
}

export interface VerificationResult {
  isValid: boolean;
  verifierResponse: string;
  gasUsed?: number;
  transactionHash?: string;
  blockNumber?: number;
}

// Performance Metrics
export interface StreamMetrics {
  streamId: string;
  totalReports: number;
  successfulReports: number;
  failedReports: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
  uptime: number;
  lastUpdate: number;
  errorRate: number;
}

export interface SystemMetrics {
  totalStreams: number;
  activeSubscriptions: number;
  totalDataPoints: number;
  cacheHitRate: number;
  apiCallsPerMinute: number;
  websocketConnections: number;
  averageResponseTime: number;
  systemUptime: number;
}

// Error Types
export class DataStreamsError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DataStreamsError';
  }
}

export class VerificationError extends DataStreamsError {
  constructor(message: string, details?: any) {
    super(message, 'VERIFICATION_FAILED', details);
    this.name = 'VerificationError';
  }
}

export class APIConnectionError extends DataStreamsError {
  constructor(message: string, details?: any) {
    super(message, 'API_CONNECTION_ERROR', details);
    this.name = 'APIConnectionError';
  }
}

export class StreamNotFoundError extends DataStreamsError {
  constructor(streamId: string) {
    super(`Stream not found: ${streamId}`, 'STREAM_NOT_FOUND', { streamId });
    this.name = 'StreamNotFoundError';
  }
}

// Cache Types
export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
  hits: number;
}

export interface CacheMetrics {
  totalKeys: number;
  hitRate: number;
  missRate: number;
  totalHits: number;
  totalMisses: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

// Event Types
export interface DataStreamsEvent {
  type: 'report' | 'error' | 'connection' | 'subscription';
  streamId?: string;
  timestamp: number;
  data: any;
}

// Provider Interface
export interface DataStreamsProvider {
  // Core functionality
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  
  // Stream management
  getAvailableStreams(): Promise<StreamInfo[]>;
  subscribeToStream(streamId: string, callback: (report: CryptoReport) => void): Promise<string>;
  unsubscribeFromStream(subscriptionId: string): Promise<void>;
  
  // Data retrieval
  getLatestReport(streamId: string): Promise<CryptoReport>;
  getReports(streamIds: string[], timestamp?: number): Promise<ReportResponse>;
  getMarketData(symbol: string): Promise<MarketDataPoint>;
  
  // Verification
  verifyReport(report: CryptoReport): Promise<VerificationResult>;
  
  // Performance monitoring
  getStreamMetrics(streamId: string): Promise<StreamMetrics>;
  getSystemMetrics(): Promise<SystemMetrics>;
}

// Action Types for Eliza Integration
export interface StreamActionRequest {
  action: 'subscribe' | 'unsubscribe' | 'get_latest' | 'get_market_data' | 'verify_report';
  streamId?: string;
  symbol?: string;
  subscriptionId?: string;
  report?: CryptoReport;
}

export interface StreamActionResponse {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: {
    timestamp: number;
    latency: number;
    source: string;
  };
}

// Configuration for different market types
export const CRYPTO_STREAM_IDS = {
  'BTC/USD': '0x0000000000000000000000000000000000000000000000000000000000000001',
  'ETH/USD': '0x0000000000000000000000000000000000000000000000000000000000000002',
  'LINK/USD': '0x0000000000000000000000000000000000000000000000000000000000000003',
  'AVAX/USD': '0x0000000000000000000000000000000000000000000000000000000000000004',
  'MATIC/USD': '0x0000000000000000000000000000000000000000000000000000000000000005'
} as const;

export const DEFAULT_CONFIG: Partial<DataStreamsConfig> = {
  refreshInterval: 1000, // 1 second
  maxRetries: 3,
  timeout: 5000,
  enableWebSocket: true,
  enableCache: true,
  cacheExpiry: 10000 // 10 seconds
};

export type StreamSymbol = keyof typeof CRYPTO_STREAM_IDS;
export type NetworkName = keyof typeof DATA_STREAMS_NETWORKS; 