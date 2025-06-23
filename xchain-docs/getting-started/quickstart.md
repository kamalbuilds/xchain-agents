---
icon: bullseye-arrow
---

# ⚡ Quickstart Guide
## Get up and running with the Chainlink Multi-Agent Swarm in minutes

## 🚀 **Prerequisites**

Before you begin, ensure you have the following installed:

### **Development Environment**
- **Node.js v18+** - Runtime environment
- **pnpm** - Package manager (preferred over npm)
- **Git** - Version control
- **Docker** - Containerization (optional)

### **Blockchain Tools**
- **MetaMask** - Wallet browser extension
- **Hardhat** - Smart contract development framework
- **LINK Tokens** - Required for Chainlink services

### **API Keys & Accounts**
- **Chainlink Node Access** (for production)
- **Polymarket API Key**
- **OpenAI API Key** (for AI features)
- **RPC Endpoints** for supported networks

## 📦 **Installation**

### **1. Clone the Repository**

```bash
git clone https://github.com/kamalbuilds/xchain-agents.git
cd xchain-agents
```

### **2. Install Dependencies**

```bash
# Install all dependencies for the monorepo
pnpm install

# Navigate to specific packages
cd eliza && pnpm install
cd ../contract && pnpm install
```

### **3. Environment Setup**

Create environment files for both Eliza agents and smart contracts:

```bash
# Copy environment templates
cp eliza/.env.example eliza/.env
cp contract/.env.example contract/.env
```

### **4. Configure Environment Variables**

#### **Eliza Configuration (`eliza/.env`)**
```bash
# Chainlink Services
CHAINLINK_NODE_URL=your_chainlink_node_url
CHAINLINK_API_KEY=your_api_key
CHAINLINK_API_SECRET=your_api_secret

# Blockchain Networks
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-api-key
ARBITRUM_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/your-api-key
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-api-key
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Private Keys (Use test keys only!)
ETHEREUM_PRIVATE_KEY=your_ethereum_test_private_key
POLYGON_PRIVATE_KEY=your_polygon_test_private_key
ARBITRUM_PRIVATE_KEY=your_arbitrum_test_private_key

# External APIs
POLYMARKET_API_KEY=your_polymarket_key
POLYMARKET_SECRET=your_polymarket_secret
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/xchain_agents
REDIS_URL=redis://localhost:6379

# AI Services
ELIZA_LOG_LEVEL=info
ELIZA_SERVER_PORT=3000
```

#### **Contract Configuration (`contract/.env`)**
```bash
# Network RPC URLs
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/your-api-key
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/your-api-key
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/your-api-key
ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/your-api-key
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Deployment Private Key
PRIVATE_KEY=your_deployment_private_key

# Chainlink Configuration
LINK_TOKEN_SEPOLIA=0x779877A7B0D9E8603169DdbD7836e478b4624789
CCIP_ROUTER_SEPOLIA=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
VRF_COORDINATOR_SEPOLIA=0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
FUNCTIONS_ROUTER_SEPOLIA=0xb83E47C2bC239B3bf370bc41e1459A34b41238D0

# Etherscan API Keys (for verification)
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

## 🏗️ **Quick Setup**

### **Option 1: Full Development Setup**

```bash
# 1. Start local blockchain (optional)
npx hardhat node

# 2. Deploy smart contracts to testnets
cd contract
npm run deploy:sepolia
npm run deploy:base-sepolia
npm run deploy:polygon-amoy

# 3. Start Eliza agents
cd ../eliza
pnpm build
pnpm start

# 4. Start web dashboard (if available)
cd ../dashboard
npm run dev
```

### **Option 2: Docker Quick Start**

```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f eliza
```

### **Option 3: Testing Environment**

```bash
# Deploy to local Hardhat network
cd contract
npm run deploy:local

# Run test suite
npm run test

# Start agents in test mode
cd ../eliza
pnpm test
```

## 🎯 **First Steps**

### **1. Get Test Tokens**

Before you can use the system, you'll need test tokens:

```bash
# Get testnet ETH from faucets
# Sepolia: https://sepoliafaucet.com/
# Base Sepolia: https://bridge.base.org/
# Polygon Amoy: https://faucet.polygon.technology/
# Arbitrum Sepolia: https://bridge.arbitrum.io/

# Get LINK tokens from Chainlink faucet
# https://faucets.chain.link/
```

### **2. Deploy Your First Contract**

```bash
cd contract

# Compile contracts
npm run compile

# Deploy to Sepolia testnet
npm run deploy:sepolia

# Verify contracts
npm run verify:sepolia
```

### **3. Start Your First Agent**

```bash
cd eliza

# Start the Arbitrage Coordinator agent
node --experimental-modules --loader ts-node/esm src/index.ts \
  --character ./characters/arbitrage-coordinator.character.json
