# Chainlink Subscription Management Guide

This guide explains how to create, fund, and manage Chainlink subscriptions for the deployed smart contracts.

## Overview

The ArbitrageCoordinator contract uses two types of Chainlink subscriptions:

1. **Chainlink Functions Subscription** - For AI/ML computations and market data analysis
2. **Chainlink VRF Subscription** - For verifiable randomness in strategy diversification

Both subscriptions were initially deployed with placeholder IDs (1) and need to be updated with real subscription IDs after creation.

## Prerequisites

- Deployed ArbitrageCoordinator contract
- MetaMask wallet with testnet ETH and LINK tokens
- Access to Chainlink subscription management UIs

## Step 1: Create Chainlink Functions Subscription

### 1.1 Access Functions Subscription Manager
Visit [https://functions.chain.link](https://functions.chain.link) and connect your wallet.

### 1.2 Create Subscription
1. Click "Create Subscription"
2. Accept Terms of Service (first-time users)
3. Confirm transaction in MetaMask
4. Note your **Functions Subscription ID**

### 1.3 Fund Subscription
1. Click "Add Funds" on your subscription
2. Add at least **5 LINK** tokens (recommended for testing)
3. Confirm transaction

### 1.4 Add Consumer Contract
1. Click "Add Consumer"
2. Enter your ArbitrageCoordinator contract address: `0xb61289C2450ad164e23247615116C14C56598aB5`
3. Confirm transaction

## Step 2: Create Chainlink VRF Subscription

### 2.1 Access VRF Subscription Manager
Visit [https://vrf.chain.link](https://vrf.chain.link) and connect your wallet.

### 2.2 Create Subscription
1. Click "Create Subscription"
2. Confirm transaction in MetaMask
3. Note your **VRF Subscription ID**

### 2.3 Fund Subscription
1. Click "Add Funds" on your subscription
2. Add at least **3 LINK** tokens (recommended for testing)
3. Confirm transaction

### 2.4 Add Consumer Contract
1. Click "Add Consumer"
2. Enter your ArbitrageCoordinator contract address: `0xb61289C2450ad164e23247615116C14C56598aB5`
3. Confirm transaction

## Step 3: Update Contract Subscription IDs

### 3.1 Set Environment Variables
```bash
export FUNCTIONS_SUBSCRIPTION_ID="your_functions_subscription_id"
export VRF_SUBSCRIPTION_ID="your_vrf_subscription_id"
```

### 3.2 Run Update Script
```bash
cd contract
npx hardhat run scripts/update-subscriptions.ts --network sepolia
```

### 3.3 Manual Update (Alternative)
If the script fails, you can update manually using a blockchain explorer:

#### For Functions Subscription ID:
1. Go to [Etherscan](https://sepolia.etherscan.io)
2. Navigate to your ArbitrageCoordinator contract
3. Go to "Write Contract" tab
4. Connect your wallet
5. Find `updateFunctionsSubscriptionId` function
6. Enter your Functions subscription ID
7. Execute transaction

#### For VRF Subscription ID:
1. Use the same process but call `updateVRFSubscriptionId`
2. Enter your VRF subscription ID

## Step 4: Verify Configuration

### 4.1 Check Current Subscription IDs
```bash
# Using the contract on Etherscan
# Call getSubscriptionIds() function to verify both IDs are updated
```

### 4.2 Test Functionality
```bash
# Test Functions request (when implemented)
npx hardhat run scripts/test-functions-request.ts --network sepolia

# Test VRF request (when implemented)  
npx hardhat run scripts/test-vrf-request.ts --network sepolia
```

## Subscription Management Best Practices

### Monitoring Balances
- **Functions**: Monitor balance regularly as AI computations can consume LINK quickly
- **VRF**: Each randomness request costs ~2-3 LINK on testnet
- Set up balance alerts in the subscription managers

### Funding Recommendations
- **Development/Testing**: 5-10 LINK per subscription
- **Production**: 50-100 LINK per subscription (adjust based on usage)

### Security Considerations
- Only add trusted contracts as consumers
- Regularly review consumer list
- Use separate subscriptions for different environments (dev/staging/prod)

## Troubleshooting

### Common Issues

#### "Subscription not found" Error
- Verify subscription ID is correct
- Ensure subscription exists on the correct network
- Check if subscription has been cancelled

#### "Consumer not authorized" Error
- Verify contract address is added as consumer
- Check if contract address is correct
- Ensure you're calling from the correct network

#### "Insufficient funds" Error
- Check subscription balance
- Add more LINK tokens to subscription
- Verify gas fees are covered

#### Transaction Reverts
- Ensure you're the contract owner
- Check if contract is paused
- Verify network connectivity

### Getting Help

1. **Chainlink Documentation**:
   - [Functions Docs](https://docs.chain.link/chainlink-functions)
   - [VRF Docs](https://docs.chain.link/vrf)

2. **Community Support**:
   - [Chainlink Discord](https://discord.gg/chainlink)
   - [Stack Overflow](https://stackoverflow.com/questions/tagged/chainlink)

3. **Faucets**:
   - [LINK Faucet](https://faucets.chain.link)
   - [Sepolia ETH Faucet](https://sepoliafaucet.com)

## Contract Functions Reference

### Subscription Management Functions

```solidity
// Update Functions subscription ID (owner only)
function updateFunctionsSubscriptionId(uint64 _subscriptionId) external onlyOwner

// Update VRF subscription ID (owner only)  
function updateVRFSubscriptionId(uint64 _vrfSubscriptionId) external onlyOwner

// Get current subscription IDs (view function)
function getSubscriptionIds() external view returns (uint64 functionsSubId, uint64 vrfSubId)
```

### Usage Examples

```javascript
// Get current subscription IDs
const [functionsSubId, vrfSubId] = await contract.getSubscriptionIds();
console.log(`Functions: ${functionsSubId}, VRF: ${vrfSubId}`);

// Update Functions subscription ID
await contract.updateFunctionsSubscriptionId(123);

// Update VRF subscription ID  
await contract.updateVRFSubscriptionId(456);
```

## Next Steps

After successfully updating subscription IDs:

1. **Test Core Functionality**: Run market data requests and arbitrage detection
2. **Monitor Performance**: Track gas usage and LINK consumption
3. **Scale Gradually**: Start with small position sizes and increase gradually
4. **Implement Monitoring**: Set up alerts for subscription balances and contract activity
5. **Deploy to Mainnet**: Once testing is complete, deploy to production networks

## Deployment Summary

✅ **Completed**:
- ArbitrageCoordinator deployed to Sepolia: `0xb61289C2450ad164e23247615116C14C56598aB5`
- PredictionMarketDataStreams deployed to Sepolia: `0x64CE133884c220bE4e56397a3208620Af9516f03`
- Subscription management functions added

🔄 **Next Steps**:
- Create and fund Chainlink subscriptions
- Update subscription IDs in contracts
- Test end-to-end functionality
- Deploy to additional networks (Base, Polygon, Arbitrum, Avalanche) 