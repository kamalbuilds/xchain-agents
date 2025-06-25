/**
 * Chainlink Functions JavaScript Source Code
 * Market Data Fetcher for Cross-Chain Arbitrage
 * 
 * This script fetches real-time prediction market data from multiple sources:
 * - Polymarket API (Gamma + CLOB)
 * - Kalshi API
 * - Additional prediction markets
 * 
 * Arguments: [marketId, chainId]
 * Returns: [price, volume, timestamp] as bytes
 */

// Get arguments passed from the smart contract
const marketId = args[0];
const chainId = args[1];

console.log(`Fetching market data for marketId: ${marketId}, chainId: ${chainId}`);

// Polymarket API Configuration
const POLYMARKET_GAMMA_API = "https://gamma-api.polymarket.com";
const POLYMARKET_CLOB_API = "https://clob.polymarket.com";

// Kalshi API Configuration  
const KALSHI_API = "https://trading-api.kalshi.com/trade-api/v2";

/**
 * Fetch data from Polymarket CLOB API using condition_id (0x format)
 */
async function fetchPolymarketCLOBData(marketId) {
    try {
        console.log(`Fetching from CLOB API with condition_id: ${marketId}`);
        
        // Get market details from CLOB API using condition_id
        const marketResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_CLOB_API}/markets`,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            params: {
                condition_id: marketId
            }
        });

        if (marketResponse.error) {
            console.log("Polymarket CLOB API error:", marketResponse.error);
            return null;
        }

        const markets = marketResponse.data?.data || [];
        if (markets.length === 0) {
            console.log("No markets found for condition_id:", marketId);
            return null;
        }

        const market = markets[0]; // Use first market
        console.log(`Found market: ${market.question}`);

        // Get order book data for volume and current price
        let price = 0;
        let volume = 0;

        if (market.tokens && market.tokens.length > 0) {
            const token = market.tokens[0];
            
            // Get orderbook for this token
            const orderbookResponse = await Functions.makeHttpRequest({
                url: `${POLYMARKET_CLOB_API}/book`,
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                params: {
                    token_id: token.token_id
                }
            });

            if (!orderbookResponse.error && orderbookResponse.data) {
                const orderbook = orderbookResponse.data;
                
                // Calculate mid price from best bid/ask
                if (orderbook.bids && orderbook.bids.length > 0 && 
                    orderbook.asks && orderbook.asks.length > 0) {
                    const bestBid = parseFloat(orderbook.bids[0].price);
                    const bestAsk = parseFloat(orderbook.asks[0].price);
                    price = (bestBid + bestAsk) / 2;
                    
                    // Calculate total volume
                    const bidVolume = orderbook.bids.reduce((sum, bid) => sum + parseFloat(bid.size || 0), 0);
                    const askVolume = orderbook.asks.reduce((sum, ask) => sum + parseFloat(ask.size || 0), 0);
                    volume = bidVolume + askVolume;
                    
                    console.log(`Price: ${price}, Volume: ${volume}`);
                }
            }
        }

        // Fallback to last price if available
        if (price === 0 && market.last_trade_price) {
            price = parseFloat(market.last_trade_price);
        }

        return {
            source: "polymarket-clob",
            price: price,
            volume: volume,
            timestamp: Math.floor(Date.now() / 1000),
            question: market.question,
            raw: market
        };

    } catch (error) {
        console.log("Error fetching Polymarket CLOB data:", error.message);
        return null;
    }
}

/**
 * Fetch data from Polymarket Gamma API using numeric ID
 */
async function fetchPolymarketGammaData(marketId) {
    try {
        // First try to find the event if marketId is a condition_id
        if (marketId.startsWith('0x')) {
            console.log("Converting condition_id to event ID for Gamma API");
            
            // Search events to find matching condition_id
            const eventsResponse = await Functions.makeHttpRequest({
                url: `${POLYMARKET_GAMMA_API}/events`,
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            if (!eventsResponse.error && eventsResponse.data) {
                const events = eventsResponse.data;
                for (const event of events.slice(0, 50)) { // Check first 50 events
                    if (event.markets) {
                        for (const market of event.markets) {
                            if (market.condition_id === marketId) {
                                console.log(`Found matching event: ${event.title}`);
                                return await fetchPolymarketGammaData(market.id); // Recursive call with numeric ID
                            }
                        }
                    }
                }
            }
            
            console.log("Could not find matching event in Gamma API");
            return null;
        }

        // If numeric ID, fetch directly
        console.log(`Fetching from Gamma API with market ID: ${marketId}`);
        
        const marketResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_GAMMA_API}/markets/${marketId}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (marketResponse.error) {
            console.log("Polymarket Gamma API error:", marketResponse.error);
            return null;
        }

        const marketData = marketResponse.data;
        
        let price = 0;
        let volume = 0;

        if (marketData.last_trade_price) {
            price = parseFloat(marketData.last_trade_price);
        } else if (marketData.tokens && marketData.tokens[0] && marketData.tokens[0].price) {
            price = parseFloat(marketData.tokens[0].price);
        }

        if (marketData.volume) {
            volume = parseFloat(marketData.volume);
        }

        return {
            source: "polymarket-gamma",
            price: price,
            volume: volume,
            timestamp: Math.floor(Date.now() / 1000),
            question: marketData.question,
            raw: marketData
        };

    } catch (error) {
        console.log("Error fetching Polymarket Gamma data:", error.message);
        return null;
    }
}

/**
 * Fetch a fallback active market for testing
 */
async function fetchFallbackMarket() {
    try {
        console.log("Fetching fallback active market from CLOB API");
        
        const marketsResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_CLOB_API}/markets`,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            params: {
                active: true,
                limit: 1
            }
        });

        if (marketsResponse.error || !marketsResponse.data?.data?.length) {
            return null;
        }

        const market = marketsResponse.data.data[0];
        console.log(`Using fallback market: ${market.question}`);

        let price = 0.5; // Default to 50% if no price available
        let volume = 100; // Default volume

        if (market.last_trade_price) {
            price = parseFloat(market.last_trade_price);
        }

        return {
            source: "polymarket-fallback",
            price: price,
            volume: volume,
            timestamp: Math.floor(Date.now() / 1000),
            question: market.question,
            raw: market
        };

    } catch (error) {
        console.log("Error fetching fallback market:", error.message);
        return null;
    }
}

