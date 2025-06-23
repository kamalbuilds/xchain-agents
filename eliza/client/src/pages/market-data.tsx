import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MarketDataPoint {
  symbol: string;
  price: string;
  bid: string;
  ask: string;
  spread: number;
  change24h: number;
  volume24h: string;
  timestamp: number;
  source: string;
  confidence: number;
}

interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  market1: string;
  market2: string;
  price1: number;
  price2: number;
  spread: number;
  potential: number;
  confidence: number;
  timeRemaining: number;
  status: 'active' | 'expired' | 'executing';
}

interface PredictionMarket {
  id: string;
  title: string;
  category: string;
  probability: number;
  volume: string;
  liquidity: string;
  endDate: string;
  change24h: number;
  arbitrageOpportunity?: number;
}

// Mock real-time data hook
function useRealTimeData() {
  const [data, setData] = useState<MarketDataPoint[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time data updates
      const symbols = ['BTC', 'ETH', 'LINK', 'USDC', 'MATIC'];
      const newData = symbols.map(symbol => ({
        symbol,
        price: (Math.random() * 100000 + 20000).toFixed(2),
        bid: (Math.random() * 100000 + 19900).toFixed(2),
        ask: (Math.random() * 100000 + 20100).toFixed(2),
        spread: Math.random() * 0.5 + 0.1,
        change24h: (Math.random() - 0.5) * 10,
        volume24h: (Math.random() * 1000000000).toFixed(0),
        timestamp: Date.now(),
        source: 'Chainlink Data Streams',
        confidence: Math.random() * 0.2 + 0.8
      }));
      setData(newData);
      setLastUpdate(new Date());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return { data, lastUpdate };
}

function MarketDataCard({ data }: { data: MarketDataPoint }) {
  const isPositive = data.change24h >= 0;
  const spreadPercentage = ((parseFloat(data.ask) - parseFloat(data.bid)) / parseFloat(data.price)) * 100;

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.04] transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{data.symbol}</h3>
            <div className={`w-2 h-2 rounded-full ${data.confidence > 0.9 ? 'bg-green-500' : 'bg-yellow-500'}`} />
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Zap className="h-3 w-3" />
            <span>Live</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-xl font-bold">${parseFloat(data.price).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">24h Change</p>
            <div className={`flex items-center justify-end gap-1 ${
              isPositive ? 'text-green-400' : 'text-red-400'
            }`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-semibold">{Math.abs(data.change24h).toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Bid</p>
            <p className="font-medium">${parseFloat(data.bid).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Ask</p>
            <p className="font-medium">${parseFloat(data.ask).toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Spread</span>
            <span className="font-medium">{spreadPercentage.toFixed(3)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Confidence</span>
            <span className="font-medium text-green-400">{(data.confidence * 100).toFixed(1)}%</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Source: {data.source}
        </div>
      </CardContent>
    </Card>
  );
}

function ArbitrageOpportunityCard({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const statusColors = {
    active: 'bg-green-500',
    expired: 'bg-red-500',
    executing: 'bg-blue-500'
  };

  const statusIcons = {
    active: CheckCircle,
    expired: AlertTriangle,
    executing: Activity
  };

  const StatusIcon = statusIcons[opportunity.status];

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.04] transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />
            <h3 className="font-medium">{opportunity.symbol} Arbitrage</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColors[opportunity.status]}`} />
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{opportunity.market1}</p>
            <p className="font-semibold">${opportunity.price1.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{opportunity.market2}</p>
            <p className="font-semibold">${opportunity.price2.toLocaleString()}</p>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.08]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Spread</span>
            <span className="font-semibold text-green-400">{opportunity.spread.toFixed(2)}%</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">Potential Profit</span>
            <span className="font-semibold text-green-400">${opportunity.potential.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-muted-foreground">Confidence</span>
            <span className="font-semibold">{opportunity.confidence}%</span>
          </div>
        </div>

        {opportunity.status === 'active' && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>Expires in {Math.floor(opportunity.timeRemaining / 60)}m {opportunity.timeRemaining % 60}s</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PredictionMarketCard({ market }: { market: PredictionMarket }) {
  const isPositive = market.change24h >= 0;

  return (
    <Card className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.04] transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">{market.title}</h3>
            <p className="text-xs text-muted-foreground">{market.category}</p>
          </div>
          {market.arbitrageOpportunity && (
            <div className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">
              +{market.arbitrageOpportunity.toFixed(1)}% Arb
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{market.probability}%</div>
          <p className="text-xs text-muted-foreground">Probability</p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Volume</p>
            <p className="font-medium">${market.volume}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Liquidity</p>
            <p className="font-medium">${market.liquidity}</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">24h Change</span>
          <div className={`flex items-center gap-1 ${
            isPositive ? 'text-green-400' : 'text-red-400'
          }`}>
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{Math.abs(market.change24h).toFixed(1)}%</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Ends: {market.endDate}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MarketData() {
  const { data: marketData, lastUpdate } = useRealTimeData();

  const { data: arbitrageOpportunities } = useQuery({
    queryKey: ['arbitrage-opportunities'],
    queryFn: async (): Promise<ArbitrageOpportunity[]> => {
      // Mock arbitrage opportunities
      return [
        {
          id: '1',
          symbol: 'BTC',
          market1: 'Polymarket',
          market2: 'Kalshi',
          price1: 99450,
          price2: 102150,
          spread: 2.71,
          potential: 4250,
          confidence: 87,
          timeRemaining: 247,
          status: 'active'
        },
        {
          id: '2',
          symbol: 'ETH',
          market1: 'Ethereum',
          market2: 'Polygon',
          price1: 3420,
          price2: 3485,
          spread: 1.90,
          potential: 1850,
          confidence: 92,
          timeRemaining: 156,
          status: 'active'
        },
        {
          id: '3',
          symbol: 'LINK',
          market1: 'Binance',
          market2: 'Coinbase',
          price1: 23.45,
          price2: 23.89,
          spread: 1.88,
          potential: 890,
          confidence: 78,
          timeRemaining: 89,
          status: 'executing'
        }
      ];
    },
    refetchInterval: 15000
  });

  const { data: predictionMarkets } = useQuery({
    queryKey: ['prediction-markets'],
    queryFn: async (): Promise<PredictionMarket[]> => {
      return [
        {
          id: '1',
          title: 'BTC will reach $100K by year-end',
          category: 'Cryptocurrency',
          probability: 67,
          volume: '2.3M',
          liquidity: '890K',
          endDate: 'Dec 31, 2024',
          change24h: 3.2,
          arbitrageOpportunity: 2.1
        },
        {
          id: '2',
          title: 'Fed will cut rates in Q1 2025',
          category: 'Economics',
          probability: 78,
          volume: '1.8M',
          liquidity: '1.2M',
          endDate: 'Mar 31, 2025',
          change24h: -1.5
        },
        {
          id: '3',
          title: 'Trump wins 2024 election',
          category: 'Politics',
          probability: 52,
          volume: '15.7M',
          liquidity: '4.2M',
          endDate: 'Nov 5, 2024',
          change24h: 0.8,
          arbitrageOpportunity: 1.3
        }
      ];
    },
    refetchInterval: 30000
  });

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-400" />
            Real-Time Market Data
          </h1>
          <p className="text-muted-foreground">
            Live data from Chainlink Data Streams and prediction markets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-green-400 animate-spin" />
          <span className="text-sm text-green-400">
            Last update: {lastUpdate.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-base">Active Data Streams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {marketData.length}
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time price feeds
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-base">Arbitrage Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {arbitrageOpportunities?.filter(op => op.status === 'active').length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Active opportunities
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/[0.03] border-white/[0.08]">
          <CardHeader>
            <CardTitle className="text-base">Prediction Markets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {predictionMarkets?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              Monitored markets
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-8">
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            Live Market Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {marketData.map(data => (
              <MarketDataCard key={data.symbol} data={data} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-green-400" />
            Arbitrage Opportunities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {arbitrageOpportunities?.map(opportunity => (
              <ArbitrageOpportunityCard key={opportunity.id} opportunity={opportunity} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            Prediction Markets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {predictionMarkets?.map(market => (
              <PredictionMarketCard key={market.id} market={market} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
} 