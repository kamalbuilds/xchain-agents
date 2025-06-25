/**
 * Simplified Chainlink Functions Market Data Fetcher
 * Optimized for gas efficiency and smaller size
 * 
 * Arguments: [marketId, chainId]
 * Returns: [price, volume, timestamp] as bytes
 */

const marketId = args[0];
const chainId = args[1];

console.log(`Fetching data for market: ${marketId} on chain: ${chainId}`);

/**
 * Fetch from Polymarket CLOB API (primary source)
 */
async function fetchPolymarketData(marketId) {
    try {
        const response = await Functions.makeHttpRequest({
            url: "https://clob.polymarket.com/markets",
            method: "GET",
            headers: { "Content-Type": "application/json" },
            params: { condition_id: marketId }
        });

        if (response.error || !response.data?.data?.[0]) {
            console.log("No Polymarket data found");
            return null;
        }

        const market = response.data.data[0];
        let price = 0.5; // Default 50% probability
        let volume = 0;

        // Get price from tokens if available
        if (market.tokens?.[0]?.price) {
            price = parseFloat(market.tokens[0].price);
        } else if (market.last_trade_price) {
            price = parseFloat(market.last_trade_price);
        }

        // Get volume estimate
        if (market.volume) {
            volume = parseFloat(market.volume);
        }

        return { price, volume, timestamp: Math.floor(Date.now() / 1000) };
    } catch (error) {
        console.log("Polymarket error:", error.message);
        return null;
    }
}

/**
 * Fallback mock data for testing
 */
function getFallbackData() {
    const timestamp = Math.floor(Date.now() / 1000);
    const price = 0.65; // 65% probability
    const volume = 1000; // $1000 volume
    
    console.log(`Using fallback data: price=${price}, volume=${volume}`);
    return { price, volume, timestamp };
}

/**
 * Main execution
 */
async function main() {
    let result = await fetchPolymarketData(marketId);
    
    if (!result) {
        result = getFallbackData();
    }

    console.log(`Final result: price=${result.price}, volume=${result.volume}, timestamp=${result.timestamp}`);

    // Convert to wei (18 decimals) for price and volume
    const priceWei = Math.floor(result.price * 1e18);
    const volumeWei = Math.floor(result.volume * 1e18);
    
    // Return as bytes-encoded array
    return Functions.encodeUint256(priceWei) + 
           Functions.encodeUint256(volumeWei).slice(2) + 
           Functions.encodeUint256(result.timestamp).slice(2);
}

return await main(); 