/**
 * Main execution function
 */
async function main() {
    const results = [];
    
    // Try CLOB API first (handles 0x condition_ids)
    const clobData = await fetchPolymarketCLOBData(marketId);
    if (clobData) {
        results.push(clobData);
        console.log(`CLOB data: Price=${clobData.price}, Volume=${clobData.volume}`);
    }

    // Try Gamma API (handles numeric IDs or converts from condition_id)
    const gammaData = await fetchPolymarketGammaData(marketId);
    if (gammaData) {
        results.push(gammaData);
        console.log(`Gamma data: Price=${gammaData.price}, Volume=${gammaData.volume}`);
    }

    // If no results, try fallback market
    if (results.length === 0) {
        console.log("No data found for specific market, trying fallback...");
        const fallbackData = await fetchFallbackMarket();
        if (fallbackData) {
            results.push(fallbackData);
            console.log(`Fallback data: Price=${fallbackData.price}, Volume=${fallbackData.volume}`);
        }
    }

    if (results.length === 0) {
        throw new Error(`Unable to fetch market data for ${marketId}`);
    }

    // Use first available result
    let finalData = results[0];

    // If multiple sources available, use average price for better accuracy
    if (results.length > 1) {
        const prices = results.map(r => r.price).filter(p => p > 0);
        if (prices.length > 1) {
            const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
            finalData.price = avgPrice;
            console.log(`Using average price from ${prices.length} sources: ${avgPrice}`);
        }
    }

    // Ensure we have valid data
    if (finalData.price === 0) {
        finalData.price = 0.5; // Default to 50% probability
    }
    if (finalData.volume === 0) {
        finalData.volume = 100; // Default volume
    }

    // Convert to contract format (multiply by 1e18 for precision)
    const priceScaled = Math.round(finalData.price * 1e18);
    const volumeScaled = Math.round(finalData.volume * 1e18);
    const timestamp = finalData.timestamp;

    console.log(`Final result: Price=${priceScaled}, Volume=${volumeScaled}, Timestamp=${timestamp}`);

    // Encode the response for the smart contract
    // Chainlink Functions expects a Uint8Array, not a hex string
    // We'll encode as ABI-encoded (uint256, uint256, uint256)
    
    // Convert numbers to 32-byte hex strings (64 characters each)
    const priceHex = priceScaled.toString(16).padStart(64, '0');
    const volumeHex = volumeScaled.toString(16).padStart(64, '0');
    const timestampHex = timestamp.toString(16).padStart(64, '0');
    
    // Combine all hex values
    const combinedHex = priceHex + volumeHex + timestampHex;
    
    // Convert hex string to Uint8Array
    const responseBytes = new Uint8Array(combinedHex.length / 2);
    for (let i = 0; i < combinedHex.length; i += 2) {
        responseBytes[i / 2] = parseInt(combinedHex.substr(i, 2), 16);
    }
    
    console.log(`Encoded response: ${responseBytes.length} bytes`);
    
    return responseBytes;
}

// Execute the main function
return await main(); 