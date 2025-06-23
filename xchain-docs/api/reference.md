# 📚 API Reference
## Complete API documentation for Chainlink Multi-Agent Swarm

## 🌐 **Base Configuration**

### **Endpoints**
- **Production**: `https://api.xchain-agents.ai`
- **Staging**: `https://staging-api.xchain-agents.ai`
- **Local Development**: `http://localhost:3000`

### **Authentication**
All API requests require authentication via API key or wallet signature.

```bash
# API Key Authentication
curl -H "X-API-Key: your_api_key" \
     -H "Content-Type: application/json" \
     "https://api.xchain-agents.ai/v1/markets/scan"

# Wallet Signature Authentication
curl -H "Authorization: Bearer your_jwt_token" \
     -H "Content-Type: application/json" \
     "https://api.xchain-agents.ai/v1/markets/scan"
```

## 🎯 **Core Endpoints**

### **Market Analysis**

#### **GET /api/v1/markets/scan**
Scan for arbitrage opportunities across all supported chains.

**Parameters:**
- `chains` (optional): Array of chain IDs to scan
- `minProfit` (optional): Minimum profit margin (default: 0.02)
- `maxRisk` (optional): Maximum risk level (default: "medium")

**Response:**
```json
{
  "success": true,
  "data": {
    "opportunities": [
      {
        "id": "btc-100k-eth-poly",
        "marketId": "BTC-100K-2024",
        "sourceChain": 11155111,
        "targetChain": 80002,
        "sourcePrice": 0.72,
        "targetPrice": 0.75,
        "profitMargin": 0.0417,
        "estimatedGasCost": 0.0015,
        "netProfit": 0.0402,
        "riskLevel": "low",
        "confidence": 0.89,
        "expiresAt": "2024-12-31T23:59:59Z"
      }
    ],
    "totalOpportunities": 1,
    "averageProfit": 0.0402,
    "scanDuration": 1.2
  },
  "timestamp": "2024-12-01T12:00:00Z"
}
```

**Example:**
```bash
curl -X GET "https://api.xchain-agents.ai/v1/markets/scan?minProfit=0.03&chains=11155111,80002" \
  -H "X-API-Key: your_api_key"
```

#### **GET /api/v1/markets/{marketId}/prediction**
Get AI-generated predictions for a specific market.

**Parameters:**
- `marketId` (required): Market identifier
- `timeHorizon` (optional): Prediction time horizon (1h, 4h, 1d, 1w)
- `includeConfidence` (optional): Include confidence intervals

**Response:**
```json
{
  "success": true,
  "data": {
    "marketId": "BTC-100K-2024",
    "prediction": {
      "probability": 0.73,
      "confidence": 0.89,
      "trend": "bullish",
      "volatility": 0.24,
      "keyFactors": [
        "Strong institutional adoption",
        "Regulatory clarity improving",
        "Technical indicators bullish"
      ]
    },
    "priceTargets": {
      "conservative": 0.68,
      "moderate": 0.73,
      "aggressive": 0.81
    },
    "timeHorizon": "1d",
    "generatedAt": "2024-12-01T12:00:00Z"
  }
}
```

### **Strategy Execution**

#### **POST /api/v1/strategies/execute**
Execute an arbitrage strategy.

**Request Body:**
```json
{
  "opportunityId": "btc-100k-eth-poly",
  "amount": 1000,
  "slippageTolerance": 0.005,
  "maxGasPrice": 30,
  "userAddress": "0x1234567890123456789012345678901234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "exec_5f8a2c1b9d3e",
    "status": "initiated",
    "estimatedCompletion": "2024-12-01T12:15:00Z",
    "transactions": [
      {
        "chain": 11155111,
        "txHash": "0xabc123...",
        "status": "pending",
        "type": "entry"
      }
    ],
    "estimatedProfit": 40.2,
    "fees": {
      "chainlinkServices": 1.5,
      "gasFees": 3.2,
      "total": 4.7
    }
  }
}
```

#### **GET /api/v1/strategies/{executionId}/status**
Get execution status for a strategy.

**Response:**
```json
{
  "success": true,
  "data": {
    "executionId": "exec_5f8a2c1b9d3e",
    "status": "completed",
    "progress": 100,
    "transactions": [
      {
        "chain": 11155111,
        "txHash": "0xabc123...",
        "status": "confirmed",
        "type": "entry",
        "blockNumber": 18500123,
        "gasUsed": 150000
      },
      {
        "chain": 80002,
        "txHash": "0xdef456...",
        "status": "confirmed",
        "type": "exit",
        "blockNumber": 42300456,
        "gasUsed": 120000
      }
    ],
    "actualProfit": 38.7,
    "executionTime": 247,
    "completedAt": "2024-12-01T12:14:07Z"
  }
}
```

### **Portfolio Management**

