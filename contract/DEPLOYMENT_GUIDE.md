# Cross-Chain Arbitrage Network Deployment Guide

This guide provides step-by-step instructions for deploying the ArbitrageCoordinator and PredictionMarketDataStreams contracts to various testnets and configuring Chainlink services.

## Prerequisites

1. **Node.js** (v18 or later)
2. **npm** or **yarn**
3. **Private key** with testnet funds
4. **API keys** for RPC providers and block explorers

## Environment Setup

Create a `.env` file in the `contract` directory:

```bash
# Private Key for Deployment
PRIVATE_KEY=your_private_key_here

# RPC URLs for Testnets
ETHEREUM_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
POLYGON_AMOY_RPC_URL=https://polygon-amoy.drpc.org
ARBITRUM_SEPOLIA_RPC_URL=https://endpoints.omniatech.io/v1/arbitrum/sepolia/public
AVALANCHE_FUJI_RPC_URL=https://avalanche-fuji-c-chain-rpc.publicnode.com

# Explorer API Keys for Contract Verification
ETHERSCAN_API_KEY=your_etherscan_api_key
BASESCAN_API_KEY=your_basescan_api_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
ARBISCAN_API_KEY=your_arbiscan_api_key
SNOWTRACE_API_KEY=your_snowtrace_api_key
```

## Getting Testnet Funds

