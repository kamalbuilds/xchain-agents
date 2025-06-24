# 🔧 Environment Setup
## Configure Your Development Environment for Chainlink Multi-Agent Swarm

## 🌐 **Network Configuration**

### **Supported Testnets**

| Network | Chain ID | RPC URL | Explorer |
|---------|----------|---------|----------|
| **Ethereum Sepolia** | 11155111 | `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` | [sepolia.etherscan.io](https://sepolia.etherscan.io) |
| **Base Sepolia** | 84532 | `https://base-sepolia.g.alchemy.com/v2/YOUR_KEY` | [sepolia.basescan.org](https://sepolia.basescan.org) |
| **Polygon Amoy** | 80002 | `https://polygon-amoy.g.alchemy.com/v2/YOUR_KEY` | [amoy.polygonscan.com](https://amoy.polygonscan.com) |
| **Arbitrum Sepolia** | 421614 | `https://arb-sepolia.g.alchemy.com/v2/YOUR_KEY` | [sepolia.arbiscan.io](https://sepolia.arbiscan.io) |
| **Avalanche Fuji** | 43113 | `https://api.avax-test.network/ext/bc/C/rpc` | [testnet.snowtrace.io](https://testnet.snowtrace.io) |

### **RPC Provider Setup**

#### **Alchemy (Recommended)**
1. Visit [alchemy.com](https://alchemy.com) and create account
2. Create apps for each network:
   - Ethereum Sepolia
   - Base Sepolia  
   - Polygon Amoy
   - Arbitrum Sepolia
3. Copy API keys to your `.env` files

#### **Infura (Alternative)**
1. Visit [infura.io](https://infura.io) and create account
2. Create project and enable networks
3. Use project ID in RPC URLs

#### **Public RPCs (Backup)**
```bash
# Use these as fallbacks (may be rate limited)
ETHEREUM_SEPOLIA_RPC_URL=https://rpc.sepolia.org
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
ARBITRUM_SEPOLIA_RPC_URL=https://sepolia-rollup.arbitrum.io/rpc
```

## 🔑 **API Keys & Secrets**

### **Required API Keys**

#### **Chainlink Services**
```bash
# Get from Chainlink ecosystem
CHAINLINK_NODE_URL=https://your-node.chainlink.com
CHAINLINK_API_KEY=your_api_key
CHAINLINK_API_SECRET=your_api_secret
```

#### **AI/ML Services**
```bash
# OpenAI (for GPT models)
OPENAI_API_KEY=sk-...
# Get from: https://platform.openai.com/api-keys

# Anthropic (for Claude models)
ANTHROPIC_API_KEY=sk-ant-...
# Get from: https://console.anthropic.com/

# Optional: Hugging Face (for open source models)
HUGGINGFACE_API_KEY=hf_...
```

#### **Market Data APIs**
```bash
# Polymarket (prediction markets)
POLYMARKET_API_KEY=your_key
POLYMARKET_SECRET=your_secret
# Get from: https://docs.polymarket.com/

# CoinGecko (price data)
COINGECKO_API_KEY=your_key
# Get from: https://www.coingecko.com/en/api

# News API (sentiment analysis)
NEWS_API_KEY=your_key
# Get from: https://newsapi.org/
```

#### **Block Explorer APIs**
```bash
# For contract verification
ETHERSCAN_API_KEY=your_key
BASESCAN_API_KEY=your_key
POLYGONSCAN_API_KEY=your_key
ARBISCAN_API_KEY=your_key
SNOWTRACE_API_KEY=your_key
```

### **Wallet Configuration**

#### **Private Key Management**

⚠️ **SECURITY WARNING**: Never use mainnet private keys in development!

```bash
# Generate test wallets
npx hardhat generate-wallets --count 5

# Or use existing test wallets
ETHEREUM_PRIVATE_KEY=0x1234...  # Test wallet only!
POLYGON_PRIVATE_KEY=0x5678...   # Test wallet only!
ARBITRUM_PRIVATE_KEY=0x9abc...  # Test wallet only!
BASE_PRIVATE_KEY=0xdef0...      # Test wallet only!
AVALANCHE_PRIVATE_KEY=0x2468... # Test wallet only!
```

#### **MetaMask Setup**
1. Install MetaMask browser extension
2. Create new wallet or import test wallet
3. Add all testnet networks (see network configuration above)
4. Import test private keys for easy access

## 🗄️ **Database Configuration**

### **PostgreSQL Setup**

#### **Local Installation**
```bash
# macOS
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt install postgresql-14 postgresql-contrib-14
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createuser --createdb --login --pwprompt xchain_user
sudo -u postgres createdb --owner=xchain_user xchain_agents
```

#### **Docker Setup (Alternative)**
```bash
# Create docker-compose.yml for database
cat > docker-compose.db.yml << EOF
version: '3.8'
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: xchain_agents
      POSTGRES_USER: xchain_user
      POSTGRES_PASSWORD: secure_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
EOF

# Start databases
docker-compose -f docker-compose.db.yml up -d
```

#### **Database URL Configuration**
```bash
# Local PostgreSQL
DATABASE_URL=postgresql://xchain_user:secure_password@localhost:5432/xchain_agents

# Docker PostgreSQL
DATABASE_URL=postgresql://xchain_user:secure_password@localhost:5432/xchain_agents

# Cloud PostgreSQL (production)
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
```

### **Redis Setup**

#### **Local Installation**
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### **Redis Configuration**
```bash
# Local Redis
REDIS_URL=redis://localhost:6379

# Redis with password
REDIS_URL=redis://:password@localhost:6379

# Redis Cloud (production)
REDIS_URL=redis://user:pass@host:port/db
```

## ⚙️ **Application Configuration**

### **Eliza Framework Settings**

#### **Core Configuration**
```bash
# Logging
ELIZA_LOG_LEVEL=info  # debug, info, warn, error
ELIZA_LOG_FORMAT=json # json, text

# Server
ELIZA_SERVER_PORT=3000
ELIZA_SERVER_HOST=0.0.0.0
ELIZA_CORS_ORIGIN=http://localhost:3000

# Agent Settings
ELIZA_AGENT_COUNT=7
ELIZA_MAX_MEMORY_SIZE=1000000
ELIZA_MEMORY_CLEANUP_INTERVAL=3600000
```

#### **AI Model Configuration**
```bash
# Model Selection
ELIZA_DEFAULT_MODEL=gpt-4
ELIZA_FALLBACK_MODEL=gpt-3.5-turbo
ELIZA_LOCAL_MODEL_ENABLED=false

# Model Parameters
ELIZA_MAX_TOKENS=4000
ELIZA_TEMPERATURE=0.7
ELIZA_TOP_P=0.9
ELIZA_FREQUENCY_PENALTY=0.0
ELIZA_PRESENCE_PENALTY=0.0
```

### **Smart Contract Configuration**

#### **Deployment Settings**
```bash
# Gas Configuration
DEFAULT_GAS_LIMIT=2000000
DEFAULT_GAS_PRICE=20000000000  # 20 gwei
MAX_GAS_PRICE=100000000000     # 100 gwei

# Deployment
DEPLOYMENT_SALT=0x1234567890123456789012345678901234567890123456789012345678901234
DEPLOYMENT_CONFIRMATIONS=2

# Contract Verification
AUTO_VERIFY=true
VERIFICATION_TIMEOUT=300000  # 5 minutes
```

#### **Chainlink Service Configuration**
```bash
# CCIP Configuration
CCIP_GAS_LIMIT=200000
CCIP_TIMEOUT=1200000  # 20 minutes

# VRF Configuration
VRF_GAS_LIMIT=100000
VRF_CONFIRMATIONS=3
VRF_NUM_WORDS=3

# Functions Configuration
FUNCTIONS_GAS_LIMIT=300000
FUNCTIONS_TIMEOUT=300000  # 5 minutes

# Automation Configuration
AUTOMATION_GAS_LIMIT=500000
AUTOMATION_CHECK_INTERVAL=60000  # 1 minute
```

## 🔄 **Development Workflow**

### **Environment Switching**

#### **Development Environment**
```bash
# Copy development config
cp eliza/.env.development eliza/.env
cp contract/.env.development contract/.env

# Use development settings
export NODE_ENV=development
export ELIZA_LOG_LEVEL=debug
```

#### **Testing Environment**
```bash
# Copy testing config
cp eliza/.env.testing eliza/.env
cp contract/.env.testing contract/.env

# Use testing settings
export NODE_ENV=test
export ELIZA_LOG_LEVEL=warn
```

#### **Production Environment**
```bash
# Copy production config
cp eliza/.env.production eliza/.env
cp contract/.env.production contract/.env

# Use production settings
export NODE_ENV=production
export ELIZA_LOG_LEVEL=info
```

### **Environment Validation**

#### **Validation Script**
```bash
# Create validation script
cat > scripts/validate-env.js << 'EOF'
const fs = require('fs');
const path = require('path');

const requiredVars = [
  'ETHEREUM_RPC_URL',
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'REDIS_URL',
  'PRIVATE_KEY'
];

const envPath = path.join(__dirname, '../eliza/.env');
const envContent = fs.readFileSync(envPath, 'utf8');

const missing = requiredVars.filter(varName => 
  !envContent.includes(`${varName}=`) || 
  envContent.includes(`${varName}=your_`)
);

if (missing.length > 0) {
  console.error('❌ Missing or incomplete environment variables:');
  missing.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
} else {
  console.log('✅ All required environment variables are configured');
}
EOF

# Run validation
node scripts/validate-env.js
```

## 🧪 **Testing Configuration**

### **Test Environment Setup**
```bash
# Create test environment
cp eliza/.env.example eliza/.env.test
cp contract/.env.example contract/.env.test

# Configure for testing
echo "NODE_ENV=test" >> eliza/.env.test
echo "DATABASE_URL=postgresql://test:test@localhost:5432/xchain_agents_test" >> eliza/.env.test
echo "REDIS_URL=redis://localhost:6379/1" >> eliza/.env.test
```

### **Test Database Setup**
```bash
# Create test database
createdb xchain_agents_test

# Run migrations
cd eliza
NODE_ENV=test pnpm run db:migrate
```

## 🔍 **Environment Troubleshooting**

### **Common Issues**

#### **RPC Connection Errors**
```bash
# Test RPC connections
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  $ETHEREUM_SEPOLIA_RPC_URL
```

#### **Database Connection Errors**
```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Test Redis connection
redis-cli -u $REDIS_URL ping
```

#### **API Key Validation**
```bash
# Test OpenAI API
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Test Polymarket API
curl -H "Authorization: Bearer $POLYMARKET_API_KEY" \
  https://gamma-api.polymarket.com/markets
```

### **Environment Reset**
```bash
# Reset development environment
rm eliza/.env contract/.env
cp eliza/.env.example eliza/.env
cp contract/.env.example contract/.env

# Clear databases
dropdb xchain_agents && createdb xchain_agents
redis-cli flushall

# Reinstall dependencies
cd eliza && rm -rf node_modules && pnpm install
cd ../contract && rm -rf node_modules && npm install
```

---

**Environment setup complete!** 🎉 Your development environment is now configured for the Chainlink Multi-Agent Swarm system. 