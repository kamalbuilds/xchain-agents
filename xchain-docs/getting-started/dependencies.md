# 📦 Dependencies Guide
## Understanding Project Dependencies for Chainlink Multi-Agent Swarm

## 🏗️ **Project Structure**

The Chainlink Multi-Agent Swarm is organized as a monorepo with multiple packages:

```
xchain-agents/
├── eliza/                 # AI Agent Framework
├── contract/              # Smart Contracts
├── xchain-docs/          # Documentation
├── dashboard/            # Web Dashboard (optional)
└── mobile/               # Mobile App (optional)
```

## 🤖 **Eliza Framework Dependencies**

### **Core Dependencies**

#### **AI/ML Libraries**
```json
{
  "@ai-sdk/openai": "^0.0.66",
  "@anthropic-ai/sdk": "^0.27.3",
  "@huggingface/inference": "^2.8.0",
  "openai": "^4.67.3",
  "tiktoken": "^1.0.17"
}
```

**Purpose**: AI model integration and token counting
- `@ai-sdk/openai`: Unified AI SDK for OpenAI models
- `@anthropic-ai/sdk`: Claude AI integration
- `@huggingface/inference`: Open source model access
- `tiktoken`: Token counting for context management

#### **Blockchain Integration**
```json
{
  "ethers": "^6.13.0",
  "viem": "^2.21.19",
  "@wagmi/core": "^2.13.8",
  "web3": "^4.12.1"
}
```

**Purpose**: Blockchain interaction and wallet management
- `ethers`: Ethereum library for smart contract interaction
- `viem`: TypeScript-first Ethereum library
- `@wagmi/core`: React hooks for Ethereum
- `web3`: Alternative Ethereum library

#### **Database & Storage**
```json
{
  "pg": "^8.12.0",
  "redis": "^4.7.0",
  "prisma": "^5.20.0",
  "@prisma/client": "^5.20.0",
  "sqlite3": "^5.1.7"
}
```

**Purpose**: Data persistence and caching
- `pg`: PostgreSQL client
- `redis`: Redis client for caching
- `prisma`: Database ORM
- `sqlite3`: Local database for development

#### **Framework Core**
```json
{
  "@elizaos/core": "^0.1.7-alpha.5",
  "@elizaos/plugin-node": "^0.1.7-alpha.5",
  "@elizaos/plugin-bootstrap": "^0.1.7-alpha.5"
}
```

**Purpose**: Eliza framework foundation
- Core runtime and agent management
- Node.js specific implementations
- Bootstrap plugins for quick setup

### **Plugin Dependencies**

#### **Chainlink Plugins**
```json
{
  "@chainlink/contracts": "^1.4.0",
  "@chainlink/contracts-ccip": "^1.6.0",
  "@chainlink/functions-toolkit": "^0.3.0"
}
```

**Purpose**: Chainlink service integration
- Smart contract interfaces
- CCIP cross-chain functionality
- Functions toolkit for serverless compute

#### **Market Data Plugins**
```json
{
  "axios": "^1.7.7",
  "ws": "^8.18.0",
  "node-fetch": "^3.3.2"
}
```

**Purpose**: External API integration
- HTTP client for REST APIs
- WebSocket client for real-time data
- Fetch polyfill for Node.js

#### **Utility Libraries**
```json
{
  "lodash": "^4.17.21",
  "moment": "^2.30.1",
  "uuid": "^10.0.0",
  "dotenv": "^16.4.5"
}
```

**Purpose**: Common utilities
- Data manipulation helpers
- Date/time handling
- Unique identifier generation
- Environment variable loading

### **Development Dependencies**

#### **TypeScript & Build Tools**
```json
{
  "typescript": "^5.6.2",
  "ts-node": "^10.9.2",
  "@types/node": "^22.7.4",
  "tsx": "^4.19.1",
  "tsup": "^8.3.0"
}
```

**Purpose**: TypeScript compilation and development
- TypeScript compiler
- TypeScript execution for Node.js
- Type definitions
- Fast TypeScript bundler

#### **Testing Framework**
```json
{
  "vitest": "^2.1.1",
  "@vitest/coverage-v8": "^2.1.1",
  "jest": "^29.7.0",
  "@types/jest": "^29.5.13"
}
```

**Purpose**: Testing and coverage
- Fast test runner
- Code coverage reporting
- Alternative testing framework

#### **Code Quality**
```json
{
  "eslint": "^9.11.1",
  "prettier": "^3.3.3",
  "@typescript-eslint/eslint-plugin": "^8.7.0",
  "@typescript-eslint/parser": "^8.7.0"
}
```

**Purpose**: Code linting and formatting
- JavaScript/TypeScript linting
- Code formatting
- TypeScript-specific linting rules

## 📝 **Smart Contract Dependencies**

### **Core Dependencies**

#### **Hardhat Framework**
```json
{
  "hardhat": "^2.24.3",
  "@nomicfoundation/hardhat-toolbox": "^5.0.0",
  "@nomicfoundation/hardhat-ethers": "^3.0.8",
  "@nomicfoundation/hardhat-verify": "^2.0.10"
}
```

**Purpose**: Smart contract development framework
- Compilation, testing, and deployment
- Comprehensive toolbox with common plugins
- Ethers.js integration
- Contract verification

#### **Chainlink Contracts**
```json
{
  "@chainlink/contracts": "^1.4.0",
  "@chainlink/contracts-ccip": "^1.6.0"
}
```

**Purpose**: Chainlink service contracts
- Oracle and service interfaces
- CCIP cross-chain contracts
- Pre-deployed contract addresses

#### **OpenZeppelin Contracts**
```json
{
  "@openzeppelin/contracts": "4.9.6"
}
```