### Ethereum Sepolia
- [Alchemy Faucet](https://sepoliafaucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)

### Base Sepolia
- [Base Faucet](https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet)
- [Chainlink Faucet](https://faucets.chain.link/base-sepolia)

### Polygon Amoy
- [Polygon Faucet](https://faucet.polygon.technology/)
- [Alchemy Faucet](https://amoy-faucet.polygon.technology/)

### Arbitrum Sepolia
- [Arbitrum Faucet](https://faucet.arbitrum.io/)
- [Chainlink Faucet](https://faucets.chain.link/arbitrum-sepolia)

### Avalanche Fuji
- [Avalanche Faucet](https://faucet.avax.network/)
- [Chainlink Faucet](https://faucets.chain.link/fuji)

## Contract Deployment

### Deploy to Single Network

```bash
# Deploy to Ethereum Sepolia
npm run deploy:sepolia

# Deploy to Base Sepolia
npm run deploy:base-sepolia

# Deploy to Polygon Amoy
npm run deploy:polygon-amoy

# Deploy to Arbitrum Sepolia
npm run deploy:arbitrum-sepolia

# Deploy to Avalanche Fuji
npm run deploy:avalanche-fuji
```

### Deploy Individual Contracts

```bash
# Deploy ArbitrageCoordinator only
npx hardhat run scripts/deploy-arbitrage-coordinator.ts --network sepolia

# Deploy PredictionMarketDataStreams only
npx hardhat run scripts/deploy-prediction-market.ts --network sepolia
```

### Deploy All Contracts to All Networks

```bash
npm run deploy:all
```

## Contract Verification

After deployment, verify your contracts on block explorers:

```bash
# Verify ArbitrageCoordinator
npx hardhat verify --network sepolia <contract_address> "<router>" "<link>" "<vrf_coordinator>" "<vrf_key_hash>" "<automation_registrar>"

# Verify PredictionMarketDataStreams
npx hardhat verify --network sepolia <contract_address> "<router>" "<link>"
```

## Chainlink Services Configuration

### 1. Fund Contracts with LINK Tokens

Each contract needs LINK tokens for Chainlink services:

- **ArbitrageCoordinator**: 10-20 LINK minimum
- **PredictionMarketDataStreams**: 5-10 LINK minimum

Get testnet LINK from [Chainlink Faucets](https://faucets.chain.link/).

### 2. VRF (Verifiable Random Function) Setup

1. Visit [VRF Subscription Manager](https://vrf.chain.link/)
2. Select your network
3. Create a new subscription
4. Fund with LINK tokens (5-10 LINK recommended)
5. Add your ArbitrageCoordinator contract as a consumer
6. Note the subscription ID for contract configuration

### 3. Automation Setup

1. Visit [Chainlink Automation](https://automation.chain.link/)
2. Select your network
3. Register a new upkeep:
   - **Target Contract**: ArbitrageCoordinator address
   - **Admin Address**: Your wallet address
   - **Gas Limit**: 500,000
   - **Starting Balance**: 5-10 LINK
   - **Upkeep Name**: "Arbitrage Coordinator"
4. Complete the registration and fund the upkeep

### 4. Chainlink Functions Setup

1. Visit [Chainlink Functions](https://functions.chain.link/)
2. Create a new subscription
3. Fund with LINK tokens (5-10 LINK)
4. Add your contracts as authorized consumers
5. Upload your JavaScript code for market analysis functions

### 5. CCIP (Cross-Chain Interoperability Protocol)

No additional setup required - contracts are pre-configured with correct router addresses.

Ensure contracts have sufficient LINK balance for cross-chain operations.

### 6. Data Streams (If Available)

Data Streams may have limited testnet availability. Contact Chainlink for access.

## Network-Specific Contract Addresses

### Ethereum Sepolia (Chain ID: 11155111)
- **CCIP Router**: `0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59`
- **LINK Token**: `0x779877A7B0D9E8603169DdbD7836e478b4624789`
- **VRF Coordinator**: `0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B`
- **Automation Registry**: `0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad`

### Base Sepolia (Chain ID: 84532)
- **CCIP Router**: `0xD3b06cEbF099CE7DA4AcCf578aaebFDBd6e88a93`
- **LINK Token**: `0xE4aB69C077896252FAFBD49EFD26B5D171A32410`
- **VRF Coordinator**: `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE`
- **Automation Registry**: `0x91D4a4C3D448c7f3CB477332B1c7D420a5810aC3`

### Polygon Amoy (Chain ID: 80002)
- **CCIP Router**: `0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2`
- **LINK Token**: `0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904`
- **VRF Coordinator**: `0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2`
- **Automation Registry**: `0x93C0e201f7B158F503a1265B6942088975f92ce7`

### Arbitrum Sepolia (Chain ID: 421614)
- **CCIP Router**: `0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165`
- **LINK Token**: `0xb1D4538B4571d411F07960EF2838Ce337FE1E80E`
- **VRF Coordinator**: `0x5CE8D5A2BC84beb22a398CCA51996F7930313D61`
- **Automation Registry**: `0x8194399B3f11fcA2E8cCEfc4c9A658c61B8Bf412`

### Avalanche Fuji (Chain ID: 43113)
- **CCIP Router**: `0xF694E193200268f9a4868e4Aa017A0118C9a8177`
- **LINK Token**: `0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846`
- **VRF Coordinator**: `0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE`
- **Automation Registry**: `0x819B58A646CDd8289275A87653a2aA4902b14fe6`

## Testing the Deployment

### Basic Contract Interaction

```bash
# Test contract deployment
npx hardhat run scripts/test-deployment.js --network sepolia
```

### Cross-Chain Testing

1. Deploy contracts on at least 2 different testnets
2. Fund both contracts with LINK tokens
3. Test cross-chain message sending
4. Verify message reception on destination chain

## Troubleshooting

### Common Issues

1. **Insufficient Gas**: Increase gas limit in hardhat.config.ts
2. **RPC Errors**: Check RPC URL and API key validity
3. **LINK Balance**: Ensure contracts have sufficient LINK tokens
4. **Network Configuration**: Verify chain IDs and contract addresses

### Support Resources

- [Chainlink Documentation](https://docs.chain.link/)
- [Chainlink Discord](https://discord.gg/chainlink)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/chainlink)

## Security Considerations

1. **Private Key Security**: Never commit private keys to version control
2. **Contract Verification**: Always verify contracts on block explorers
3. **Access Control**: Implement proper role-based access control
4. **Audit**: Consider professional smart contract audits for mainnet deployment

## Next Steps

After successful deployment:

1. Set up monitoring and alerting
2. Implement proper logging and analytics
3. Configure backup and disaster recovery
4. Plan for mainnet deployment strategy
5. Integrate with Eliza AI agent framework