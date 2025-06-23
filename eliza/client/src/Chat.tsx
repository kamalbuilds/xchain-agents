import { useState, useRef, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import "./App.css";

type TextResponse = {
    text: string;
    user: string;
};

interface Agent {
    id: string;
    name: string;
}

export default function Chat() {
    const { agentId } = useParams();
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState<TextResponse[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch agent details
    const { data: agent } = useQuery<Agent>({
        queryKey: ["agent", agentId],
        queryFn: async () => {
            const res = await fetch(`/api/agents/${agentId}`);
            const data = await res.json();
            return { id: data.id, name: data.character.name };
        },
        enabled: !!agentId,
    });

    // Clear messages when agent changes
    useEffect(() => {
        setMessages([]);
    }, [agentId]);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [scrollToBottom]);

    const mutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await fetch(`/api/${agentId}/message`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    userId: "user",
                    roomId: `default-room-${agentId}`,
                }),
            });
            return res.json() as Promise<TextResponse[]>;
        },
        onSuccess: (data) => {
            setMessages((prev) => [...prev, ...data]);
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMessage: TextResponse = {
            text: input,
            user: "user",
        };
        setMessages((prev) => [...prev, userMessage]);

        mutation.mutate(input);
        setInput("");
    };

    return (
        <div className="flex flex-col h-full w-full">
            {/* Agent header */}
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex items-center h-12 px-4">
                    <span className="font-medium">
                        {agent?.name || 'Loading...'}
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="max-w-3xl mx-auto space-y-4">
                    {messages.length > 0 ? (
                        messages.map((message, idx) => (
                            <div
                                key={`${message.user}-${idx}-${message.text}`}
                                className={`flex ${
                                    message.user === "user"
                                        ? "justify-end"
                                        : "justify-start"
                                }`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                        message.user === "user"
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted"
                                    }`}
                                >
                                    {message.text}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground">
                            No messages yet. Start a conversation with {agent?.name || 'the agent'}!
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            <div className="sticky bottom-0 border-t p-4 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="max-w-3xl mx-auto">
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={`Message ${agent?.name || 'agent'}...`}
                            className="flex-1"
                            disabled={mutation.isPending}
                        />
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "..." : "Send"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
