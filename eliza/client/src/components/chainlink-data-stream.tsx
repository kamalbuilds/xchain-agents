import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Zap, TrendingUp, TrendingDown, Clock, Shield } from 'lucide-react';

interface DataStreamProps {
  streamId: string;
  symbol: string;
  feedId?: string;
  title?: string;
  className?: string;
}

interface StreamData {
  price: number;
  bid: number;
  ask: number;
  timestamp: number;
  confidence: number;
  change24h: number;
  verified: boolean;
}

export function ChainlinkDataStream({ 
  streamId, 
  symbol, 
  feedId, 
  title, 
  className = '' 
}: DataStreamProps) {
  const [data, setData] = useState<StreamData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    // Simulate real-time data stream connection
    setIsConnected(true);
    
    const updateData = () => {
      const basePrice = symbol === 'BTC' ? 97000 : 
                       symbol === 'ETH' ? 3400 : 
                       symbol === 'LINK' ? 23 : 100;
      
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      const price = basePrice * (1 + variation);
      
      setData({
        price,
        bid: price * 0.9995,
        ask: price * 1.0005,
        timestamp: Date.now(),
        confidence: 0.95 + Math.random() * 0.05,
        change24h: (Math.random() - 0.5) * 8, // ±4% change
        verified: true
      });
      setLastUpdate(new Date());
    };

    // Initial data
    updateData();
    
    // Update every 2 seconds
    const interval = setInterval(updateData, 2000);
    
    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [symbol]);

  if (!data) {
    return (
      <Card className={`bg-white/[0.03] border-white/[0.08] ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center h-24">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Zap className="h-4 w-4 animate-pulse" />
              <span className="text-sm">Connecting to data stream...</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isPositive = data.change24h >= 0;
  const spread = ((data.ask - data.bid) / data.price) * 100;

  return (
    <Card className={`bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.04] transition-colors ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title || symbol}</h3>
            {data.verified && (
              <Shield className="h-3 w-3 text-green-400" />
            )}
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <Zap className="h-3 w-3 text-green-400" />
          </div>
        </div>
        {feedId && (
          <p className="text-xs text-muted-foreground font-mono">
            Feed: {feedId.slice(0, 8)}...{feedId.slice(-6)}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-xl font-bold">
              ${data.price.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">24h Change</p>
            <div className={`flex items-center justify-end gap-1 ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-semibold">
                {Math.abs(data.change24h).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Bid</p>
            <p className="font-medium">
              ${data.bid.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Ask</p>
            <p className="font-medium">
              ${data.ask.toLocaleString(undefined, { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spread</span>
            <span className="font-medium">{spread.toFixed(3)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium text-green-400">
              {(data.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {lastUpdate && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Wrapper component for multiple data streams
export function DataStreamGrid({ 
  streams, 
  className = '' 
}: { 
  streams: Array<{
    streamId: string;
    symbol: string;
    feedId?: string;
    title?: string;
  }>;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
      {streams.map((stream) => (
        <ChainlinkDataStream
          key={stream.streamId}
          streamId={stream.streamId}
          symbol={stream.symbol}
          feedId={stream.feedId}
          title={stream.title}
        />
      ))}
    </div>
  );
} 