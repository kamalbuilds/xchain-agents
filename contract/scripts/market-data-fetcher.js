/**
 * Chainlink Functions script for fetching prediction market data
 * Integrates with Polymarket API and other prediction market sources
 * Based on patterns from prediction-game sports-api.js
 */

const marketId = args[0]
const chainId = Number(args[1])

// Validate inputs
if (!marketId || marketId === "") {
  throw Error("Invalid marketId provided")
}
if (!chainId || chainId === 0) {
  throw Error("Invalid chainId provided")
}

// API Keys validation
if (!secrets.polymarketApiKey || secrets.polymarketApiKey === "") {
  throw Error("POLYMARKET_API_KEY not set. Get API access from Polymarket")
}

// Market data sources configuration
const dataSources = {
  polymarket: {
    baseUrl: "https://gamma-api.polymarket.com",
    headers: { 
      "Authorization": `Bearer ${secrets.polymarketApiKey}`,
      "Content-Type": "application/json"
    }
  },
  // Add more prediction market sources
  manifold: {
    baseUrl: "https://manifold.markets/api/v0",
    headers: {
      "Content-Type": "application/json"
    }
  }
}

/**
 * Fetch market data from Polymarket
 */
const fetchPolymarketData = async (marketId) => {
  try {
    // Get market info
    const marketResponse = await Functions.makeHttpRequest({
      url: `${dataSources.polymarket.baseUrl}/markets/${marketId}`,
      headers: dataSources.polymarket.headers
    })
    
    if (marketResponse.status !== 200) {
      throw new Error(`Polymarket API error: Status ${marketResponse.status}`)
    }
    
    const marketData = marketResponse.data
    
    // Get current price data (orderbook/trades)
    const priceResponse = await Functions.makeHttpRequest({
      url: `${dataSources.polymarket.baseUrl}/markets/${marketId}/prices`,
      headers: dataSources.polymarket.headers
    })
    
    if (priceResponse.status !== 200) {
      throw new Error(`Polymarket price API error: Status ${priceResponse.status}`)
    }
    
    const priceData = priceResponse.data
    
    // Get volume data
    const volumeResponse = await Functions.makeHttpRequest({
      url: `${dataSources.polymarket.baseUrl}/markets/${marketId}/volume`,
      headers: dataSources.polymarket.headers
    })
    
    const volumeData = volumeResponse.status === 200 ? volumeResponse.data : { volume: 0 }
    
    return {
      source: "polymarket",
      marketId: marketData.condition_id || marketId,
      question: marketData.question,
      price: parseFloat(priceData.price || priceData.mid_price || 0.5), // Default to 50% if no price
      volume: parseFloat(volumeData.volume || volumeData.total_volume || 0),
      liquidity: parseFloat(marketData.liquidity || 0),
      lastUpdate: Math.floor(Date.now() / 1000),
      active: marketData.active || true,
      endDate: marketData.end_date_iso ? new Date(marketData.end_date_iso).getTime() / 1000 : 0,
      outcomes: marketData.outcomes || ["Yes", "No"],
      metadata: {
        category: marketData.category,
        subCategory: marketData.subCategory,
        description: marketData.description,
        image: marketData.image
      }
    }
  } catch (error) {
    throw new Error(`Polymarket fetch error: ${error.message}`)
  }
}

/**
 * Fetch market data from Manifold Markets (backup/comparison source)
 */
const fetchManifoldData = async (marketId) => {
  try {
    const response = await Functions.makeHttpRequest({
      url: `${dataSources.manifold.baseUrl}/market/${marketId}`,
      headers: dataSources.manifold.headers
    })
    
    if (response.status !== 200) {
      throw new Error(`Manifold API error: Status ${response.status}`)
    }
    
    const data = response.data
    
    return {
      source: "manifold",
      marketId: data.id,
      question: data.question,
      price: data.probability || 0.5,
      volume: data.volume || 0,
      liquidity: data.totalLiquidity || 0,
      lastUpdate: Math.floor(Date.now() / 1000),
      active: !data.isResolved,
      endDate: data.closeTime ? new Date(data.closeTime).getTime() / 1000 : 0,
      outcomes: data.answers ? data.answers.map(a => a.text) : ["Yes", "No"],
      metadata: {
        category: data.groupSlugs ? data.groupSlugs[0] : "unknown",
        description: data.description,
        createdTime: data.createdTime
      }
    }
  } catch (error) {
    console.log(`Manifold fetch failed: ${error.message}`)
    return null // Return null if backup source fails
  }
}

/**
 * Aggregate market data from multiple sources
 */
const aggregateMarketData = (primaryData, secondaryData) => {
  if (!secondaryData) {
    return primaryData
  }
  
  // Calculate weighted average price if we have multiple sources
  const primaryWeight = Math.max(primaryData.volume, 1)
  const secondaryWeight = Math.max(secondaryData.volume, 1)
  const totalWeight = primaryWeight + secondaryWeight
  
  const aggregatedPrice = (
    (primaryData.price * primaryWeight) + 
    (secondaryData.price * secondaryWeight)
  ) / totalWeight
  
  return {
    ...primaryData,
    price: aggregatedPrice,
    volume: primaryData.volume + secondaryData.volume,
    liquidity: primaryData.liquidity + secondaryData.liquidity,
    sources: [primaryData.source, secondaryData.source],
    aggregated: true
  }
}

/**
 * Validate market data quality
 */
const validateMarketData = (data) => {
  if (!data) {
    throw new Error("No market data received")
  }
  
  if (!data.marketId) {
    throw new Error("Invalid market ID in response")
  }
  
  if (data.price < 0 || data.price > 1) {
    throw new Error(`Invalid price: ${data.price}. Must be between 0 and 1`)
  }
  
  if (data.volume < 0) {
    throw new Error(`Invalid volume: ${data.volume}. Must be non-negative`)
  }
  
  // Check if market is still active
  if (data.endDate && data.endDate < Math.floor(Date.now() / 1000)) {
    console.log("Warning: Market has ended")
  }
  
  return true
}

/**
 * Main execution function
 */
const getMarketData = async () => {
  try {
    // Primary source: Polymarket
    const primaryData = await fetchPolymarketData(marketId)
    
    // Secondary source: Manifold (for comparison/validation)
    let secondaryData = null
    try {
      secondaryData = await fetchManifoldData(marketId)
    } catch (error) {
      console.log(`Secondary source failed: ${error.message}`)
    }
    
    // Aggregate data from multiple sources
    const aggregatedData = aggregateMarketData(primaryData, secondaryData)
    
    // Validate the final data
    validateMarketData(aggregatedData)
    
    // Convert price to wei (multiply by 1e18 for precision)
    const priceWei = Math.floor(aggregatedData.price * 1e18)
    const volumeWei = Math.floor(aggregatedData.volume * 1e18)
    const timestamp = aggregatedData.lastUpdate
    
    // Return encoded data for the smart contract
    // Format: (uint256 price, uint256 volume, uint256 timestamp)
    return Functions.encodeUint256(priceWei) + 
           Functions.encodeUint256(volumeWei).slice(2) + 
           Functions.encodeUint256(timestamp).slice(2)
           
  } catch (error) {
    throw new Error(`Market data fetch failed: ${error.message}`)
  }
}

// Execute and return the result
return getMarketData() 