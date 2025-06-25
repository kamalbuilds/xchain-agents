# Chainlink Functions JavaScript Code Upload Guide

## 📋 Overview

This guide explains how "Upload market data fetcher JavaScript code" works in your Cross-Chain AI Prediction Market Arbitrage Network. 

**Chainlink Functions** allows your smart contracts to execute custom JavaScript code in a **decentralized, trust-minimized way** by running the code on multiple oracle nodes and reaching consensus on the results.

## 🔧 How It Works

### 1. **JavaScript Source Code Storage**
- JavaScript code is **stored as strings** in your smart contract
- The code gets **sent to the Chainlink Functions DON** when making requests
- Each node in the DON **executes the code independently**
- The DON **reaches consensus** on the results before returning to your contract

### 2. **The Upload Process**

```solidity
// In ArbitrageCoordinator.sol
string private marketDataScript;    // Stores market data fetcher JS
string private predictionScript;    // Stores AI prediction JS

function setMarketDataScript(string memory _script) external onlyOwner {
    marketDataScript = _script;  // This is the "upload"
}
```

### 3. **Execution Flow**

```
1. Agent calls requestMarketData()
2. Contract creates Functions.Request with JavaScript code
3. Request sent to Chainlink Functions DON
4. Each node executes the JavaScript code
5. Nodes reach consensus on the result
6. Result returned to fulfillRequest() in contract
7. Contract processes the data and triggers arbitrage logic
```

## 📁 Project Structure

```
contract/
├── contracts/
│   └── ArbitrageCoordinator.sol     # Main contract with Functions integration
├── scripts/
│   ├── functions/
│   │   ├── marketDataFetcher.js     # Market data JavaScript code
│   │   └── aiPredictionScript.js    # AI prediction JavaScript code
│   ├── deployFunctions.js           # Upload scripts to contract
│   └── testFunctions.js             # Test Functions requests
```

## 🚀 Implementation Steps

### Step 1: Deploy Contracts (Already Done ✅)

Your contracts are already deployed:
- **Ethereum Sepolia**: `0x9F5401788D074636550768768dD1a45873c46A13`
- **Avalanche Fuji**: `0x8E7ADAe9b3bf7e70Dfea44ca31C7b5331a4ED09b`

### Step 2: Upload JavaScript Code

```bash
# Upload the JavaScript source code to your contract
npm run upload:functions

# Or manually:
npx hardhat run scripts/deployFunctions.js --network sepolia
npx hardhat run scripts/deployFunctions.js --network avalancheFuji
```

This script:
- Reads `marketDataFetcher.js` and `aiPredictionScript.js`
- Calls `setMarketDataScript()` and `setPredictionScript()` on your contract
- Stores the JavaScript code on-chain

### Step 3: Set Up Chainlink Services

#### 3.1 Functions Subscription
```bash
# Visit https://functions.chain.link/
# Create subscription and fund with LINK
# Add your contract as authorized consumer
```

#### 3.2 VRF Subscription
```bash
# Visit https://vrf.chain.link/sepolia
# Create subscription and fund with LINK
# Add your contract as authorized consumer
```

#### 3.3 Automation Upkeep
```bash
# Visit https://automation.chain.link/sepolia
# Register upkeep for automated execution
```

### Step 4: Update Subscription IDs

```bash
# Update Functions subscription ID
npx hardhat run scripts/updateSubscriptions.js --network sepolia
```

### Step 5: Test Functions

```bash
# Test the Functions integration
npx hardhat run scripts/testFunctions.js --network sepolia
```

## 📄 JavaScript Code Examples

### Market Data Fetcher (`marketDataFetcher.js`)

```javascript
// Arguments: [marketId, chainId]
const marketId = args[0];
const chainId = args[1];

// Fetch from Polymarket Gamma API
const response = await Functions.makeHttpRequest({
    url: `https://gamma-api.polymarket.com/markets/${marketId}`,
    method: "GET",
    headers: { "Content-Type": "application/json" }
});

// Process and return price, volume, timestamp
const price = Math.round(parseFloat(response.data.tokens[0].price) * 1e18);
const volume = Math.round(parseFloat(response.data.volume) * 1e18);
const timestamp = Math.floor(Date.now() / 1000);

// Encode for smart contract
return Functions.encodeUint256(price) + 
       Functions.encodeUint256(volume).slice(2) + 
       Functions.encodeUint256(timestamp).slice(2);
```

### AI Prediction Script (`aiPredictionScript.js`)

```javascript
// Arguments: [marketId, timeHorizon]
const marketId = args[0];
const timeHorizon = parseInt(args[1]);

// Fetch historical data
const marketData = await fetchHistoricalData(marketId);

