import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Bot, 
  Activity, 
  TrendingUp, 
  GitBranch, 
  Brain, 
  Clock, 
  Dice6, 
  Wallet, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Zap,
  BarChart3,
  Network
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

interface AgentStatus {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'error' | 'maintenance';
  uptime: number;
  lastActivity: string;
  performance: {
    successRate: number;
    avgResponseTime: number;
    tasksCompleted: number;
    totalProfit?: number;
  };
  chainlinkServices: string[];
  currentTask?: string;
  metrics: Record<string, any>;
}

interface SystemMetrics {
  totalArbitrageOpportunities: number;
  totalProfit: number;
  crossChainSuccessRate: number;
  averageExecutionTime: number;
  activeSubscriptions: number;
  systemUptime: number;
}

const agentIcons = {
  'arbitrage-coordinator': TrendingUp,
  'market-intelligence': BarChart3,
  'cross-chain-bridge': GitBranch,
  'ai-computation': Brain,
  'automation': Clock,
  'randomization': Dice6,
  'treasury': Wallet
};

const statusColors = {
  active: 'bg-green-500',
  idle: 'bg-yellow-500',
  error: 'bg-red-500',
  maintenance: 'bg-blue-500'
};

const statusIcons = {
  active: CheckCircle,
  idle: Clock,
  error: XCircle,
  maintenance: AlertCircle
};

// Simple Badge component
function Badge({ children, variant = 'default', className = '' }: { 
  children: React.ReactNode; 
  variant?: 'default' | 'secondary'; 
  className?: string 
}) {
  const baseClasses = 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium';
  const variantClasses = variant === 'secondary' 
    ? 'bg-white/[0.08] text-muted-foreground' 
    : 'bg-blue-500/20 text-blue-400';
  
  return (
    <span className={`${baseClasses} ${variantClasses} ${className}`}>
      {children}
    </span>
  );
}

// Simple Tabs components
function Tabs({ defaultValue, className, children }: { 
  defaultValue: string; 
  className?: string; 
  children: React.ReactNode 
}) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <div className={className}>
      {React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as any, { activeTab, setActiveTab })
          : child
      )}
    </div>
  );
}

function TabsList({ className, children }: { 
  className?: string; 
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}) {
  return <div className={`flex ${className}`}>{children}</div>;
}

