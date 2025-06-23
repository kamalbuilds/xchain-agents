# @ai16z/plugin-sodas

A powerful Eliza plugin for interacting with the Solana blockchain and DeFi ecosystem through AI-powered agents.

## Overview

The SoDAS (Solana DeFi Agent Swarm) plugin is part of the AI Workforce Suite, providing a comprehensive set of tools for automated DeFi operations on Solana. It leverages multiple specialized AI agents to handle various aspects of DeFi interactions, from market analysis to trade execution.

## Features

- 🤖 Multi-agent architecture for specialized tasks
- 📊 Real-time market analysis and sentiment tracking
- 💱 Automated trading and liquidity management
- 🔒 Advanced security and risk management
- 📈 Portfolio tracking and optimization
- 🌐 Social media integration and analysis
- 🎨 NFT operations and marketplace interactions

## Installation

```bash
# Using pnpm (recommended)
pnpm add @ai16z/plugin-sodas

# Using npm
npm install @ai16z/plugin-sodas

# Using yarn
yarn add @ai16z/plugin-sodas
```

## Configuration

Create a `.env` file in your project root:

```env
SOLANA_PRIVATE_KEY=your_private_key
SOLANA_RPC_URL=your_rpc_url  # Optional, defaults to mainnet
```

## Basic Usage

```typescript
import { sodasPlugin } from '@ai16z/plugin-sodas';
import { initialize } from '@ai16z/plugin-sodas/solanaAgentKit';

// Initialize the agent
const agent = await initialize(process.env.SOLANA_PRIVATE_KEY);

// Check balance
const balance = await agent.get_balance();
console.log(`Current balance: ${balance} SOL`);

// Execute a swap
const swapResult = await swapWithJupiter({
  inputMint: "tokenA",
  outputMint: "tokenB",
  amount: 1.0,
  slippage: 0.5
});
```

## Plugin Actions

### Core Operations
- Market Analysis
- Portfolio Management
- Risk Assessment
- DeFi Operations
- NFT Operations
- Social Analysis

### Example: Market Analysis
```typescript
import { getMarketMetrics, analyzeTrends } from '@ai16z/plugin-sodas';

// Get market metrics
const metrics = await getMarketMetrics();

// Analyze market trends
const trends = await analyzeTrends();
```

### Example: NFT Operations
```typescript
import { createNFTCollection, mintNFT } from '@ai16z/plugin-sodas';

// Create a new collection
const collection = await createNFTCollection({
  name: "My Collection",
  symbol: "MYCOL",
  uri: "https://metadata.url",
  sellerFeeBasisPoints: 500
});

// Mint an NFT
const nft = await mintNFT({
  collectionAddress: collection,
  name: "My NFT",
  symbol: "MYNFT",
  uri: "https://nft-metadata.url"
});
```

## Advanced Features

### Social Integration
```typescript
import { analyzeSocialSentiment } from '@ai16z/plugin-sodas';

const sentiment = await analyzeSocialSentiment("SOL");
console.log(`Current sentiment: ${sentiment.score}`);
```

### Portfolio Management
```typescript
import { trackPortfolio, optimizeStrategy } from '@ai16z/plugin-sodas';

const portfolio = await trackPortfolio();
const optimization = await optimizeStrategy();
```

## Error Handling

The plugin includes comprehensive error handling:

```typescript
try {
  const result = await agent.get_balance();
} catch (error) {
  if (error instanceof SolanaError) {
    console.error('Solana error:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Development

```bash
# Install dependencies
pnpm install

# Build the plugin
pnpm build

# Run tests
pnpm test

# Watch mode for development
pnpm dev
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Documentation

For detailed documentation of all features and components, see [plugin-sodas.md](../../docs/plugin-sodas.md).

## License

MIT License - see the [LICENSE](LICENSE) file for details

## Dependencies

- `@ai16z/eliza`: Core framework for AI agents
- `solana-agent-kit`: Solana blockchain interaction toolkit
- TypeScript 5.0+
- Node.js 18+

## Support

For support, please:
1. Check the [documentation](../../docs/plugin-sodas.md)
2. Open an issue in the repository
3. Join our Discord community

## Acknowledgments

- Solana Foundation
- Jupiter Exchange
- Helius
- DeFiLlama
- CoinGecko
