# 🛠️ Installation Guide
## Complete Setup Instructions for Chainlink Multi-Agent Swarm

## 📋 **Prerequisites**

Before installing the Chainlink Multi-Agent Swarm, ensure your system meets these requirements:

### **System Requirements**
- **Operating System**: macOS, Linux, or Windows (WSL2 recommended)
- **Memory**: Minimum 8GB RAM, 16GB recommended
- **Storage**: At least 10GB free space
- **Network**: Stable internet connection for blockchain interactions

### **Required Software**

#### **Node.js & Package Managers**
```bash
# Install Node.js v18 or higher
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# Install pnpm (recommended)
npm install -g pnpm

# Verify installations
node --version  # Should be v18+
pnpm --version
```

#### **Git Version Control**
```bash
# macOS
brew install git

# Ubuntu/Debian
sudo apt update && sudo apt install git

# Windows (use Git for Windows)
# Download from: https://git-scm.com/download/win
```

#### **Docker (Optional but Recommended)**
```bash
# macOS
brew install docker docker-compose

# Ubuntu/Debian
sudo apt install docker.io docker-compose
sudo usermod -aG docker $USER

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

### **Blockchain Tools**

#### **MetaMask Wallet**
1. Install MetaMask browser extension from [metamask.io](https://metamask.io)
2. Create a new wallet or import existing one
3. Add testnet networks (we'll configure these later)

#### **Hardhat Development Environment**
```bash
# Will be installed with project dependencies
# No separate installation needed
```

## 📦 **Installation Steps**

### **Step 1: Clone the Repository**

```bash
# Clone the main repository
git clone https://github.com/kamalbuilds/xchain-agents.git
cd xchain-agents

# Verify directory structure
ls -la
# Should see: eliza/, contract/, xchain-docs/, README.md, etc.
```

### **Step 2: Install Dependencies**

#### **Install All Dependencies**
```bash
# Install root dependencies
pnpm install

# Install Eliza dependencies
cd eliza
pnpm install
cd ..

# Install contract dependencies
cd contract
npm install
cd ..
```

#### **Verify Installations**
```bash
# Check Eliza installation
cd eliza && pnpm run build
cd ..

# Check contract compilation
cd contract && npm run compile
cd ..
```

### **Step 3: Environment Configuration**

#### **Create Environment Files**
```bash
# Copy environment templates
cp eliza/.env.example eliza/.env
cp contract/.env.example contract/.env
```

#### **Configure Eliza Environment**
Edit `eliza/.env`:

```bash
# Blockchain RPC URLs (Get from Alchemy, Infura, or public RPCs)
ETHEREUM_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
ARBITRUM_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Private Keys (TESTNET ONLY - Never use mainnet keys!)
ETHEREUM_PRIVATE_KEY=your_ethereum_test_private_key
POLYGON_PRIVATE_KEY=your_polygon_test_private_key
ARBITRUM_PRIVATE_KEY=your_arbitrum_test_private_key
BASE_PRIVATE_KEY=your_base_test_private_key
AVALANCHE_PRIVATE_KEY=your_avalanche_test_private_key

# API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
POLYMARKET_API_KEY=your_polymarket_api_key
POLYMARKET_SECRET=your_polymarket_secret

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/xchain_agents
REDIS_URL=redis://localhost:6379

# Chainlink Configuration
CHAINLINK_NODE_URL=your_chainlink_node_url
CHAINLINK_API_KEY=your_chainlink_api_key
CHAINLINK_API_SECRET=your_chainlink_api_secret

# Application Settings
ELIZA_LOG_LEVEL=info
ELIZA_SERVER_PORT=3000
```

#### **Configure Contract Environment**
Edit `contract/.env`:

```bash
# Network RPC URLs
ETHEREUM_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
BASE_SEPOLIA_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
POLYGON_AMOY_RPC_URL=https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
ARBITRUM_SEPOLIA_RPC_URL=https://arb-sepolia.g.alchemy.com/v2/YOUR_API_KEY
AVALANCHE_FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Deployment Private Key
PRIVATE_KEY=your_deployment_private_key

# Chainlink Service Addresses (Testnets)
# Ethereum Sepolia
LINK_TOKEN_SEPOLIA=0x779877A7B0D9E8603169DdbD7836e478b4624789
CCIP_ROUTER_SEPOLIA=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59
VRF_COORDINATOR_SEPOLIA=0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625
FUNCTIONS_ROUTER_SEPOLIA=0xb83E47C2bC239B3bf370bc41e1459A34b41238D0

