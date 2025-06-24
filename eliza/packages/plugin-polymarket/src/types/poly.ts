// Polymarket API Types based on official documentation
export interface PolymarketConfig {
    apiUrl: string;
    apiKey: string;
    apiSecret: string;
    chainId: number;
    enableWebSocket: boolean;
    timeout: number;
    retryAttempts: number;
    enableCache: boolean;
    cacheExpiry: number;
  }
  
  export interface Market {
    id: string;
    question: string;
    description: string;
    endDate: string;
    image: string;
    icon: string;
    active: boolean;
    closed: boolean;
    archived: boolean;
    new: boolean;
    featured: boolean;
    restricted: boolean;
    liquidityNum: number;
    volumeNum: number;
    volume24hrCloseTime: string;
    volume24hrNum: number;
    commentCount: number;
    createdAt: string;
    updatedAt: string;
    enableOrderBook: boolean;
    orderPriceMinTickSize: number;
    orderMinSize: number;
    makerBaseFee: number;
    takerBaseFee: number;
    feeDestinations: FeeDestination[];
    tags: string[];
    cyom: boolean;
    acceptingOrders: boolean;
    acceptingOrderTimestamp: string;
    minimumOrderSize: number;
    minimumTickSize: number;
    clobTokenIds: string[];
    conditionId: string;
    questionId: string;
    tokens: Token[];
    rewards: Reward[];
    groupItemTitle: string;
    groupItemThreshold: number;
    umaBond: number;
    umaReward: number;
    spread: number;
    lastTradePrice: number;
    bestBid: number;
    bestAsk: number;
    seconds_delay: number;
    game_start_time: string;
    hasReviewedMarket: boolean;
    reviewedMarket: boolean;
    negRisk: boolean;
    rewardsMinSize: number;
    rewardsMaxSpread: number;
    startDate: string;
    endDateIso: string;
    startDateIso: string;
  }
  
  export interface Token {
    id: string;
    conditionId: string;
    questionId: string;
    tokenId: string;
    outcome: string;
    winner: boolean;
    price: number;
  }
  
  export interface FeeDestination {
    account: string;
    amount: number;
  }
  
  export interface Reward {
    id: string;
    conditionId: string;
    assetAddress: string;
    rewardAmount: number;
    startDate: string;
    endDate: string;
  }
  
  export interface OrderBook {
    market: string;
    asset_id: string;
    bids: Order[];
    asks: Order[];
    hash: string;
  }
  
  export interface Order {
    price: string;
    size: string;
  }
  
  export interface Trade {
    id: string;
    market: string;
    asset_id: string;
    side: 'BUY' | 'SELL';
    size: string;
    price: string;
    fee_rate_bps: number;
    fee: string;
    timestamp: string;
    outcome: string;
    bucket_index: number;
    trader_side: 'MAKER' | 'TAKER';
    tx_hash: string;
    trader: string;
  }
  
  export interface Position {
    market: string;
    asset_id: string;
    side: 'LONG' | 'SHORT';
    size: string;
    value: string;
    pnl: string;
    entry_price: string;
    current_price: string;
    updated_at: string;
  }
  
  export interface PortfolioSummary {
    total_value: string;
    total_pnl: string;
    total_volume: string;
    positions_count: number;
    markets_count: number;
    win_rate: number;
    avg_position_size: string;
    largest_win: string;
    largest_loss: string;
    updated_at: string;
  }
  
  export interface MarketPrice {
    market: string;
    asset_id: string;
    price: string;
    timestamp: string;
    volume_24h: string;
    price_change_24h: string;
    price_change_percentage_24h: number;
  }
  
  export interface MarketAnalytics {
    market: string;
    volume_24h: string;
    volume_7d: string;
    volume_30d: string;
    liquidity: string;
    price_volatility: number;
    trade_count_24h: number;
    unique_traders_24h: number;
    average_trade_size: string;
    largest_trade_24h: string;
    price_history: PricePoint[];
    volume_history: VolumePoint[];
  }
  
  export interface PricePoint {
    timestamp: string;
    price: string;
    volume: string;
  }
  
  export interface VolumePoint {
    timestamp: string;
    volume: string;
    trade_count: number;
  }
  
  export interface WebSocketMessage {
    type: 'price_update' | 'trade' | 'order_book' | 'market_update';
    data: any;
    timestamp: number;
  }
  
  export interface WebSocketSubscription {
    id: string;
    market: string;
    asset_id?: string;
    callback: (data: any) => void;
    errorCallback: (error: Error) => void;
    isActive: boolean;
  }
  
  export interface PolymarketProvider {
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    
    // Market data
    getMarkets(params?: MarketQueryParams): Promise<Market[]>;
    getMarket(marketId: string): Promise<Market>;
    getMarketPrice(marketId: string, assetId?: string): Promise<MarketPrice>;
    getMarketAnalytics(marketId: string): Promise<MarketAnalytics>;
    
    // Order book and trades
    getOrderBook(marketId: string, assetId: string): Promise<OrderBook>;
    getTrades(marketId: string, params?: TradeQueryParams): Promise<Trade[]>;
    
    // Portfolio and positions
    getPortfolio(address: string): Promise<PortfolioSummary>;
    getPositions(address: string): Promise<Position[]>;
    
    // WebSocket subscriptions
    subscribeToMarket(marketId: string, callback: (data: any) => void): Promise<string>;
    subscribeToTrades(marketId: string, callback: (trade: Trade) => void): Promise<string>;
    unsubscribe(subscriptionId: string): Promise<void>;
    
    // Analytics
    getTopMarkets(limit?: number): Promise<Market[]>;
    getTrendingMarkets(limit?: number): Promise<Market[]>;
    searchMarkets(query: string): Promise<Market[]>;
  }
  
  export interface MarketQueryParams {
    active?: boolean;
    closed?: boolean;
    limit?: number;
    offset?: number;
    order?: 'asc' | 'desc';
    orderBy?: 'volume' | 'liquidity' | 'created_at' | 'end_date';
    tags?: string[];
    search?: string;
  }
  
  export interface TradeQueryParams {
    limit?: number;
    offset?: number;
    startTime?: string;
    endTime?: string;
    side?: 'BUY' | 'SELL';
    trader?: string;
  }
  
  export interface ArbitrageOpportunity {
    id: string;
    market: Market;
    asset_id: string;
    price_difference: number;
    profit_potential: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    confidence_score: number;
    timestamp: string;
    expires_at: string;
    recommended_action: 'BUY' | 'SELL' | 'HOLD';
    data_sources: string[];
  }
  
  export interface MarketPrediction {
    market: Market;
    asset_id: string;
    predicted_price: number;
    confidence: number;
    time_horizon: string;
    factors: PredictionFactor[];
    model_version: string;
    created_at: string;
  }
  
  export interface PredictionFactor {
    name: string;
    weight: number;
    value: number;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  }
  
  // Error types
  export class PolymarketError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'PolymarketError';
    }
  }
  
  export class APIConnectionError extends PolymarketError {
    constructor(message: string) {
      super(message, 'API_CONNECTION_ERROR');
    }
  }
  
  export class MarketNotFoundError extends PolymarketError {
    constructor(marketId: string) {
      super(`Market not found: ${marketId}`, 'MARKET_NOT_FOUND');
    }
  }
  
  export class InsufficientDataError extends PolymarketError {
    constructor(message: string) {
      super(message, 'INSUFFICIENT_DATA');
    }
  }
  
  export const DEFAULT_POLYMARKET_CONFIG: PolymarketConfig = {
    apiUrl: 'https://clob.polymarket.com',
    apiKey: '',
    apiSecret: '',
    chainId: 137, // Polygon
    enableWebSocket: true,
    timeout: 30000,
    retryAttempts: 3,
    enableCache: true,
    cacheExpiry: 60000, // 1 minute
  };
  
  export const POPULAR_MARKETS = {
    POLITICS: ['us-election', 'biden-approval', 'trump-legal'],
    CRYPTO: ['bitcoin-price', 'ethereum-price', 'crypto-regulation'],
    SPORTS: ['super-bowl', 'world-cup', 'olympics'],
    ECONOMICS: ['recession', 'inflation', 'fed-rates'],
    TECH: ['ai-breakthrough', 'meta-stock', 'tesla-delivery']
  }; 