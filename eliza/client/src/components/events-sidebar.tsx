import { ScrollText, Loader2, AlertCircle, Brain, Lightbulb, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventMetadata {
    action?: string;
    analysis?: string;
    suggestion?: string;
    confidence?: number;
    context?: string;
}

interface Event {
    id: string;
    title: string;
    timestamp: string | number;
    type: 'error' | 'decision' | 'analysis' | 'suggestion' | 'processing' | 'message';
    agentId: string;
    agentName?: string;
    roomId: string;
    details?: string;
    metadata?: EventMetadata;
}

export function EventsSidebar() {
    const { data: events, isLoading, error } = useQuery<Event[]>({
        queryKey: ["events"],
        queryFn: async () => {
            try {
                const res = await fetch("http://localhost:3000/events", {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors'
                });

                if (!res.ok) {
                    const errorText = await res.text();
                    console.error('Server response:', errorText);
                    throw new Error(`HTTP error! status: ${res.status}, message: ${errorText}`);
                }
                const data = await res.json();
                console.log('Events API response:', data);
                return data.events || [];
            } catch (error) {
                console.error('Error fetching events:', error);
                throw error;
            }
        },
        refetchInterval: 5000,
        retry: 3,
        retryDelay: 1000,
    });

    const formatTime = (timestamp: string | number) => {
        try {
            const date = new Date(typeof timestamp === 'string' ? Number.parseInt(timestamp) : timestamp);

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            let datePart = '';
            if (date.toDateString() === today.toDateString()) {
                datePart = 'Today';
            } else if (date.toDateString() === yesterday.toDateString()) {
                datePart = 'Yesterday';
            } else {
                datePart = date.toLocaleDateString();
            }

            const timePart = date.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });

            return `${datePart} ${timePart}`;
        } catch (error) {
            console.error('Error formatting timestamp:', error);
            return 'Invalid time';
        }
    };

    const eventTypeConfig = {
        error: {
            color: 'text-red-500',
            bgColor: 'bg-red-500/15',
            label: 'Error',
            icon: AlertCircle
        },
        processing: {
            color: 'text-blue-500',
            bgColor: 'bg-blue-500/15',
            label: 'Processing',
            icon: Loader2
        },
        analysis: {
            color: 'text-purple-500',
            bgColor: 'bg-purple-500/15',
            label: 'Analysis',
            icon: Brain
        },
        suggestion: {
            color: 'text-green-500',
            bgColor: 'bg-green-500/15',
            label: 'Suggestion',
            icon: Lightbulb
        },
        decision: {
            color: 'text-orange-500',
            bgColor: 'bg-orange-500/15',
            label: 'Decision',
            icon: Zap
        },
        message: {
            color: 'text-muted-foreground',
            bgColor: 'bg-muted',
            label: 'Message',
            icon: ScrollText
        }
    };

    const getEventStyle = (type: Event['type']) => eventTypeConfig[type] || eventTypeConfig.message;

    if (error) {
        return (
            <div className="h-full flex flex-col bg-background">
                <div className="h-12 flex items-center px-4 border-b">
                    <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
                    <span className="text-sm font-semibold">Events</span>
                </div>
                <div className="flex-1 p-4 text-sm text-red-500">
                    Error loading events: {error instanceof Error ? error.message : 'Unknown error'}
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-background">
            <div className="h-12 flex items-center px-4 border-b">
                <ScrollText className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm font-semibold">Events Log</span>
            </div>

            <div className="flex-1 p-2 space-y-2 overflow-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center h-32">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                ) : !events || events.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground">
                        <ScrollText className="h-8 w-8 mb-2 opacity-50" />
                        <p>No events recorded yet</p>
                    </div>
                ) : (
                    <TooltipProvider>
                        {events.map((event) => {
                            const style = getEventStyle(event.type);
                            const Icon = style.icon;
                            return (
                                <Tooltip key={event.id}>
                                    <TooltipTrigger asChild>
                                        <div className={`
                                            group flex items-start gap-3 p-3
                                            rounded-lg transition-all duration-200
                                            hover:bg-accent cursor-pointer
                                            ${style.bgColor}
                                            ${event.type === 'error' ? 'border border-red-500/20' : ''}
                                        `}>
                                            <Icon className={`h-5 w-5 mt-0.5 ${style.color} ${event.type === 'processing' ? 'animate-spin' : ''}`} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className={`
                                                        text-xs font-medium px-2 py-0.5 rounded-full
                                                        ${style.color} ${style.bgColor}
                                                    `}>
                                                        {style.label}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {formatTime(event.timestamp)}
                                                    </span>
                                                </div>
                                                <p className="mt-1 font-medium text-sm truncate text-foreground">
                                                    {event.title}
                                                </p>
                                                {event.agentId && (
                                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                        <span className="font-medium">
                                                            {event.agentName || `Agent ${event.agentId.slice(0, 8)}`}
                                                        </span>
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="right"
                                        className="max-w-[300px] bg-popover border border-border shadow-lg"
                                    >
                                        <div className="space-y-2">
                                            <p className="font-medium text-popover-foreground">
                                                {event.title}
                                            </p>
                                            {event.details && (
                                                <p className="text-sm text-popover-foreground/90">
                                                    {event.details}
                                                </p>
                                            )}
                                            {event.metadata && (
                                                <div className="space-y-1.5 border-t border-border/50 pt-2 mt-2">
                                                    {event.metadata.context && (
                                                        <p className="text-xs text-popover-foreground/75">
                                                            <span className="font-medium">Context:</span> {event.metadata.context}
                                                        </p>
                                                    )}
                                                    {event.metadata.confidence && (
                                                        <p className="text-xs text-popover-foreground/75">
                                                            <span className="font-medium">Confidence:</span> {(event.metadata.confidence * 100).toFixed(1)}%
                                                        </p>
                                                    )}
                                                    {event.metadata.action && (
                                                        <p className="text-xs text-popover-foreground/75">
                                                            <span className="font-medium">Action:</span> {event.metadata.action}
                                                        </p>
                                                    )}
                                                    {event.metadata.analysis && (
                                                        <p className="text-xs text-popover-foreground/75">
                                                            <span className="font-medium">Analysis:</span> {event.metadata.analysis}
                                                        </p>
                                                    )}
                                                    {event.metadata.suggestion && (
                                                        <p className="text-xs text-popover-foreground/75">
                                                            <span className="font-medium">Suggestion:</span> {event.metadata.suggestion}
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                            <div className="text-xs space-y-1 text-popover-foreground/75 border-t border-border/50 pt-2">
                                                <p>Type: {style.label}</p>
                                                <p>Agent: {event.agentName || `Agent ${event.agentId.slice(0, 8)}`}</p>
                                                <p>Room: {event.roomId}</p>
                                                <p>Time: {formatTime(event.timestamp)}</p>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </TooltipProvider>
                )}
            </div>
        </div>
    );
}
