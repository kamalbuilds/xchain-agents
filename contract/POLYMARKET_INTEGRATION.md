# Polymarket API Integration Guide

This guide explains the updated Polymarket API integration for the Chainlink Multi-Agent Swarm Cross-Chain AI Prediction Market Arbitrage Network.

## Overview

The system now uses the correct official Polymarket APIs:

1. **Gamma API** (`https://gamma-api.polymarket.com`) - Market metadata and general market data
2. **CLOB API** (`https://clob.polymarket.com`) - Trading, pricing, and order book data

## API Endpoints Used

### Gamma API Endpoints

#### Get Markets
```
GET https://gamma-api.polymarket.com/markets
```

**Parameters:**
- `limit` - Number of markets to return
- `active` - Filter by active status (true/false)
- `condition_ids` - Filter by specific condition IDs
- `category` - Filter by market category

**Response Structure:**
```json
[
  {
    "id": 123,
    "condition_id": "0x1234...",
    "question": "Will Bitcoin reach $100K by end of 2024?",
    "category": "Crypto",
    "active": true,
    "closed": false,
    "liquidity": "50000",
    "volume": "1000000",
    "end_date_iso": "2024-12-31T23:59:59Z",
    "tokens": [
      {
        "token_id": "71321045679252212594626385532706912750332728571942532289631379312455583992563",
        "outcome": "Yes"
      },
      {
        "token_id": "52114319501245915516055106046884209969926127482827954674443846427813813222426",
        "outcome": "No"
      }
    ],
    "minimum_order_size": "1",
    "minimum_tick_size": "0.01",
    "market_slug": "bitcoin-100k-2024"
  }
]
```

### CLOB API Endpoints

#### Get Price
```
GET https://clob.polymarket.com/price?token_id={token_id}&side={buy|sell}
```

**Parameters:**
- `token_id` - ERC1155 token ID for the outcome
- `side` - Either "buy" or "sell"

**Response Structure:**
```json
{
  "price": "0.512"
}
```

## Updated Integration Architecture

### Market Data Fetcher Script

The `market-data-fetcher.js` script has been updated with the correct API structure:

```javascript
// Market data sources configuration with correct Polymarket URLs
const dataSources = {
  polymarket: {
    // Gamma API for market metadata and general market data
    gammaBaseUrl: "https://gamma-api.polymarket.com",
    // CLOB API for pricing and trading data
    clobBaseUrl: "https://clob.polymarket.com",
    headers: { 
      "Content-Type": "application/json",
      "User-Agent": "Chainlink-Functions-Client"
    }
  }
};
```

### Data Fetching Flow

1. **Market Discovery**: Use Gamma API to find markets by condition ID or search criteria
2. **Price Fetching**: Use CLOB API to get real-time pricing for specific tokens
3. **Data Aggregation**: Combine market metadata with pricing data
4. **Validation**: Ensure data quality and format for smart contract consumption

### Key Improvements

1. **Correct API Endpoints**: Now using official Polymarket APIs
2. **Proper Error Handling**: Graceful fallbacks when APIs are unavailable
3. **Token-Based Pricing**: Fetches prices for specific outcome tokens
4. **Market Metadata**: Rich market information including categories, descriptions, and status
5. **Real-Time Data**: Direct integration with live Polymarket order books

## Testing the Integration

### Install Dependencies
```bash
cd contract
npm install
```

### Run API Tests
```bash
npm run test:polymarket
```

This will test:
- Gamma API connectivity and market data fetching
- CLOB API pricing functionality
- End-to-end market data processing logic

### Expected Test Output
```
🚀 Starting Polymarket API Integration Tests

🧪 Testing Polymarket Gamma API...
✅ Gamma API Status: 200
📊 Number of markets returned: 5
📋 Sample Market Data:
   - ID: 0x1234567890abcdef...
   - Question: Will Bitcoin reach $100K by end of 2024?
   - Category: Crypto
   - Active: true
   - Tokens: 2
   - Token ID: 71321045679252212594626385532706912750332728571942532289631379312455583992563
   - Outcome: Yes

🧪 Testing Polymarket CLOB API...
✅ CLOB API Status: 200
💰 Buy Price: 0.512
💰 Sell Price: 0.488
📊 Spread: 0.0240

🧪 Testing Market Data Fetching Logic...
✅ Market Data Fetching Successful!
📋 Processed Market Data:
{
  "source": "polymarket",
  "marketId": "0x1234567890abcdef...",
  "question": "Will Bitcoin reach $100K by end of 2024?",
  "price": 0.512,
  "volume": 1000000,
  "liquidity": 50000,
  "lastUpdate": 1703721600,
  "active": true,
  "endDate": 1735689599,
  "outcomes": ["Yes", "No"],
  "metadata": {
    "category": "Crypto",
    "slug": "bitcoin-100k-2024",
    "description": "Will Bitcoin reach $100K by end of 2024?",
    "minOrderSize": "1",
    "closed": false
  }
}

✨ Tests completed!
```

