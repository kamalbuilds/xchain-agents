import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import { AgentRuntime, elizaLogger } from "@ai16z/eliza";

import { REST, Routes } from "discord.js";

interface EventMetadata {
    action?: string;
    analysis?: string;
    suggestion?: string;
    confidence?: number;
    context?: string;
}

interface EventContent {
    text?: string;
    action?: string;
    analysis?: string;
    suggestion?: string;
    thinking?: boolean;
    processing?: boolean;
    error?: string;
    confidence?: number;
    context?: string;
}

type EventType = 'error' | 'decision' | 'analysis' | 'suggestion' | 'processing' | 'message';

function determineEventType(content: EventContent): EventType {
    if (content.error) return 'error';
    if (content.action) return 'decision';
    if (content.analysis) return 'analysis';
    if (content.suggestion) return 'suggestion';
    if (content.thinking || content.processing) return 'processing';
    return 'message';
}

export function createApiRouter(agents: Map<string, AgentRuntime>) {
    const router = express.Router();

    // Enable CORS with specific options
    const corsOptions = {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    };

    // Apply CORS to all routes
    router.use(cors(corsOptions));
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello World!" });
    });

    router.get("/agents", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
        }));
        res.json({ agents: agentsList });
    });

    router.get("/agents/:agentId", (req, res) => {
        const agentId = req.params.agentId;
        const agent = agents.get(agentId);

        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }

        res.json({
            id: agent.agentId,
            character: agent.character,
        });
    });

    router.get("/agents/:agentId/channels", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = agents.get(agentId);

        if (!runtime) {
            res.status(404).json({ error: "Runtime not found" });
            return;
        }

        const API_TOKEN = runtime.getSetting("DISCORD_API_TOKEN") as string;
        const rest = new REST({ version: "10" }).setToken(API_TOKEN);

        try {
            const guilds = (await rest.get(Routes.userGuilds())) as Array<any>;

            res.json({
                id: runtime.agentId,
                guilds: guilds,
                serverCount: guilds.length,
            });
        } catch (error) {
            console.error("Error fetching guilds:", error);
            res.status(500).json({ error: "Failed to fetch guilds" });
        }
    });

    router.get("/events", async (req, res) => {
        try {
            console.log('Events endpoint called');
            const allEvents = [];
            elizaLogger.log('Fetching events for all agents...');
            console.log('Number of agents:', agents.size);

            for (const [agentId, agent] of agents.entries()) {
                console.log(`Processing agent ${agentId}`);
                elizaLogger.log(`Fetching events for agent ${agentId}...`);

                const rooms = await agent.databaseAdapter.getRoomsForParticipants([agentId]);
                console.log(`Found ${rooms.length} rooms for agent ${agentId}`);

                for (const roomId of rooms) {
                    try {
                        console.log(`Fetching messages for room ${roomId}`);
                        const agentEvents = await agent.messageManager.getMemories({
                            roomId,
                            count: 50,
                            unique: true
                        });

                        console.log(`Found ${agentEvents.length} events in room ${roomId}`);
                        elizaLogger.log(`Found ${agentEvents.length} events for agent ${agentId} in room ${roomId}`);

                        const events = agentEvents.map(msg => {
                            const content = msg.content as EventContent;
                            const type = determineEventType(content);
                            let title = content.text?.slice(0, 100) || 'No title';

                            // Add type-specific prefix to title
                            switch (type) {
                                case 'decision':
                                    title = `[Action] ${title}`;
                                    break;
                                case 'analysis':
                                    title = `[Analysis] ${title}`;
                                    break;
                                case 'suggestion':
                                    title = `[Suggestion] ${title}`;
                                    break;
                                case 'error':
                                    title = `[Error] ${title}`;
                                    break;
                            }

                            const currentAgent = agents.get(agentId);
                            const agentName = currentAgent?.character?.name || `Agent ${agentId.slice(0, 8)}`;

                            // Create metadata object with available fields
                            const metadata: EventMetadata = {};
                            if (content.action) metadata.action = content.action;
                            if (content.analysis) metadata.analysis = content.analysis;
                            if (content.suggestion) metadata.suggestion = content.suggestion;
                            if (content.confidence) metadata.confidence = content.confidence;
                            if (content.context) metadata.context = content.context;

                            return {
                                id: msg.id,
                                title,
                                timestamp: msg.createdAt,
                                type,
                                agentId,
                                agentName,
                                roomId,
                                details: content.text || '',
                                metadata
                            };
                        });

                        allEvents.push(...events);
                    } catch (roomError) {
                        console.error(`Error processing room ${roomId}:`, roomError);
                        elizaLogger.error(`Error fetching events for room ${roomId}:`, roomError);
                    }
                }
            }

            // Sort by timestamp, most recent first
            allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

            // Limit to most recent 50 events
            const recentEvents = allEvents.slice(0, 50);

            console.log(`Sending ${recentEvents.length} events to client`);
            elizaLogger.log(`Returning ${recentEvents.length} total events`);
            if (recentEvents.length > 0) {
                console.log('First event:', recentEvents[0]);
                elizaLogger.log('Sample event:', JSON.stringify(recentEvents[0], null, 2));
            }

            res.json({ events: recentEvents });
        } catch (error) {
            console.error('Error in events endpoint:', error);
            elizaLogger.error('Error fetching events:', error);
            res.status(500).json({
                error: 'Failed to fetch events',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });

    return router;
}
