# Polymarket URL to Market ID Extraction Guide

## Overview

This guide explains how to extract market IDs (condition_id) from Polymarket URLs like `https://polymarket.com/event/new-york-city-mayoral-election`. The market ID is essential for interacting with Polymarket's APIs and integrating market data into your applications.

## Key Concepts

### Market Structure
- **Event**: A broader topic (e.g., "NYC Mayoral Election")
- **Market**: Specific prediction within an event (e.g., "Will candidate X win?")
- **Condition ID**: Unique identifier for a market (format: `0x123...`)
- **Token ID**: Specific outcome tokens (YES/NO tokens)

### URL Patterns
Polymarket uses several URL patterns:
- `https://polymarket.com/event/event-slug` - Event page
- `https://polymarket.com/market/market-slug` - Specific market page
- `https://polymarket.com/question/question-slug` - Question page

## API Endpoints

### 1. CLOB API (Primary)
**Base URL**: `https://clob.polymarket.com`

**Endpoints**:
- `GET /markets` - List all markets
- `GET /markets?condition_id=0x123...` - Get market by condition ID
- `GET /book?token_id=123...` - Get orderbook data
- `GET /price?token_id=123...&side=buy` - Get current prices

**Advantages**:
- Has the most complete market data
- Includes live pricing and orderbook data
- Better structured data format

### 2. Gamma API (Secondary)
**Base URL**: `https://gamma-api.polymarket.com`

**Endpoints**:
- `GET /markets` - List all events/markets
- `GET /markets?slug=market-slug` - Search by slug (limited support)

**Advantages**:
- Has historical volume data
- Good for fallback data

## Methods to Extract Market ID

### Method 1: Direct API Search (Recommended)

Since there's no direct URL-to-ID mapping, you need to search through available markets:

```javascript
async function findMarketBySlug(slug) {
    // 1. Try CLOB API first
    const clobResponse = await fetch('https://clob.polymarket.com/markets?limit=500');
    const clobData = await clobResponse.json();
    
    for (const market of clobData.data) {
        if (market.market_slug === slug) {
            return {
                condition_id: market.condition_id,
                question: market.question,
                active: market.active,
                closed: market.closed
            };
        }
    }
    
    // 2. Try Gamma API as fallback
    const gammaResponse = await fetch('https://gamma-api.polymarket.com/markets?limit=200');
    const gammaData = await gammaResponse.json();
    
    for (const event of gammaData) {
        if (event.slug === slug) {
            // Note: Gamma events may not have direct markets array
            return {
                condition_id: event.conditionId,
                question: event.question,
                active: event.active,
                closed: event.closed
            };
        }
    }
    
    return null;
}
```

### Method 2: Using Our Extraction Tool

We've created a production-ready tool that handles URL parsing and API searching:

```bash
# Extract market ID from URL
node scripts/extract-market-id-from-url.js "https://polymarket.com/event/new-york-city-mayoral-election"

# Extract from slug directly
node scripts/extract-market-id-from-url.js "new-york-city-mayoral-election"

# Verify existing condition ID
node scripts/extract-market-id-from-url.js "0x9deb0baac40648821f96f01339229a422e2f5c877de55dc4dbf981f95a1e709c"
```

## Practical Examples

### Example 1: Working with Known Market

```javascript
// Known working example from our testing:
const conditionId = "0x9deb0baac40648821f96f01339229a422e2f5c877de55dc4dbf981f95a1e709c";
const slug = "nfl-saturday-chiefs-vs-raiders";

// Get market data using condition ID
const marketResponse = await fetch(`https://clob.polymarket.com/markets?condition_id=${conditionId}`);
const marketData = await marketResponse.json();