#### **GET /api/v1/portfolio/{address}**
Get portfolio overview for a user.

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x1234567890123456789012345678901234567890",
    "totalValue": 15847.32,
    "totalPnL": 2341.18,
    "totalPnLPercent": 17.34,
    "activePositions": 3,
    "completedStrategies": 27,
    "successRate": 0.926,
    "averageProfit": 86.7,
    "positions": [
      {
        "id": "pos_abc123",
        "marketId": "ETH-5K-2024",
        "status": "active",
        "entryPrice": 0.42,
        "currentPrice": 0.45,
        "unrealizedPnL": 71.4,
        "amount": 500,
        "openedAt": "2024-11-28T14:30:00Z"
      }
    ],
    "riskMetrics": {
      "totalExposure": 2500,
      "riskLevel": "medium",
      "dailyVaR": 125.6,
      "maxDrawdown": 189.3
    }
  }
}
```

#### **POST /api/v1/portfolio/{address}/withdraw**
Withdraw profits from completed strategies.

**Request Body:**
```json
{
  "amount": 1000,
  "token": "USDC",
  "toAddress": "0x1234567890123456789012345678901234567890"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "withdrawalId": "wd_xyz789",
    "amount": 1000,
    "token": "USDC",
    "txHash": "0x123abc...",
    "status": "pending",
    "estimatedCompletion": "2024-12-01T12:05:00Z"
  }
}
```

## 🤖 **Agent Endpoints**

### **Agent Communication**

#### **POST /api/v1/agents/{agentId}/message**
Send a message to a specific agent.

**Request Body:**
```json
{
  "message": "Scan for BTC arbitrage opportunities",
  "parameters": {
    "minProfit": 0.03,
    "timeHorizon": "1h"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "msg_abc123",
    "agentId": "arbitrage-coordinator",
    "status": "processing",
    "estimatedResponse": "2024-12-01T12:02:00Z"
  }
}
```

#### **GET /api/v1/agents/{agentId}/status**
Get agent health and status.

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "arbitrage-coordinator",
    "status": "online",
    "uptime": 345600,
    "lastActivity": "2024-12-01T11:58:00Z",
    "performance": {
      "messagesProcessed": 1247,
      "averageResponseTime": 2.3,
      "successRate": 0.967,
      "errorsLastHour": 0
    },
    "capabilities": [
      "market-scanning",
      "strategy-execution",
      "risk-assessment"
    ]
  }
}
```

### **Agent Analytics**

#### **GET /api/v1/agents/{agentId}/performance**
Get detailed performance metrics for an agent.

**Response:**
```json
{
  "success": true,
  "data": {
    "agentId": "market-intelligence",
    "period": "7d",
    "metrics": {
      "opportunitiesDetected": 127,
      "accuracyRate": 0.891,
      "profitableTrades": 89,
      "totalProfit": 2847.65,
      "averageExecutionTime": 4.2,
      "chainlinkRequestsUsed": 245
    },
    "timeline": [
      {
        "date": "2024-11-25",
        "opportunities": 18,
        "profits": 423.12,
        "accuracy": 0.89
      }
    ]
  }
}
```

## 🔗 **Chainlink Integration Endpoints**

### **Service Status**

#### **GET /api/v1/chainlink/services/status**
Get status of all Chainlink services.

**Response:**
```json
{
  "success": true,
  "data": {
    "ccip": {
      "status": "operational",
      "supportedChains": 5,
      "lastMessage": "2024-12-01T11:59:00Z",
      "messageCount24h": 47
    },
    "functions": {
      "status": "operational",
      "subscriptionBalance": 15.6,
      "requestsRemaining": 234,
      "lastRequest": "2024-12-01T11:57:00Z"
    },
    "vrf": {
      "status": "operational",
      "subscriptionBalance": 8.3,
      "requestsRemaining": 156,
      "lastRequest": "2024-12-01T11:45:00Z"
    },
    "automation": {
      "status": "operational",
      "activeJobs": 12,
      "lastExecution": "2024-12-01T11:58:30Z"
    },
    "dataStreams": {
      "status": "operational",
      "feedsActive": 25,
      "lastUpdate": "2024-12-01T11:59:55Z",
      "updateFrequency": 5.2
    }
  }
}
```

### **Cross-Chain Operations**

#### **POST /api/v1/chainlink/ccip/send**
Send a cross-chain message via CCIP.

**Request Body:**
```json
{
  "destinationChain": 80002,
  "receiver": "0x1234567890123456789012345678901234567890",
  "data": "0xabcd1234...",
  "tokenTransfers": [
    {
      "token": "0x...",
      "amount": "1000000000000000000"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "messageId": "0x5f8a2c1b9d3e...",
    "sourceChain": 11155111,
    "destinationChain": 80002,
    "estimatedDelivery": "2024-12-01T12:08:00Z",
    "fees": {
      "link": "0.5",
      "native": "0.002"
    }
  }
}
```

## 📊 **Analytics Endpoints**