```

### **4. Test Market Scanning**

Open a new terminal and test the system:

```bash
# Test market data retrieval
curl -X GET "http://localhost:3000/api/markets/scan" \
  -H "Content-Type: application/json"

# Test arbitrage opportunity detection
curl -X POST "http://localhost:3000/api/predictions/btc-100k" \
  -H "Content-Type: application/json" \
  -d '{"timeHorizon": "1h"}'
```

## 🧪 **Verification**

### **1. Contract Verification**

```bash
# Check contract deployment status
npx hardhat run scripts/verify-deployment.ts --network sepolia

# Expected output:
# ✅ ArbitrageCoordinator deployed at: 0x1234...
# ✅ PredictionMarketDataStreams deployed at: 0x5678...
# ✅ All Chainlink integrations active
```

### **2. Agent Health Check**

```bash
# Check agent status
curl -X GET "http://localhost:3000/health"

# Expected response:
# {
#   "status": "healthy",
#   "agents": {
#     "arbitrageCoordinator": "online",
#     "marketIntelligence": "online",
#     "crossChainBridge": "online"
#   },
#   "chainlinkServices": {
#     "ccip": "connected",
#     "functions": "connected",
#     "vrf": "connected"
#   }
# }
```

### **3. Test Arbitrage Detection**

```bash
# Trigger a market scan
curl -X POST "http://localhost:3000/api/agents/arbitrage-coordinator/scan" \
  -H "Content-Type: application/json"

# Check for opportunities
curl -X GET "http://localhost:3000/api/opportunities" \
  -H "Content-Type: application/json"
```

## 🎮 **Interactive Demo**

### **Web Dashboard**

If you have the web dashboard available:

1. Open http://localhost:3000 in your browser
2. Connect your MetaMask wallet
3. Switch to Sepolia testnet
4. Click "Scan Markets" to find arbitrage opportunities
5. Select an opportunity and execute a test strategy

### **Discord Bot**

If you have Discord integration:

1. Invite the bot to your Discord server
2. Use commands like:
   - `/scan markets` - Find arbitrage opportunities
   - `/portfolio` - Check your positions
   - `/execute strategy BTC-100K 100` - Execute a strategy

## 🚨 **Common Issues & Solutions**

### **Environment Issues**

```bash
# Node.js version issues
nvm use 18
nvm install 18

# pnpm not found
npm install -g pnpm

# Permission errors
sudo chown -R $(whoami) ~/.pnpm
```

### **Blockchain Connection Issues**

```bash
# RPC connection failed
# Solution: Check your RPC URLs and API keys

# Insufficient funds
# Solution: Get testnet tokens from faucets

# Gas estimation failed
# Solution: Increase gas limit in hardhat.config.ts
```

### **Agent Issues**

```bash
# Agent won't start
# Check: Environment variables, database connection, API keys

# Chainlink services unavailable
# Check: LINK token balance, subscription funding

# Memory issues
# Solution: Increase NODE_OPTIONS="--max-old-space-size=4096"
```

## 📚 **Next Steps**

### **Explore the Documentation**

- **🏗️ [System Architecture](../architecture/overview.md)** - Understand the system design
- **🤖 [Agent Development](../eliza/framework-overview.md)** - Learn about AI agents
- **📝 [Smart Contracts](../contracts/contract-overview.md)** - Explore the contract layer
- **🔗 [Chainlink Integration](../chainlink/services-overview.md)** - Deep dive into services

### **Build Your First Feature**

1. **Custom Agent**: Create a specialized trading agent
2. **New Strategy**: Implement a custom arbitrage strategy
3. **Market Integration**: Add support for new prediction markets
4. **Analytics Dashboard**: Build custom performance tracking

### **Join the Community**

- **Discord**: [Join our development community](https://discord.gg/xchain-agents)
- **GitHub**: [Contribute to the project](https://github.com/kamalbuilds/xchain-agents)
- **Twitter**: [Follow updates](https://twitter.com/XChainAgents)

## 🎯 **Development Workflow**

```bash
# 1. Make changes to agents or contracts
# 2. Test locally
npm run test

# 3. Deploy to testnets
npm run deploy:sepolia

# 4. Verify functionality
npm run verify:sepolia

# 5. Monitor performance
npm run monitor

# 6. Submit PR for review
git add .
git commit -m "feat: add new arbitrage strategy"
git push origin feature/new-strategy
```

---

**🎉 Congratulations!** You now have the Chainlink Multi-Agent Swarm running locally. Start exploring arbitrage opportunities across multiple blockchains with the power of AI and Chainlink's infrastructure!

**Need help?** Check out our [troubleshooting guide](../reference/troubleshooting.md) or join our community Discord.
