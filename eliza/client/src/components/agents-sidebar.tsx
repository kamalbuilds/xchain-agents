import { Loader2, Network, BarChart3, Wallet, TrendingUp, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";

interface Agent {
    id: string;
    name: string;
    description?: string;
}

export function AgentsSidebar() {
    const { agentId: currentAgentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const { data: agents, isLoading, error } = useQuery<Agent[]>({
        queryKey: ["agents"],
        queryFn: async () => {
            const res = await fetch("/api/agents");
            const data = await res.json();
            return data.agents;
        },
    });

    // Only navigate to first agent if we're on a chat page and no agent is selected
    useEffect(() => {
        if (location.pathname.includes('/chat') && !currentAgentId && agents && agents.length > 0) {
            navigate(`/app/chat/${agents[0].id}`);
        }
    }, [currentAgentId, agents, navigate, location]);

    const dashboardItems = [
        {
            path: '/app/agents',
            name: 'Agent Dashboard',
            icon: Network,
            description: 'Monitor all agents'
        },
        {
            path: '/app/market-data',
            name: 'Market Data',
            icon: BarChart3,
            description: 'Real-time data streams'
        },
        {
            path: '/app/portfolio',
            name: 'Portfolio',
            icon: Wallet,
            description: 'Multi-chain assets'
        },
        {
            path: '/app/analytics',
            name: 'Analytics',
            icon: TrendingUp,
            description: 'Performance metrics'
        }
    ];

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="h-14 flex items-center px-4 border-b">
                <span className="text-base font-semibold">Cross-Chain AI Arbitrage</span>
            </div>
            
            {/* Dashboard Navigation */}
            <div className="p-2 border-b border-white/[0.08]">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">DASHBOARD</p>
                <div className="space-y-1">
                    {dashboardItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`
                                    flex items-center gap-3 p-2
                                    rounded-lg transition-all duration-200
                                    hover:bg-accent cursor-pointer
                                    ${isActive ? 'bg-accent/50 text-foreground' : 'text-muted-foreground'}
                                `}
                            >
                                <Icon className="h-4 w-4" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {item.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {item.description}
                                    </p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Agents Section */}
            <div className="flex-1 p-2 space-y-2 overflow-auto">
                <p className="text-xs font-medium text-muted-foreground mb-2 px-2">AI AGENTS</p>
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="p-4 text-sm text-red-500 text-center">
                        Failed to load agents
                    </div>
                ) : agents?.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground text-center">
                        No agents available
                    </div>
                ) : (
                    agents?.map((agent) => (
                        <Link
                            key={agent.id}
                            to={`/app/chat/${agent.id}`}
                            className={`
                                flex items-center gap-3 p-3
                                rounded-lg transition-all duration-200
                                hover:bg-accent cursor-pointer
                                ${currentAgentId === agent.id ? 'bg-accent/50' : ''}
                            `}
                        >
                            <Bot className="h-4 w-4 text-blue-400" />
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${currentAgentId === agent.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {agent.name}
                                </p>
                                {agent.description && (
                                    <p className="text-xs text-muted-foreground truncate mt-1">
                                        {agent.description}
                                    </p>
                                )}
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