## Smart Contract Integration

### ArbitrageCoordinator Contract

The contract uses the updated market data via Chainlink Functions:

```solidity
function requestMarketData(
    string memory marketId,
    uint256 chainId
) external onlyAuthorizedAgent returns (bytes32 requestId) {
    string[] memory args = new string[](2);
    args[0] = marketId;
    args[1] = uint2str(chainId);

    FunctionsRequest.Request memory req;
    req.initializeRequest(
        FunctionsRequest.Location.Inline, 
        FunctionsRequest.CodeLanguage.JavaScript, 
        marketDataScript
    );
    req.setArgs(args);

    requestId = _sendRequest(req.encodeCBOR(), subscriptionId, GAS_LIMIT, donId);
    
    pendingRequests[requestId] = AgentRequest({
        requestId: requestId,
        agent: msg.sender,
        requestType: "market_data",
        requestData: abi.encode(marketId, chainId),
        timestamp: block.timestamp
    });
}
```

### Data Processing

The contract processes the returned data:

```solidity
function _processMarketDataResponse(
    AgentRequest memory request, 
    bytes memory response
) internal {
    (string memory marketId, uint256 chainId) = abi.decode(request.requestData, (string, uint256));
    (uint256 price, uint256 volume, uint256 timestamp) = abi.decode(response, (uint256, uint256, uint256));
    
    markets[marketId] = MarketData({
        marketId: marketId,
        price: price,
        volume: volume,
        timestamp: timestamp,
        chainId: chainId,
        isActive: true
    });

    emit MarketDataUpdated(marketId, price, volume, chainId);
    _checkArbitrageOpportunities(marketId);
}
```

## Production Deployment

### Environment Variables

```bash
# No API key required for public Polymarket APIs
# But you may want to set rate limiting
POLYMARKET_RATE_LIMIT=100  # requests per minute
```

### Rate Limiting

The public Polymarket APIs have rate limits:
- **Gamma API**: ~100 requests per minute
- **CLOB API**: ~300 requests per minute

### Best Practices

1. **Caching**: Cache market data for 30-60 seconds to reduce API calls
2. **Error Handling**: Implement exponential backoff for failed requests
3. **Fallback Sources**: Use multiple prediction market sources for redundancy
4. **Monitoring**: Track API response times and success rates
5. **Data Validation**: Always validate price ranges (0-1) and market status

## Troubleshooting

### Common Issues

#### "No market data found"
- Verify the market ID (condition_id) is correct
- Check if the market is still active
- Try searching by market slug instead

#### "Price fetch failed"
- Ensure the token_id exists in the market
- Check if the market has active trading
- Verify CLOB API is accessible

#### "Rate limit exceeded"
- Implement request throttling
- Add delays between API calls
- Consider caching responses

### API Status

Check API status at:
- Gamma API: `https://gamma-api.polymarket.com/markets?limit=1`
- CLOB API: `https://clob.polymarket.com/price?token_id=1&side=buy`

## Next Steps

1. **Deploy Updated Scripts**: Update Chainlink Functions with the corrected script
2. **Test on Testnet**: Verify integration works with live data
3. **Monitor Performance**: Track API response times and success rates
4. **Scale Gradually**: Start with a few markets and expand
5. **Add More Sources**: Integrate additional prediction market APIs for redundancy

## Documentation Links

- [Polymarket Gamma API Documentation](https://docs.polymarket.com/developers/gamma-markets-api/overview)
- [Polymarket CLOB API Documentation](https://docs.polymarket.com/developers/CLOB/introduction)
- [Chainlink Functions Documentation](https://docs.chain.link/chainlink-functions)

## Support

For issues with:
- **Polymarket APIs**: [Polymarket Discord](https://discord.gg/polymarket)
- **Chainlink Integration**: [Chainlink Discord](https://discord.gg/chainlink)
- **Project Issues**: Create an issue in the repository 