function TabsTrigger({ value, children, activeTab, setActiveTab }: { 
  value: string; 
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (value: string) => void;
}) {
  const isActive = activeTab === value;
  return (
    <button
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive 
          ? 'bg-white/[0.08] text-foreground' 
          : 'text-muted-foreground hover:text-foreground hover:bg-white/[0.04]'
      }`}
      onClick={() => setActiveTab?.(value)}
    >
      {children}
    </button>
  );
}

function TabsContent({ value, className, children, activeTab }: { 
  value: string; 
  className?: string; 
  children: React.ReactNode;
  activeTab?: string;
}) {
  if (activeTab !== value) return null;
  return <div className={className}>{children}</div>;
}

function AgentCard({ agent }: { agent: AgentStatus }) {
  const IconComponent = agentIcons[agent.id as keyof typeof agentIcons] || Bot;
  const StatusIcon = statusIcons[agent.status];
  
  return (
    <Card className="bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.04] transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <IconComponent className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-base">{agent.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{agent.type}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
            <StatusIcon className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Success Rate</p>
            <p className="font-semibold text-green-400">{agent.performance.successRate}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Uptime</p>
            <p className="font-semibold">{agent.uptime}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Response Time</p>
            <p className="font-semibold">{agent.performance.avgResponseTime}ms</p>
          </div>
          <div>
            <p className="text-muted-foreground">Tasks Completed</p>
            <p className="font-semibold">{agent.performance.tasksCompleted.toLocaleString()}</p>
          </div>
        </div>
        
        {agent.performance.totalProfit && (
          <div className="pt-2 border-t border-white/[0.08]">
            <p className="text-muted-foreground text-sm">Total Profit</p>
            <p className="font-semibold text-green-400 text-lg">
              ${agent.performance.totalProfit.toLocaleString()}
            </p>
          </div>
        )}
        
        <div className="flex flex-wrap gap-1">
          {agent.chainlinkServices.map(service => (
            <Badge key={service} variant="secondary" className="text-xs">
              {service}
            </Badge>
          ))}
        </div>
        
        {agent.currentTask && (
          <div className="pt-2 border-t border-white/[0.08]">
            <p className="text-muted-foreground text-xs">Current Task</p>
            <p className="text-sm font-medium truncate">{agent.currentTask}</p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          Last activity: {agent.lastActivity}
        </div>
      </CardContent>
    </Card>
  );
}

function SystemOverview({ metrics }: { metrics: SystemMetrics }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Arbitrage Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-400">
            {metrics.totalArbitrageOpportunities.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            +12% from last week
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Profit Generated
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">
            ${metrics.totalProfit.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            +8.3% from last month
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Cross-Chain Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">
            {metrics.crossChainSuccessRate}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            99.8% reliability
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average Execution Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-400">
            {metrics.averageExecutionTime}min
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            -15% improvement
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Active Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-400">
            {metrics.activeSubscriptions}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Data streams & automation
          </p>
        </CardContent>
      </Card>
      
      <Card className="bg-white/[0.03] border-white/[0.08]">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            System Uptime
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-400">
            {metrics.systemUptime}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last 30 days
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AgentsDashboard() {
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents-status'],
    queryFn: async (): Promise<AgentStatus[]> => {
      // Mock data - in production this would come from your API
      return [
        {
          id: 'arbitrage-coordinator',
          name: 'Arbitrage Coordinator',
          type: 'Orchestration Agent',
          status: 'active',
          uptime: 99.8,
          lastActivity: '2 minutes ago',
          performance: {
            successRate: 96.8,
            avgResponseTime: 1200,
            tasksCompleted: 15847,
            totalProfit: 2340000
          },
          chainlinkServices: ['CCIP', 'Data Streams', 'Functions'],
          currentTask: 'Analyzing BTC prediction market spread (3.2%)',
          metrics: {}
        },
        {
          id: 'market-intelligence',
          name: 'Market Intelligence',
          type: 'Analysis Agent',
          status: 'active',
          uptime: 99.9,
          lastActivity: '30 seconds ago',
          performance: {
            successRate: 87.0,
            avgResponseTime: 850,
            tasksCompleted: 45623,
            totalProfit: 890000
          },
          chainlinkServices: ['Data Streams', 'Functions'],
          currentTask: 'Processing 50K market data points for BTC prediction',
          metrics: {}
        },
        {
          id: 'cross-chain-bridge',
          name: 'Cross-Chain Bridge',
          type: 'Infrastructure Agent',
          status: 'active',
          uptime: 99.8,
          lastActivity: '1 minute ago',
          performance: {
            successRate: 99.8,
            avgResponseTime: 3200,
            tasksCompleted: 8934,
            totalProfit: 450000
          },
          chainlinkServices: ['CCIP', 'Data Streams'],
          currentTask: 'Bridging 50K USDC from Ethereum to Polygon',
          metrics: {}
        },
        {
          id: 'ai-computation',
          name: 'AI Computation',
          type: 'ML Processing Agent',
          status: 'active',
          uptime: 99.6,
          lastActivity: '45 seconds ago',
          performance: {
            successRate: 94.0,
            avgResponseTime: 18700,
            tasksCompleted: 12456,
            totalProfit: 670000
          },
          chainlinkServices: ['Functions', 'Data Streams'],
          currentTask: 'Running ML model: BTC price prediction (confidence: 87%)',
          metrics: {}
        },
        {
          id: 'automation',
          name: 'Automation',
          type: 'Scheduling Agent',
          status: 'active',
          uptime: 99.96,
          lastActivity: '5 minutes ago',
          performance: {
            successRate: 99.96,
            avgResponseTime: 14200,
            tasksCompleted: 50000,
            totalProfit: 127000
          },
          chainlinkServices: ['Automation', 'Data Streams'],
          currentTask: 'Next portfolio rebalancing in 1h 45m',
          metrics: {}
        },
        {
          id: 'randomization',
          name: 'Randomization',
          type: 'VRF Agent',
          status: 'active',
          uptime: 100.0,
          lastActivity: '3 minutes ago',
          performance: {
            successRate: 100.0,
            avgResponseTime: 47000,
            tasksCompleted: 15847
          },
          chainlinkServices: ['VRF', 'Data Streams'],
          currentTask: 'Generated VRF for execution timing: +127 seconds',
          metrics: {}
        },
        {
          id: 'treasury',
          name: 'Treasury',
          type: 'Risk Management Agent',
          status: 'active',
          uptime: 99.7,
          lastActivity: '1 minute ago',
          performance: {
            successRate: 98.9,
            avgResponseTime: 2100,
            tasksCompleted: 7823,
            totalProfit: 4847293
          },
          chainlinkServices: ['Data Feeds', 'Data Streams'],
          currentTask: 'Monitoring $4.8M portfolio across 4 chains',
          metrics: {}
        }
      ];
    },
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: async (): Promise<SystemMetrics> => {
      return {
        totalArbitrageOpportunities: 15000,
        totalProfit: 2300000,
        crossChainSuccessRate: 99.8,
        averageExecutionTime: 3.7,
        activeSubscriptions: 47,
        systemUptime: 99.94
      };
    },
    refetchInterval: 60000 // Refetch every minute
  });

  if (agentsLoading || !agents || !systemMetrics) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 animate-spin" />
          <span>Loading agent status...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Network className="h-6 w-6 text-blue-400" />
            Multi-Agent System Dashboard
          </h1>
          <p className="text-muted-foreground">
            Real-time monitoring of Chainlink-powered arbitrage agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-green-400" />
          <span className="text-sm text-green-400">All Systems Operational</span>
        </div>
      </div>

      <SystemOverview metrics={systemMetrics} />

      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Agent Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="chainlink">Chainlink Services</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="performance" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/[0.03] border-white/[0.08]">
              <CardHeader>
                <CardTitle>Success Rates by Agent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <span className="text-sm">{agent.name}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-white/[0.08] rounded-full h-2">
                          <div 
                            className="bg-green-400 h-2 rounded-full"
                            style={{ width: `${agent.performance.successRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12">
                          {agent.performance.successRate}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/[0.03] border-white/[0.08]">
              <CardHeader>
                <CardTitle>Response Times</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map(agent => (
                    <div key={agent.id} className="flex items-center justify-between">
                      <span className="text-sm">{agent.name}</span>
                      <span className="text-sm font-medium">
                        {agent.performance.avgResponseTime}ms
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="chainlink" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {['CCIP', 'Data Streams', 'Functions', 'VRF', 'Automation', 'Data Feeds'].map(service => {
              const agentsUsingService = agents.filter(agent => 
                agent.chainlinkServices.includes(service)
              );
              
              return (
                <Card key={service} className="bg-white/[0.03] border-white/[0.08]">
                  <CardHeader>
                    <CardTitle className="text-base">{service}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {agentsUsingService.length} agents using this service
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {agentsUsingService.map(agent => (
                        <div key={agent.id} className="flex items-center justify-between">
                          <span className="text-sm">{agent.name}</span>
                          <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 