**Purpose**: Secure smart contract primitives
- Access control (Ownable, AccessControl)
- Security utilities (ReentrancyGuard, Pausable)
- Token standards (ERC20, ERC721, ERC1155)

#### **Ethereum Libraries**
```json
{
  "ethers": "^6.13.0",
  "web3": "^4.12.1"
}
```

**Purpose**: Blockchain interaction
- Contract deployment and interaction
- Transaction management
- Event listening

### **Development Dependencies**

#### **Testing Framework**
```json
{
  "@nomicfoundation/hardhat-chai-matchers": "^2.0.7",
  "@nomicfoundation/hardhat-network-helpers": "^1.0.11",
  "chai": "^4.5.0",
  "@types/chai": "^4.3.16",
  "@types/mocha": "^10.0.7"
}
```

**Purpose**: Contract testing
- Enhanced assertion matchers
- Network manipulation helpers
- Testing assertions
- Type definitions

#### **Code Generation**
```json
{
  "@typechain/ethers-v6": "^0.5.1",
  "@typechain/hardhat": "^9.1.0",
  "typechain": "^8.3.2"
}
```

**Purpose**: TypeScript type generation
- Generate types from contract ABIs
- Hardhat integration
- Type-safe contract interactions

#### **Analysis & Coverage**
```json
{
  "solidity-coverage": "^0.8.12",
  "hardhat-gas-reporter": "^1.0.10"
}
```

**Purpose**: Code analysis
- Test coverage reporting
- Gas usage analysis

## 🔧 **Dependency Management**

### **Package Managers**

#### **PNPM (Recommended for Eliza)**
```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Add new dependency
pnpm add package-name

# Add dev dependency
pnpm add -D package-name
```

**Benefits**:
- Faster installation
- Disk space efficient
- Better monorepo support
- Strict dependency resolution

#### **NPM (Used for Contracts)**
```bash
# Install dependencies
npm install

# Add new dependency
npm install package-name

# Add dev dependency
npm install --save-dev package-name
```

### **Version Management**

#### **Lock Files**
- **Eliza**: `pnpm-lock.yaml` - PNPM lock file
- **Contracts**: `package-lock.json` - NPM lock file

Always commit lock files to ensure consistent installations.

#### **Version Pinning Strategy**
```json
{
  "dependencies": {
    "ethers": "^6.13.0",          // Minor updates allowed
    "@chainlink/contracts": "1.4.0", // Exact version for stability
    "typescript": "~5.6.2"        // Patch updates only
  }
}
```

### **Dependency Updates**

#### **Check for Updates**
```bash
# PNPM
pnpm outdated

# NPM
npm outdated

# Check security vulnerabilities
npm audit
pnpm audit
```

#### **Update Dependencies**
```bash
# Update all dependencies
pnpm update
npm update

# Update specific package
pnpm update package-name
npm update package-name

# Update to latest (breaking changes possible)
pnpm update --latest
```

## 🔍 **Dependency Analysis**

### **Bundle Size Analysis**

#### **Analyze Eliza Bundle**
```bash
cd eliza
pnpm run build:analyze

# Or use bundle analyzer
npx webpack-bundle-analyzer dist/stats.json
```

#### **Contract Size Analysis**
```bash
cd contract
npm run compile
npm run size-contracts
```

### **Security Scanning**

#### **Vulnerability Scanning**
```bash
# Scan for vulnerabilities
npm audit
pnpm audit

# Fix automatically
npm audit fix
pnpm audit --fix

# Manual review of high-severity issues
npm audit --audit-level high
```

#### **License Compliance**
```bash
# Check licenses
npx license-checker

# Generate license report
npx license-checker --csv > licenses.csv
```

## 🚨 **Common Dependency Issues**

### **Version Conflicts**

#### **Peer Dependency Warnings**
```bash
# Install peer dependencies manually
npm install peer-dependency-name

# Or use automatic installation
npx install-peerdeps package-name
```

#### **Duplicate Dependencies**
```bash
# Find duplicates
npm ls --depth=0

# Deduplicate (NPM)
npm dedupe

# PNPM handles this automatically
```

### **Node.js Version Issues**

#### **Use Node Version Manager**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use project Node version
nvm use 18
nvm alias default 18
```

#### **Engine Compatibility**
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=8.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### **Platform-Specific Issues**

#### **Native Dependencies**
```bash
# Rebuild native modules
npm rebuild

# Clear cache if issues persist
npm cache clean --force
pnpm store prune
```

#### **Python Dependencies (for some packages)**
```bash
# Install Python build tools
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt install python3-dev build-essential

# Windows
npm install --global windows-build-tools
```

## 📊 **Dependency Monitoring**

### **Automated Dependency Updates**

#### **Renovate Configuration**
```json
{
  "extends": ["config:base"],
  "schedule": ["before 6am on monday"],
  "packageRules": [
    {
      "matchPackagePatterns": ["@chainlink/*"],
      "schedule": ["before 6am on first day of month"]
    }
  ]
}
```

#### **Dependabot Configuration**
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/contract"
    schedule:
      interval: "weekly"
  - package-ecosystem: "npm"
    directory: "/eliza"
    schedule:
      interval: "weekly"
```

### **Performance Monitoring**

#### **Bundle Analysis Scripts**
```json
{
  "scripts": {
    "analyze:deps": "npx depcheck",
    "analyze:bundle": "npx webpack-bundle-analyzer",
    "analyze:unused": "npx unimported",
    "analyze:duplicates": "npx npm-check-duplicates"
  }
}
```

---

**Dependencies configured!** 🎉 Your project now has a solid foundation with well-managed dependencies for both AI agents and smart contracts. 