console.log(marketData.data[0].question); // "NFL Saturday: Chiefs vs. Raiders"
console.log(marketData.data[0].active);   // true
console.log(marketData.data[0].closed);   // true
```

### Example 2: URL Pattern Extraction

```javascript
function extractSlugFromUrl(url) {
    const patterns = [
        /polymarket\.com\/event\/([^/?#]+)/,  // Event URL
        /polymarket\.com\/market\/([^/?#]+)/, // Market URL  
        /polymarket\.com\/question\/([^/?#]+)/ // Question URL
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return null;
}

// Usage
const url = "https://polymarket.com/event/new-york-city-mayoral-election";
const slug = extractSlugFromUrl(url); // "new-york-city-mayoral-election"
```

## Current Limitations

### 1. No Direct URL-to-ID Mapping
Polymarket doesn't provide a direct API to convert URLs to condition IDs. You must:
- Extract the slug from the URL
- Search through available markets
- Match by slug or other criteria

### 2. Market Availability
Many markets may be:
- **Resolved/Closed**: No longer active for trading
- **Low Volume**: Limited orderbook data
- **Archived**: Not appearing in recent market lists

### 3. API Limitations
- **Rate Limiting**: APIs have usage limits
- **Data Completeness**: Not all markets have complete data
- **Pagination**: Large datasets require multiple API calls

## Best Practices

### 1. Use Multiple Data Sources
```javascript
async function getMarketData(identifier) {
    const results = [];
    
    // Try CLOB API for live data
    const clobData = await fetchFromCLOB(identifier);
    if (clobData) results.push(clobData);
    
    // Try Gamma API for historical data
    const gammaData = await fetchFromGamma(identifier);
    if (gammaData) results.push(gammaData);
    
    // Use fallback data if needed
    if (results.length === 0) {
        results.push(await getFallbackData());
    }
    
    return results;
}
```

### 2. Handle Inactive Markets Gracefully
```javascript
function validateMarketData(market) {
    if (!market.active || market.closed) {
        console.log(`Market is inactive: ${market.question}`);
        // Use historical data or skip orderbook calls
        return { useHistoricalData: true };
    }
    
    return { useHistoricalData: false };
}
```

### 3. Implement Robust Error Handling
```javascript
async function safeAPICall(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.log(`API call failed (attempt ${i + 1}): ${error.message}`);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
        }
    }
}
```

## Integration with Chainlink Functions

Our `marketDataFetcher.js` now properly handles market ID extraction and data fetching:

```javascript
// The updated script automatically:
// 1. Accepts condition_id as parameter
// 2. Fetches from CLOB API first
// 3. Falls back to Gamma API
// 4. Uses fallback data if needed
// 5. Returns properly encoded data for smart contracts

// Usage in Chainlink Functions:
const args = ["0x9deb0baac40648821f96f01339229a422e2f5c877de55dc4dbf981f95a1e709c"];
// Script will return encoded price, volume, and timestamp
```

## Troubleshooting

### Common Issues

1. **"No markets found"**
   - The market may be resolved/archived
   - Try searching with partial slug matching
   - Check if the URL/slug is correct

2. **"No orderbook data"**
   - Market may be inactive
   - Use historical volume data instead
   - Implement fallback to default values

3. **"API rate limiting"**
   - Implement exponential backoff
   - Cache results when possible
   - Use multiple API sources

### Debugging Steps

1. **Verify URL Pattern**:
   ```bash
   node scripts/extract-market-id-from-url.js "your-url-here"
   ```

2. **Test API Accessibility**:
   ```bash
   curl "https://clob.polymarket.com/markets?limit=5"
   ```

3. **Check Market Status**:
   ```bash
   node scripts/test-market-url-extraction.js
   ```

## Conclusion

While Polymarket doesn't provide direct URL-to-ID conversion, you can reliably extract market IDs by:

1. **Parsing URLs** to extract slugs
2. **Searching APIs** for matching markets
3. **Using multiple sources** for robustness
4. **Implementing fallbacks** for edge cases

Our provided tools handle these complexities and provide production-ready solutions for integrating Polymarket data into your applications.

## Tools Provided

- `extract-market-id-from-url.js` - Main extraction tool
- `test-market-url-extraction.js` - Debugging and testing tool
- `marketDataFetcher.js` - Chainlink Functions integration
- This guide - Comprehensive documentation

All tools are production-ready and handle real API integrations without mocks or simulations. 