# Base Sepolia
LINK_TOKEN_BASE_SEPOLIA=0xE4aB69C077896252FAFBD49EFD26B5D171A32410
CCIP_ROUTER_BASE_SEPOLIA=0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93
VRF_COORDINATOR_BASE_SEPOLIA=0x4b09e658ed251bcafeebbc69c9e99b3c
FUNCTIONS_ROUTER_BASE_SEPOLIA=0xf9B8fc078197181C841c296C876945aaa425B278

# Verification API Keys
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
SNOWTRACE_API_KEY=your_snowtrace_api_key
```

### **Step 4: Database Setup**

#### **PostgreSQL Installation**
```bash
# macOS
brew install postgresql
brew services start postgresql

# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
createdb xchain_agents
```

#### **Redis Installation**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### **Database Migration**
```bash
cd eliza
pnpm run db:migrate
pnpm run db:seed  # Optional: Add sample data
```

### **Step 5: Get Test Tokens**

#### **Get Testnet ETH**
Visit these faucets to get testnet ETH:

- **Ethereum Sepolia**: [https://sepoliafaucet.com/](https://sepoliafaucet.com/)
- **Base Sepolia**: [https://bridge.base.org/](https://bridge.base.org/)
- **Polygon Amoy**: [https://faucet.polygon.technology/](https://faucet.polygon.technology/)
- **Arbitrum Sepolia**: [https://bridge.arbitrum.io/](https://bridge.arbitrum.io/)
- **Avalanche Fuji**: [https://faucet.avax.network/](https://faucet.avax.network/)

#### **Get LINK Tokens**
Visit the Chainlink faucet: [https://faucets.chain.link/](https://faucets.chain.link/)

Request LINK tokens for each testnet you plan to use.

### **Step 6: Network Configuration**

#### **Add Networks to MetaMask**

**Ethereum Sepolia:**
- Network Name: Ethereum Sepolia
- RPC URL: https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- Chain ID: 11155111
- Currency Symbol: ETH
- Block Explorer: https://sepolia.etherscan.io

**Base Sepolia:**
- Network Name: Base Sepolia
- RPC URL: https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
- Chain ID: 84532
- Currency Symbol: ETH
- Block Explorer: https://sepolia.basescan.org

**Polygon Amoy:**
- Network Name: Polygon Amoy
- RPC URL: https://polygon-amoy.g.alchemy.com/v2/YOUR_API_KEY
- Chain ID: 80002
- Currency Symbol: MATIC
- Block Explorer: https://amoy.polygonscan.com

## ✅ **Verification**

### **Test Installation**

#### **1. Verify Eliza Setup**
```bash
cd eliza
pnpm run test:basic
# Should pass all basic tests
```

#### **2. Verify Contract Compilation**
```bash
cd contract
npm run compile
# Should compile without errors
```

#### **3. Test Database Connection**
```bash
cd eliza
pnpm run db:test
# Should connect successfully
```

#### **4. Test API Keys**
```bash
cd eliza
pnpm run test:apis
# Should verify all API connections
```

### **Common Installation Issues**

#### **Node.js Version Issues**
```bash
# If you get version errors
nvm install 18
nvm use 18
npm install -g pnpm
```

#### **Permission Errors**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) ~/.pnpm
```

#### **Database Connection Issues**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database if needed
dropdb xchain_agents
createdb xchain_agents
cd eliza && pnpm run db:migrate
```

#### **Docker Issues**
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
# Log out and back in

# Restart Docker
sudo systemctl restart docker
```

## 🚀 **Next Steps**

After successful installation:

1. **[Environment Setup](environment-setup.md)** - Configure your development environment
2. **[Dependencies Guide](dependencies.md)** - Understand project dependencies
3. **[Quickstart Guide](quickstart.md)** - Deploy and run your first arbitrage

## 🆘 **Getting Help**

If you encounter issues during installation:

- **Documentation**: Check our [troubleshooting guide](../reference/troubleshooting.md)
- **Discord**: Join our [community Discord](https://discord.gg/xchain-agents)
- **GitHub Issues**: Report bugs on [GitHub](https://github.com/kamalbuilds/xchain-agents/issues)

---

**Installation complete!** 🎉 You're now ready to deploy and run the Chainlink Multi-Agent Swarm system. 