import { ethers, Contract, JsonRpcProvider } from 'ethers';
import * as WebSocket from 'ws';
import axios, { AxiosInstance } from 'axios';
import * as winston from 'winston';
import * as cron from 'node-cron';
import {
  DataStreamsProvider,
  DataStreamsConfig,
  StreamInfo,
  CryptoReport,
  ReportResponse,
  VerificationResult,
  StreamMetrics,
  SystemMetrics,
  StreamSubscription,
  WebSocketMessage,
  DataStreamsEvent,
  StreamActionRequest,
  StreamActionResponse,
  MarketDataPoint,
  DataStreamsError,
  VerificationError,
  APIConnectionError,
  StreamNotFoundError,
  CacheEntry,
  CacheMetrics,
  DATA_STREAMS_NETWORKS,
  CRYPTO_STREAM_IDS,
  DEFAULT_CONFIG
} from '../types/dataStreams.js';

// Verifier Proxy ABI for on-chain verification based on Chainlink Data Streams documentation
const VERIFIER_PROXY_ABI = [
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "payload",
        "type": "bytes"
      },
      {
        "internalType": "bytes",
        "name": "parameterPayload",
        "type": "bytes"
      }
    ],
    "name": "verify",
    "outputs": [
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes[]",
        "name": "payloads",
        "type": "bytes[]"
      },
      {
        "internalType": "bytes",
        "name": "parameterPayload",
        "type": "bytes"
      }
    ],
    "name": "verifyBulk",
    "outputs": [
      {
        "internalType": "bytes[]",
        "name": "verifiedReports",
        "type": "bytes[]"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  }
];