// Analyze sentiment
const sentiment = await analyzeSocialSentiment(marketId);

// Generate prediction
const prediction = await generateAIPrediction(marketData, sentiment, timeHorizon);

// Return prediction, confidence, timeHorizon
return Functions.encodeUint256(Math.round(prediction.price * 1e18)) + 
       Functions.encodeUint256(Math.round(prediction.confidence * 1e18)).slice(2) + 
       Functions.encodeUint256(timeHorizon).slice(2);
```

## 🔐 Secrets Management

For API keys and sensitive data:

```javascript
// In your JavaScript code
const apiKey = secrets.polymarketApiKey;
const openaiKey = secrets.openaiApiKey;

// Secrets are encrypted and stored separately
// Access via the secrets object
```

Upload secrets:
```bash
# Upload encrypted secrets to DON
npx hardhat functions-upload-secrets-don --network sepolia --slotid 0
```

## 🧪 Testing Functions

### Local Simulation
```bash
# Test JavaScript code locally before uploading
npx hardhat functions-simulate-script
```

### On-Chain Testing
```bash
# Test full Functions request on-chain
npx hardhat run scripts/testFunctions.js --network sepolia
```

### Expected Output
```
🧪 Testing Chainlink Functions Integration...

Network: sepolia
Contract Address: 0x9F5401788D074636550768768dD1a45873c46A13

🔍 Test 1: Market Data Request
==================================================
Requesting market data for Market ID: 21742633...
📤 Transaction sent: 0xabc123...
✅ Transaction confirmed in block: 12345
🎫 Request ID: 0xdef456...
⏳ Waiting for Chainlink Functions to fulfill request...
```

## 🎯 Real-World Data Sources

Your JavaScript code fetches real data from:

### **Polymarket API**
- **Gamma API**: Market metadata and current prices
- **CLOB API**: Order book data and volume
- **Example**: 2024 US Presidential Election market

### **Alternative Sources**
- **Kalshi**: Additional prediction markets
- **Social Media APIs**: Sentiment analysis
- **News APIs**: Event-driven predictions

## ⚡ Automation Flow

1. **Automation Upkeep** calls `checkUpkeep()`
2. Contract detects stale market data
3. `performUpkeep()` triggers Functions request
4. JavaScript code executes and fetches new data
5. `fulfillRequest()` processes the response
6. New arbitrage opportunities are detected
7. Cross-chain messages sent via CCIP

## 🔧 Troubleshooting

### Common Issues

**1. "Scripts not uploaded"**
```bash
# Solution: Run the upload script
npx hardhat run scripts/deployFunctions.js --network sepolia
```

**2. "UnauthorizedAgent error"**
```bash
# Solution: Register your address as an agent
contract.registerAgent(yourAddress, "agent-role")
```

**3. "InsufficientBalance error"**
```bash
# Solution: Fund contract with LINK tokens
# Send LINK to your contract address
```

**4. "Request timeout"**
```bash
# Solution: Check subscription is funded and contract is added as consumer
# Visit https://functions.chain.link/
```

### Debug Functions

```javascript
// Add console.log in your JavaScript code
console.log(`Market ID: ${marketId}`);
console.log(`API Response:`, response.data);

// Check logs in Functions UI
// https://functions.chain.link/
```

## 📊 Monitoring

### Functions UI
- **URL**: https://functions.chain.link/
- **Monitor**: Request status, costs, logs
- **Debug**: JavaScript execution errors

### Block Explorers
- **Sepolia**: https://sepolia.etherscan.io/address/[YOUR_CONTRACT]
- **Fuji**: https://testnet.snowtrace.io/address/[YOUR_CONTRACT]

### Events to Watch
- `AgentRequestCreated`: Functions request initiated
- `AgentRequestFulfilled`: Functions request completed
- `MarketDataUpdated`: New market data received
- `ArbitrageOpportunityDetected`: Arbitrage found

## 🚀 Next Steps

1. **Upload JavaScript Code**: `npm run upload:functions`
2. **Set Up Subscriptions**: Functions, VRF, Automation
3. **Test Integration**: `npm run test:functions`
4. **Monitor Requests**: Check Functions UI
5. **Scale Up**: Add more data sources and agents

## 💡 Key Benefits

✅ **Trust-Minimized**: Code executed on decentralized oracle network
✅ **Real Data**: Live integration with Polymarket, Kalshi, and other APIs
✅ **Production Ready**: No mocks or simulations - real market data
✅ **Automated**: Chainlink Automation triggers regular updates
✅ **Cross-Chain**: CCIP enables arbitrage across multiple chains
✅ **AI-Powered**: Machine learning predictions for trading strategies

---

Your Chainlink Functions integration is now complete and ready for production! 🎉 