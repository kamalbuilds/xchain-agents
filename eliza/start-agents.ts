import { AgentRuntime, Character, elizaLogger, settings } from "@ai16z/eliza";
import { SqliteDatabaseAdapter } from "@ai16z/adapter-sqlite";
import { DirectClientInterface } from "@ai16z/client-direct";
import { bootstrapPlugin } from "@ai16z/plugin-bootstrap";
import { createNodePlugin } from "@ai16z/plugin-node";
import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Start All 7 Cross-Chain Arbitrage AI Agents
 */
async function startAllAgents() {
    elizaLogger.info("🚀 Starting Cross-Chain AI Arbitrage Agent Swarm");
    
    const agentFiles = [
        "arbitrage-coordinator.character.json",
        "market-intelligence.character.json", 
        "cross-chain-bridge.character.json",
        "ai-computation.character.json",
        "automation.character.json",
        "randomization.character.json",
        "treasury.character.json"
    ];

    const agents = [];

    for (const agentFile of agentFiles) {
        try {
            // Load character configuration
            const characterPath = path.join(__dirname, "public characters", agentFile);
            const characterData = JSON.parse(fs.readFileSync(characterPath, "utf8"));
            
            // Fix plugin configuration
            const character: Character = {
                ...characterData,
                plugins: [bootstrapPlugin, createNodePlugin()],
                settings: {
                    ...characterData.settings,
                    secrets: {
                        OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
                        ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || "",
                        CHAINLINK_API_KEY: process.env.CHAINLINK_API_KEY || "",
                        ...characterData.settings?.secrets
                    }
                }
            };

            // Initialize database
            const db = new SqliteDatabaseAdapter(
                new Database(path.join(__dirname, "data", `${character.name}.db`))
            );

            // Get API token
            const token = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || "";
            if (!token) {
                elizaLogger.error(`❌ No API token for ${character.name}`);
                continue;
            }

            // Create runtime
            const runtime = new AgentRuntime({
                databaseAdapter: db,
                token,
                modelProvider: character.modelProvider || "anthropic",
                character,
                plugins: character.plugins,
            });

            await runtime.initialize();

            // Start direct client
            const client = new DirectClientInterface();
            client.start(runtime);

            agents.push({ character, runtime, client });
            elizaLogger.success(`✅ ${character.name} online`);

        } catch (error) {
            elizaLogger.error(`❌ Failed to start ${agentFile}:`, error.message);
        }
    }

    elizaLogger.success(`🎉 ${agents.length} agents online!`);
    return agents;
}

// Start if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    startAllAgents().catch(console.error);
}

export { startAllAgents }; 