export class ChainlinkDataStreamsProvider implements DataStreamsProvider {
  private readonly logger: winston.Logger;
  private readonly config: DataStreamsConfig;
  private readonly httpClient: AxiosInstance;
  private readonly providers: Map<string, JsonRpcProvider> = new Map();
  private readonly verifierContracts: Map<string, Contract> = new Map();
  private readonly subscriptions: Map<string, StreamSubscription> = new Map();
  private readonly cache: Map<string, CacheEntry> = new Map();
  private readonly streamMetrics: Map<string, StreamMetrics> = new Map();
  private websocket: WebSocket | null = null;
  private systemMetrics: SystemMetrics;
  private isInitialized = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(config: Partial<DataStreamsConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config } as DataStreamsConfig;
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'data-streams.log' })
      ]
    });

    // Configure HTTP client for Chainlink Data Streams API
    this.httpClient = axios.create({
      baseURL: this.config.apiUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey
      },
      auth: {
        username: this.config.apiKey,
        password: this.config.apiSecret
      }
    });

    this.systemMetrics = {
      totalStreams: 0,
      activeSubscriptions: 0,
      totalDataPoints: 0,
      cacheHitRate: 0,
      apiCallsPerMinute: 0,
      websocketConnections: 0,
      averageResponseTime: 0,
      systemUptime: Date.now()
    };

    this.setupHttpInterceptors();
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing Chainlink Data Streams Provider');

      // Initialize blockchain providers and verifier contracts
      await this.initializeProviders();

      // Initialize WebSocket connection if enabled
      if (this.config.enableWebSocket) {
        await this.initializeWebSocket();
      }

      // Start periodic cache cleanup
      this.startCacheCleanup();

      // Start metrics collection
      this.startMetricsCollection();

      this.isInitialized = true;
      this.logger.info('Data Streams Provider initialized successfully');

    } catch (error) {
      this.logger.error('Failed to initialize Data Streams Provider', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DataStreamsError(
        `Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INITIALIZATION_FAILED'
      );
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.logger.info('Shutting down Data Streams Provider');

      // Close WebSocket connection
      if (this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }

      // Clear all subscriptions
      this.subscriptions.clear();

      // Clear cache
      this.cache.clear();

      this.isInitialized = false;
      this.logger.info('Data Streams Provider shut down successfully');

    } catch (error) {
      this.logger.error('Error during shutdown', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAvailableStreams(): Promise<StreamInfo[]> {
    try {
      const cacheKey = 'available_streams';
      const cached = this.getFromCache<StreamInfo[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const response = await this.httpClient.get('/streams');
      const streams: StreamInfo[] = response.data.streams || [];

      // Cache the result
      this.setCache(cacheKey, streams, this.config.cacheExpiry);

      this.logger.info(`Retrieved ${streams.length} available streams`);
      return streams;

    } catch (error) {
      this.logger.error('Failed to get available streams', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new APIConnectionError(
        `Failed to get available streams: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async subscribeToStream(streamId: string, callback: (report: CryptoReport) => void): Promise<string> {
    try {
      if (!this.isInitialized) {
        throw new DataStreamsError('Provider not initialized', 'NOT_INITIALIZED');
      }

      const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const subscription: StreamSubscription = {
        id: subscriptionId,
        streamIds: [streamId],
        callback,
        errorCallback: (error) => {
          this.logger.error(`Stream subscription error for ${streamId}`, {
            subscriptionId,
            error: error.message
          });
        },
        isActive: true,
        reconnectAttempts: 0
      };

      this.subscriptions.set(subscriptionId, subscription);

      // Subscribe via WebSocket if available
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const subscribeMessage: WebSocketMessage = {
          type: 'subscribe',
          data: { streamIds: [streamId] },
          timestamp: Date.now()
        };
        this.websocket.send(JSON.stringify(subscribeMessage));
      }

      // Initialize metrics for this stream
      if (!this.streamMetrics.has(streamId)) {
        this.streamMetrics.set(streamId, {
          streamId,
          totalReports: 0,
          successfulReports: 0,
          failedReports: 0,
          averageLatency: 0,
          maxLatency: 0,
          minLatency: Number.MAX_SAFE_INTEGER,
          uptime: 100,
          lastUpdate: Date.now(),
          errorRate: 0
        });
      }

      this.systemMetrics.activeSubscriptions = this.subscriptions.size;
      
      this.logger.info(`Subscribed to stream ${streamId}`, { subscriptionId });
      return subscriptionId;

    } catch (error) {
      this.logger.error(`Failed to subscribe to stream ${streamId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DataStreamsError(
        `Failed to subscribe to stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SUBSCRIPTION_FAILED'
      );
    }
  }

  async unsubscribeFromStream(subscriptionId: string): Promise<void> {
    try {
      const subscription = this.subscriptions.get(subscriptionId);
      if (!subscription) {
        throw new DataStreamsError(`Subscription not found: ${subscriptionId}`, 'SUBSCRIPTION_NOT_FOUND');
      }

      // Unsubscribe via WebSocket if available
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        const unsubscribeMessage: WebSocketMessage = {
          type: 'unsubscribe',
          data: { streamIds: subscription.streamIds },
          timestamp: Date.now()
        };
        this.websocket.send(JSON.stringify(unsubscribeMessage));
      }

      subscription.isActive = false;
      this.subscriptions.delete(subscriptionId);
      this.systemMetrics.activeSubscriptions = this.subscriptions.size;

      this.logger.info(`Unsubscribed from stream subscription ${subscriptionId}`);

    } catch (error) {
      this.logger.error(`Failed to unsubscribe from ${subscriptionId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new DataStreamsError(
        `Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNSUBSCRIPTION_FAILED'
      );
    }
  }

  async getLatestReport(streamId: string): Promise<CryptoReport> {
    try {
      const startTime = Date.now();
      const cacheKey = `latest_report_${streamId}`;
      
      // Check cache first
      const cached = this.getFromCache<CryptoReport>(cacheKey);
      if (cached) {
        this.updateStreamMetrics(streamId, Date.now() - startTime, true);
        return cached;
      }

      const response = await this.httpClient.get(`/streams/${streamId}/reports/latest`);
      const report: CryptoReport = response.data.report;

      if (!report) {
        throw new StreamNotFoundError(streamId);
      }

      // Cache the result
      this.setCache(cacheKey, report, this.config.cacheExpiry);

      const latency = Date.now() - startTime;
      this.updateStreamMetrics(streamId, latency, true);
      this.systemMetrics.totalDataPoints++;

      this.logger.debug(`Retrieved latest report for stream ${streamId}`, { latency });
      return report;

    } catch (error) {
      const latency = Date.now() - Date.now();
      this.updateStreamMetrics(streamId, latency, false);
      
      this.logger.error(`Failed to get latest report for stream ${streamId}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof StreamNotFoundError) {
        throw error;
      }

      throw new APIConnectionError(
        `Failed to get latest report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getReports(streamIds: string[], timestamp?: number): Promise<ReportResponse> {
    try {
      const startTime = Date.now();
      const params: any = { streamIds };
      if (timestamp) {
        params.timestamp = timestamp;
      }

      const response = await this.httpClient.post('/streams/reports/bulk', params);
      const reportResponse: ReportResponse = response.data;

      const latency = Date.now() - startTime;
      streamIds.forEach(streamId => {
        this.updateStreamMetrics(streamId, latency, true);
      });

      this.systemMetrics.totalDataPoints += reportResponse.reports.length;
      this.logger.debug(`Retrieved ${reportResponse.reports.length} reports`, { latency });

      return reportResponse;

    } catch (error) {
      const latency = Date.now() - Date.now();
      streamIds.forEach(streamId => {
        this.updateStreamMetrics(streamId, latency, false);
      });

      this.logger.error('Failed to get reports', {
        streamIds,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new APIConnectionError(
        `Failed to get reports: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getMarketData(symbol: string): Promise<MarketDataPoint> {
    try {
      const streamId = CRYPTO_STREAM_IDS[symbol as keyof typeof CRYPTO_STREAM_IDS];
      if (!streamId) {
        throw new DataStreamsError(`Unsupported symbol: ${symbol}`, 'UNSUPPORTED_SYMBOL');
      }

      const report = await this.getLatestReport(streamId);
      
      const marketData: MarketDataPoint = {
        symbol,
        price: report.reportBlob.benchmarkPrice,
        bid: report.reportBlob.bid,
        ask: report.reportBlob.ask,
        volume24h: '0', // Would need additional data source
        change24h: '0', // Would need historical data
        timestamp: report.reportBlob.observationsTimestamp,
        source: 'data-streams'
      };

      return marketData;

    } catch (error) {
      this.logger.error(`Failed to get market data for ${symbol}`, {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  async verifyReport(report: CryptoReport): Promise<VerificationResult> {
    try {
      // Try to find appropriate verifier contract
      const verifierContract = Array.from(this.verifierContracts.values())[0];
      if (!verifierContract) {
        throw new VerificationError('No verifier contract available');
      }

      const reportData = ethers.getBytes(report.fullReport);
      const parameterPayload = '0x'; // Empty for basic verification

      const tx = await verifierContract.verify(reportData, parameterPayload);
      const receipt = await tx.wait();

      const result: VerificationResult = {
        isValid: receipt.status === 1,
        verifierResponse: receipt.logs[0]?.data || '0x',
        gasUsed: receipt.gasUsed ? Number(receipt.gasUsed) : undefined,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber
      };

      this.logger.info(`Report verification completed`, {
        feedId: report.feedId,
        isValid: result.isValid,
        gasUsed: result.gasUsed
      });

      return result;

    } catch (error) {
      this.logger.error('Report verification failed', {
        feedId: report.feedId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new VerificationError(
        `Report verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async getStreamMetrics(streamId: string): Promise<StreamMetrics> {
    const metrics = this.streamMetrics.get(streamId);
    if (!metrics) {
      throw new StreamNotFoundError(streamId);
    }
    return { ...metrics };
  }

  async getSystemMetrics(): Promise<SystemMetrics> {
    // Update cache hit rate
    const totalCacheRequests = this.systemMetrics.totalDataPoints;
    const cacheEntries = Array.from(this.cache.values());
    const cacheHits = cacheEntries.reduce((sum, entry) => sum + entry.hits, 0);
    this.systemMetrics.cacheHitRate = totalCacheRequests > 0 ? (cacheHits / totalCacheRequests) * 100 : 0;

    // Update system uptime
    this.systemMetrics.systemUptime = Date.now() - this.systemMetrics.systemUptime;

    return { ...this.systemMetrics };
  }

  private async initializeProviders(): Promise<void> {
    for (const [networkName, networkConfig] of Object.entries(DATA_STREAMS_NETWORKS)) {
      try {
        const provider = new JsonRpcProvider(
          networkConfig.rpcUrl + (process.env[`${networkName.toUpperCase()}_API_KEY`] || '')
        );
        this.providers.set(networkName, provider);

        // Initialize verifier contract
        const verifierContract = new Contract(
          networkConfig.verifierProxy,
          VERIFIER_PROXY_ABI,
          provider
        );
        this.verifierContracts.set(networkName, verifierContract);

        this.logger.info(`Initialized provider for ${networkName}`, {
          verifierProxy: networkConfig.verifierProxy
        });

      } catch (error) {
        this.logger.error(`Failed to initialize provider for ${networkName}`, {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  }

  private async initializeWebSocket(): Promise<void> {
    try {
      this.websocket = new WebSocket(this.config.websocketUrl, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      this.websocket.on('open', () => {
        this.logger.info('WebSocket connection established');
        this.systemMetrics.websocketConnections = 1;
        this.reconnectAttempts = 0;
      });

      this.websocket.on('message', (data: WebSocket.Data) => {
        this.handleWebSocketMessage(data.toString());
      });

      this.websocket.on('close', () => {
        this.logger.warn('WebSocket connection closed');
        this.systemMetrics.websocketConnections = 0;
        this.scheduleReconnect();
      });

      this.websocket.on('error', (error) => {
        this.logger.error('WebSocket error', { error: error.message });
      });

    } catch (error) {
      this.logger.error('Failed to initialize WebSocket', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private handleWebSocketMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      if (message.type === 'report') {
        const report: CryptoReport = message.data;
        
        // Update cache
        const cacheKey = `latest_report_${report.feedId}`;
        this.setCache(cacheKey, report, this.config.cacheExpiry);

        // Notify subscribers - Convert Map values to array
        const subscriptionArray = Array.from(this.subscriptions.values());
        for (const subscription of subscriptionArray) {
          if (subscription.isActive && subscription.streamIds.includes(report.feedId)) {
            try {
              subscription.callback(report);
              this.updateStreamMetrics(report.feedId, 0, true);
            } catch (error) {
              subscription.errorCallback(error as Error);
              this.updateStreamMetrics(report.feedId, 0, false);
            }
          }
        }
      }

    } catch (error) {
      this.logger.error('Failed to handle WebSocket message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        data: data.substring(0, 100) // Log first 100 chars for debugging
      });
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      this.reconnectAttempts++;
      
      setTimeout(() => {
        this.logger.info(`Attempting WebSocket reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.initializeWebSocket();
      }, delay);
    } else {
      this.logger.error('Max WebSocket reconnection attempts reached');
    }
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    entry.hits++;
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T, expiry: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiry,
      hits: 0
    });
  }

  private updateStreamMetrics(streamId: string, latency: number, success: boolean): void {
    let metrics = this.streamMetrics.get(streamId);
    if (!metrics) {
      metrics = {
        streamId,
        totalReports: 0,
        successfulReports: 0,
        failedReports: 0,
        averageLatency: 0,
        maxLatency: 0,
        minLatency: Number.MAX_SAFE_INTEGER,
        uptime: 100,
        lastUpdate: Date.now(),
        errorRate: 0
      };
      this.streamMetrics.set(streamId, metrics);
    }

    metrics.totalReports++;
    if (success) {
      metrics.successfulReports++;
      metrics.averageLatency = (metrics.averageLatency + latency) / 2;
      metrics.maxLatency = Math.max(metrics.maxLatency, latency);
      metrics.minLatency = Math.min(metrics.minLatency, latency);
    } else {
      metrics.failedReports++;
    }

    metrics.errorRate = (metrics.failedReports / metrics.totalReports) * 100;
    metrics.uptime = (metrics.successfulReports / metrics.totalReports) * 100;
    metrics.lastUpdate = Date.now();
  }

  private setupHttpInterceptors(): void {
    // Request interceptor for logging and metrics
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug('API Request', {
          method: config.method,
          url: config.url,
          params: config.params
        });
        return config;
      },
      (error) => {
        this.logger.error('API Request Error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging and metrics
    this.httpClient.interceptors.response.use(
      (response) => {
        this.logger.debug('API Response', {
          status: response.status,
          url: response.config.url
        });
        return response;
      },
      (error) => {
        this.logger.error('API Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          error: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  private startCacheCleanup(): void {
    // Clean up expired cache entries every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      const now = Date.now();
      let cleanedCount = 0;

      // Convert Map entries to array to avoid iterator issues
      const cacheEntries = Array.from(this.cache.entries());
      for (const [key, entry] of cacheEntries) {
        if (now > entry.expiry) {
          this.cache.delete(key);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.debug(`Cleaned up ${cleanedCount} expired cache entries`);
      }
    });
  }

  private startMetricsCollection(): void {
    // Update system metrics every minute
    cron.schedule('* * * * *', () => {
      this.systemMetrics.totalStreams = this.streamMetrics.size;
      
      // Calculate average response time across all streams
      const allMetrics = Array.from(this.streamMetrics.values());
      if (allMetrics.length > 0) {
        this.systemMetrics.averageResponseTime = 
          allMetrics.reduce((sum, m) => sum + m.averageLatency, 0) / allMetrics.length;
      }

      this.logger.debug('System metrics updated', this.systemMetrics);
    });
  }
} 