### **Performance Analytics**

#### **GET /api/v1/analytics/performance**
Get system-wide performance analytics.

**Parameters:**
- `period` (optional): Time period (1h, 1d, 7d, 30d)
- `metric` (optional): Specific metric to focus on

**Response:**
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "overview": {
      "totalStrategiesExecuted": 189,
      "successRate": 0.926,
      "totalProfit": 12847.32,
      "averageProfit": 67.97,
      "totalVolume": 287450.12
    },
    "chainBreakdown": [
      {
        "chainId": 11155111,
        "name": "Ethereum Sepolia",
        "strategies": 67,
        "profit": 4523.18,
        "successRate": 0.94
      }
    ],
    "agentPerformance": [
      {
        "agentId": "arbitrage-coordinator",
        "uptime": 0.999,
        "efficiency": 0.934,
        "profitContribution": 5642.77
      }
    ]
  }
}
```

### **Risk Analytics**

#### **GET /api/v1/analytics/risk**
Get risk analysis and metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "systemRisk": {
      "level": "low",
      "score": 0.23,
      "factors": [
        "Market volatility within normal range",
        "Cross-chain liquidity stable",
        "All agents operational"
      ]
    },
    "exposureAnalysis": {
      "totalExposure": 45000,
      "maxSinglePosition": 2500,
      "diversificationScore": 0.87,
      "correlationRisk": 0.34
    },
    "recentAlerts": []
  }
}
```

## 🔔 **WebSocket Events**

### **Connection**
```javascript
const ws = new WebSocket('wss://api.xchain-agents.ai/ws');

// Authenticate
ws.send(JSON.stringify({
  type: 'auth',
  token: 'your_jwt_token'
}));
```

### **Event Types**

#### **opportunity_detected**
```json
{
  "type": "opportunity_detected",
  "data": {
    "opportunityId": "btc-100k-eth-poly",
    "profitMargin": 0.0417,
    "expiresIn": 300
  },
  "timestamp": "2024-12-01T12:00:00Z"
}
```

#### **execution_update**
```json
{
  "type": "execution_update",
  "data": {
    "executionId": "exec_5f8a2c1b9d3e",
    "status": "tx_confirmed",
    "progress": 75,
    "message": "Exit transaction confirmed on Polygon"
  },
  "timestamp": "2024-12-01T12:05:00Z"
}
```

#### **agent_alert**
```json
{
  "type": "agent_alert",
  "data": {
    "agentId": "market-intelligence",
    "level": "warning",
    "message": "High volatility detected in BTC markets",
    "action": "increased_monitoring"
  },
  "timestamp": "2024-12-01T12:00:00Z"
}
```

## ❌ **Error Handling**

### **Error Response Format**
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_BALANCE",
    "message": "Insufficient LINK balance for Chainlink services",
    "details": {
      "required": "2.5",
      "available": "1.2",
      "service": "vrf"
    }
  },
  "timestamp": "2024-12-01T12:00:00Z"
}
```

### **Common Error Codes**

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `INVALID_API_KEY` | API key is invalid or expired | 401 |
| `INSUFFICIENT_BALANCE` | Not enough balance for operation | 400 |
| `OPPORTUNITY_EXPIRED` | Arbitrage opportunity no longer available | 410 |
| `AGENT_UNAVAILABLE` | Requested agent is offline | 503 |
| `CHAIN_CONGESTION` | Network congestion causing delays | 503 |
| `SLIPPAGE_EXCEEDED` | Price moved beyond slippage tolerance | 400 |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded | 429 |

## 📊 **Rate Limits**

| Endpoint Type | Rate Limit | Burst Limit |
|---------------|------------|-------------|
| **Market Data** | 100/minute | 200/minute |
| **Strategy Execution** | 10/minute | 20/minute |
| **Portfolio Queries** | 60/minute | 120/minute |
| **Agent Commands** | 30/minute | 60/minute |
| **Analytics** | 50/minute | 100/minute |

## 🔐 **Authentication**

### **API Key Authentication**
```bash
curl -H "X-API-Key: sk_live_abc123..." \
     "https://api.xchain-agents.ai/v1/markets/scan"
```

### **JWT Token Authentication**
```bash
# Get token
curl -X POST "https://api.xchain-agents.ai/v1/auth/wallet" \
     -H "Content-Type: application/json" \
     -d '{
       "address": "0x...",
       "signature": "0x...",
       "message": "Login to XChain Agents"
     }'

# Use token
curl -H "Authorization: Bearer eyJ0eXAiOiJKV1Q..." \
     "https://api.xchain-agents.ai/v1/portfolio/0x..."
```

---

This comprehensive API documentation provides everything you need to integrate with the Chainlink Multi-Agent Swarm system. For additional support, join our [Discord community](https://discord.gg/xchain-agents) or check the [troubleshooting guide](../reference/troubleshooting.md). 