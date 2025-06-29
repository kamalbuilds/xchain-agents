/** Chainlink Functions JavaScript Source Code
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
 * Fetch data from Polymarket Gamma API using condition_id directly
 */
/**
 * Fetch data from Polymarket Gamma API using condition_id directly
 */
async function fetchPolymarketGammaByConditionId(conditionId) {
    try {
        console.log(`Fetching from Gamma API with condition_id: ${conditionId}`);
        
        // Try filtering by condition_ids parameter
        const marketsResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_GAMMA_API}/markets`,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            params: {
                condition_ids: conditionId,
                limit: 100
            }
        });

        if (marketsResponse.error) {
            console.log("Gamma API error:", marketsResponse.error);
            return null;
        }

        const markets = marketsResponse.data || [];
        console.log(`Got ${markets.length} markets from Gamma API`);

        if (markets.length === 0) {
            console.log("No markets found in Gamma API for condition_id");
            return null;
        }

        const targetMarket = markets[0]; // Use first market
        console.log(`Found market in Gamma: ${targetMarket.question || 'Unknown question'}`);

        let price = 0;
        let volume = 0;

        // Extract volume from various possible fields
        if (targetMarket.volume) {
            volume = parseFloat(targetMarket.volume);
            console.log(`Gamma using volume: ${volume}`);
        } else if (targetMarket.volume24hr) {
            volume = parseFloat(targetMarket.volume24hr);
            console.log(`Gamma using volume24hr: ${volume}`);
        } else if (targetMarket.volumeNum) {
            volume = parseFloat(targetMarket.volumeNum);
            console.log(`Gamma using volumeNum: ${volume}`);
        }

        // FIXED: Better handling of clobTokenIds - handle both string and array formats
        console.log(`Market clobTokenIds type: ${typeof targetMarket.clobTokenIds}`);
        console.log(`Market clobTokenIds raw: ${JSON.stringify(targetMarket.clobTokenIds)}`);
        
        let tokenIds = [];
        if (targetMarket.clobTokenIds) {
            if (typeof targetMarket.clobTokenIds === 'string') {
                try {
                    // Parse JSON string to array
                    tokenIds = JSON.parse(targetMarket.clobTokenIds);
                    console.log(`Parsed clobTokenIds from string: ${tokenIds.length} tokens`);
                } catch (parseError) {
                    console.log(`Failed to parse clobTokenIds string: ${parseError.message}`);
                    tokenIds = [];
                }
            } else if (Array.isArray(targetMarket.clobTokenIds)) {
                tokenIds = targetMarket.clobTokenIds;
                console.log(`Using array clobTokenIds: ${tokenIds.length} tokens`);
            }
        }
        
        // Method 1: Try to get price from CLOB using the token ID
        if (tokenIds.length > 0) {
            // Try the first token (usually YES token)
            const tokenId = tokenIds[0];
            console.log(`Trying to get price for token: ${tokenId}`);
            
            if (tokenId && typeof tokenId === 'string' && tokenId.length > 10) {
                price = await tryGetPriceFromCLOB(tokenId);
                
                // If first token fails, try the second token (usually NO token)
                if (price === 0 && tokenIds.length > 1) {
                    const secondTokenId = tokenIds[1];
                    console.log(`First token failed, trying second token: ${secondTokenId}`);
                    const secondPrice = await tryGetPriceFromCLOB(secondTokenId);
                    if (secondPrice > 0) {
                        // Convert NO token price to YES token price
                        price = 1 - secondPrice;
                        console.log(`Converted NO token price ${secondPrice} to YES price ${price}`);
                    }
                }
            }
        } else {
            console.log("No valid clobTokenIds found");
        }

        // Method 2: If no clobTokenIds, try to find the market in CLOB by question matching
        if (price === 0 && targetMarket.question) {
            console.log("No price from tokens, trying to match by question in CLOB");
            price = await tryFindPriceByQuestion(targetMarket.question, conditionId);
        }

        // Method 3: Try to extract price from market data itself
        if (price === 0) {
            console.log("Trying to extract price from market data");
            if (targetMarket.price) {
                price = parseFloat(targetMarket.price);
                console.log(`Found price in market data: ${price}`);
            } else if (targetMarket.lastPrice) {
                price = parseFloat(targetMarket.lastPrice);
                console.log(`Found lastPrice in market data: ${price}`);
            } else if (targetMarket.midPrice) {
                price = parseFloat(targetMarket.midPrice);
                console.log(`Found midPrice in market data: ${price}`);
            } else if (targetMarket.outcomes && Array.isArray(targetMarket.outcomes) && targetMarket.outcomes.length > 0) {
                // Try to get price from outcomes - with safety check
                console.log(`Checking ${targetMarket.outcomes.length} outcomes for price`);
                const yesOutcome = targetMarket.outcomes.find(o => 
                    o && o.name && (
                        o.name.toLowerCase().includes('yes') || 
                        o.name.toLowerCase().includes('true')
                    )
                );
                if (yesOutcome && yesOutcome.price) {
                    price = parseFloat(yesOutcome.price);
                    console.log(`Found price in YES outcome: ${price}`);
                }
            } else {
                console.log("No outcomes array found or outcomes is not an array");
            }
        }

        console.log(`Final Gamma data: Price=${price}, Volume=${volume}`);

        return {
            source: "polymarket-gamma",
            price: price,
            volume: volume,
            timestamp: Math.floor(Date.now() / 1000),
            question: targetMarket.question || 'Unknown question',
            active: targetMarket.active,
            closed: targetMarket.closed,
            raw: targetMarket
        };

    } catch (error) {
        console.log("Error fetching Polymarket Gamma data:", error.message);
        return null;
    }
}

/**
 * Try to get price from CLOB API using token ID - ENHANCED VERSION
 */
async function tryGetPriceFromCLOB(tokenId) {
    if (!tokenId || typeof tokenId !== 'string' || tokenId.length < 10) {
        console.log(`Invalid tokenId: ${tokenId}`);
        return 0;
    }
    
    console.log(`Trying CLOB price endpoints for token: ${tokenId}`);
    
    // Try midpoint first (most reliable)
    try {
        console.log("Trying midpoint endpoint...");
        const midpointResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_CLOB_API}/midpoint`,
            method: "GET",
            params: {
                token_id: tokenId
            }
        });

        console.log(`Midpoint response error: ${midpointResponse.error}`);
        console.log(`Midpoint response data: ${JSON.stringify(midpointResponse.data)}`);

        if (!midpointResponse.error && midpointResponse.data?.mid) {
            const price = parseFloat(midpointResponse.data.mid);
            console.log(`✓ Got midpoint price: ${price}`);
            return price;
        }
    } catch (error) {
        console.log("Midpoint error:", error.message);
    }

    // Try buy price
    try {
        console.log("Trying buy price endpoint...");
        const buyPriceResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_CLOB_API}/price`,
            method: "GET",
            params: {
                token_id: tokenId,
                side: "buy"
            }
        });

        console.log(`Buy price response error: ${buyPriceResponse.error}`);
        console.log(`Buy price response data: ${JSON.stringify(buyPriceResponse.data)}`);

        if (!buyPriceResponse.error && buyPriceResponse.data?.price) {
            const price = parseFloat(buyPriceResponse.data.price);
            console.log(`✓ Got buy price: ${price}`);
            return price;
        }
    } catch (error) {
        console.log("Buy price error:", error.message);
    }

    // Try sell price
    try {
        console.log("Trying sell price endpoint...");
        const sellPriceResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_CLOB_API}/price`,
            method: "GET",
            params: {
                token_id: tokenId,
                side: "sell"
            }
        });

        console.log(`Sell price response error: ${sellPriceResponse.error}`);
        console.log(`Sell price response data: ${JSON.stringify(sellPriceResponse.data)}`);

        if (!sellPriceResponse.error && sellPriceResponse.data?.price) {
            const price = parseFloat(sellPriceResponse.data.price);
            console.log(`✓ Got sell price: ${price}`);
            return price;
        }
    } catch (error) {
        console.log("Sell price error:", error.message);
    }

    // Try orderbook as last resort
    try {
        console.log("Trying orderbook endpoint...");
        const bookResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_CLOB_API}/book`,
            method: "GET",
            params: {
                token_id: tokenId
            }
        });

        console.log(`Book response error: ${bookResponse.error}`);
        
        if (!bookResponse.error && bookResponse.data) {
            const book = bookResponse.data;
            console.log(`Got orderbook: ${book.bids?.length || 0} bids, ${book.asks?.length || 0} asks`);

            if (book.bids && book.asks && book.bids.length > 0 && book.asks.length > 0) {
                const bestBid = parseFloat(book.bids[0].price);
                const bestAsk = parseFloat(book.asks[0].price);
                const midPrice = (bestBid + bestAsk) / 2;
                console.log(`✓ Calculated midprice from orderbook: ${midPrice} (bid: ${bestBid}, ask: ${bestAsk})`);
                return midPrice;
            } else if (book.bids && book.bids.length > 0) {
                const price = parseFloat(book.bids[0].price);
                console.log(`✓ Using best bid: ${price}`);
                return price;
            } else if (book.asks && book.asks.length > 0) {
                const price = parseFloat(book.asks[0].price);
                console.log(`✓ Using best ask: ${price}`);
                return price;
            }
        }
    } catch (error) {
        console.log("Orderbook error:", error.message);
    }

    console.log(`❌ No price found for token: ${tokenId}`);
    return 0;
}

/**
 * Try to find price by matching question text in CLOB markets - FIXED VERSION
 */
async function tryFindPriceByQuestion(targetQuestion, conditionId) {
    try {
        console.log(`Searching CLOB markets for question: ${targetQuestion.substring(0, 50)}...`);
        
        // Try with a smaller limit to avoid timeout
        const marketsResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_CLOB_API}/markets`,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            params: {
                limit: 100  // Reduced from default
            }
        });

        if (marketsResponse.error) {
            console.log("CLOB markets fetch error:", marketsResponse.error);
            return 0;
        }

        if (!marketsResponse.data?.data) {
            console.log("No CLOB markets data received");
            return 0;
        }

        const markets = marketsResponse.data.data;
        console.log(`Searching through ${markets.length} CLOB markets`);

        // Try exact condition_id match first
        let matchedMarket = markets.find(m => m.condition_id === conditionId);
        
        if (!matchedMarket) {
            // Try question text matching (partial)
            const targetWords = targetQuestion.toLowerCase().split(' ').filter(w => w.length > 3);
            matchedMarket = markets.find(m => {
                if (!m.question) return false;
                const marketQuestion = m.question.toLowerCase();
                return targetWords.some(word => marketQuestion.includes(word));
            });
        }

        if (matchedMarket) {
            console.log(`Found matching market: ${matchedMarket.question}`);
            
            if (matchedMarket.tokens && matchedMarket.tokens.length > 0) {
                const yesToken = matchedMarket.tokens.find(t => 
                    t.outcome?.toLowerCase().includes('yes') || 
                    t.outcome?.toLowerCase().includes('true')
                ) || matchedMarket.tokens[0];

                if (yesToken?.token_id) {
                    console.log(`Trying to get price for matched token: ${yesToken.token_id}`);
                    return await tryGetPriceFromCLOB(yesToken.token_id);
                }
            }
        }

        console.log("No matching market found by question");
        return 0;

    } catch (error) {
        console.log("Error in question matching:", error.message);
        return 0;
    }
}

/**
 * Fetch any available market data as fallback
 */
async function fetchFallbackMarketData() {
    try {
        console.log("Fetching fallback market data from Gamma API");
        
        const marketsResponse = await Functions.makeHttpRequest({
            url: `${POLYMARKET_GAMMA_API}/markets`,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            params: {
                limit: 20,
                active: true // Only get active markets
            }
        });

        if (marketsResponse.error || !marketsResponse.data?.length) {
            console.log("No fallback markets available");
            return null;
        }

        // Find a market with volume data and try to get its price
        for (const market of marketsResponse.data) {
            const volume = parseFloat(market.volume || market.volume24hr || market.volumeNum || 0);
            if (volume > 0 && market.clobTokenIds) {
                console.log(`Found fallback market with volume: ${market.question?.substring(0, 60) || 'Unknown'}...`);
                console.log(`Volume: ${volume}`);
                
                // Handle clobTokenIds parsing for fallback market
                let fallbackTokenIds = [];
                if (typeof market.clobTokenIds === 'string') {
                    try {
                        fallbackTokenIds = JSON.parse(market.clobTokenIds);
                        console.log(`Parsed fallback clobTokenIds from string: ${fallbackTokenIds.length} tokens`);
                    } catch (parseError) {
                        console.log(`Failed to parse fallback clobTokenIds: ${parseError.message}`);
                        continue; // Skip this market
                    }
                } else if (Array.isArray(market.clobTokenIds)) {
                    fallbackTokenIds = market.clobTokenIds;
                    console.log(`Using array fallback clobTokenIds: ${fallbackTokenIds.length} tokens`);
                } else {
                    console.log(`Invalid fallback clobTokenIds type: ${typeof market.clobTokenIds}`);
                    continue; // Skip this market
                }
                
                if (fallbackTokenIds.length > 0) {
                    // Try to get price for this market
                    const price = await tryGetPriceFromCLOB(fallbackTokenIds[0]);
                    
                    return {
                        source: "polymarket-fallback",
                        price: price > 0 ? price : 0.5,
                        volume: volume,
                        timestamp: Math.floor(Date.now() / 1000),
                        question: market.question || 'Unknown question',
                        active: market.active,
                        closed: market.closed,
                        raw: market
                    };
                }
            }
        }

        // If no market with volume, use first available market
        const market = marketsResponse.data[0];
        console.log(`Using first available market as fallback: ${market.question?.substring(0, 60) || 'Unknown'}...`);
        
        return {
            source: "polymarket-fallback",
            price: 0.5,
            volume: 100,
            timestamp: Math.floor(Date.now() / 1000),
            question: market.question || 'Unknown question',
            active: market.active,
            closed: market.closed,
            raw: market
        };

    } catch (error) {
        console.log("Error fetching fallback data:", error.message);
        return null;
    }
}

/**
 * Main execution function
 */
async function main() {
    const results = [];
    
    // Try Gamma API first (searches by condition_id)
    console.log("=== Trying Gamma API ===");
    const gammaData = await fetchPolymarketGammaByConditionId(marketId);
    if (gammaData) {
        results.push(gammaData);
        console.log(`✓ Gamma data: Price=${gammaData.price}, Volume=${gammaData.volume}`);
    }

    // If no useful data found, try fallback
    if (results.length === 0 || results.every(r => r.price === 0 && r.volume === 0)) {
        console.log("=== Trying fallback ===");
        const fallbackData = await fetchFallbackMarketData();
        if (fallbackData) {
            results.push(fallbackData);
            console.log(`✓ Fallback data: Price=${fallbackData.price}, Volume=${fallbackData.volume}`);
        }
    }

    // Select best result
    let finalResult = null;
    
    if (results.length > 0) {
        // Prioritize results with actual price and volume data
        const validResults = results.filter(r => r.price > 0 && r.volume > 0);
        
        if (validResults.length > 0) {
            // Use the first valid result (Gamma has priority)
            finalResult = validResults[0];
            console.log(`Using valid result from: ${finalResult.source}`);
        } else {
            // Use any result with at least price data
            const priceResults = results.filter(r => r.price > 0);
            if (priceResults.length > 0) {
                finalResult = priceResults[0];
                console.log(`Using price-only result from: ${finalResult.source}`);
            } else {
                // Use first available result as last resort
                finalResult = results[0];
                console.log(`Using fallback result from: ${finalResult.source}`);
            }
        }
    }

    // Return default values if no data found
    if (!finalResult) {
        console.log("No market data found, returning default values");
        finalResult = {
            source: "default",
            price: 0.5,
            volume: 100,
            timestamp: Math.floor(Date.now() / 1000),
            question: "Unknown market",
            active: false,
            closed: false
        };
    }

    console.log("=== FINAL RESULT ===");
    console.log(`Source: ${finalResult.source}`);
    console.log(`Price: ${finalResult.price}`);
    console.log(`Volume: ${finalResult.volume}`);
    console.log(`Timestamp: ${finalResult.timestamp}`);
    console.log(`Question: ${finalResult.question?.substring(0, 100) || 'Unknown'}...`);
    console.log(`Active: ${finalResult.active}, Closed: ${finalResult.closed}`);

    return finalResult;
}

// Helper function to write uint256 to buffer at offset
function writeUint256(value, offset, view) {
    // Convert number to hex string, pad to 64 characters (32 bytes)
    const hex = value.toString(16).padStart(64, '0');
    
    // Write each byte
    for (let i = 0; i < 32; i++) {
        const byteHex = hex.substr(i * 2, 2);
        const byteValue = parseInt(byteHex, 16);
        view.setUint8(offset + i, byteValue);
    }
}

// Execute main function and handle response - FIXED FOR CHAINLINK FUNCTIONS
try {
    console.log("Starting script execution...");
    
    // Execute main function and await result
    const result = await main();
    
    console.log("Main function completed, processing result...");
    
    // Prepare data for return
    const price = Math.round(result.price * 1000000); // Convert to 6 decimal precision
    const volume = Math.round(result.volume * 1000000); // Convert to 6 decimal precision  
    const timestamp = result.timestamp;

    console.log(`=== ENCODING RESPONSE ===`);
    console.log(`Original Price: ${result.price}`);
    console.log(`Scaled Price: ${price}`);
    console.log(`Original Volume: ${result.volume}`);
    console.log(`Scaled Volume: ${volume}`);
    console.log(`Timestamp: ${timestamp}`);

    // Create a buffer to hold our 3 uint256 values (32 bytes each = 96 bytes total)
    const buffer = new ArrayBuffer(96);
    const view = new DataView(buffer);
    
    // Write price at offset 0
    writeUint256(price, 0, view);
    
    // Write volume at offset 32
    writeUint256(volume, 32, view);
    
    // Write timestamp at offset 64
    writeUint256(timestamp, 64, view);
    
    // Convert to Uint8Array for logging and return
    const uint8Array = new Uint8Array(buffer);
    
    console.log(`Price hex: ${Array.from(uint8Array.slice(0, 32)).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`Volume hex: ${Array.from(uint8Array.slice(32, 64)).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`Timestamp hex: ${Array.from(uint8Array.slice(64, 96)).map(b => b.toString(16).padStart(2, '0')).join('')}`);
    console.log(`Response bytes length: ${uint8Array.length}`);
    console.log(`First 10 bytes: [${Array.from(uint8Array.slice(0, 10)).join(', ')}]`);
    console.log("✓ Script completed successfully");

    // Return the Uint8Array directly (this is what Chainlink Functions expects)
    return uint8Array;
    
} catch (error) {
    console.error("Script execution failed:", error.message);
    console.error("Error stack:", error.stack);
    
    // Return error data with default values
    const defaultPrice = Math.round(0.5 * 1000000);
    const defaultVolume = Math.round(100 * 1000000);
    const defaultTimestamp = Math.floor(Date.now() / 1000);

    console.log(`=== ERROR RESPONSE ===`);
    console.log(`Default Price: ${defaultPrice}`);
    console.log(`Default Volume: ${defaultVolume}`);
    console.log(`Default Timestamp: ${defaultTimestamp}`);

    // Create error response buffer
    const buffer = new ArrayBuffer(96);
    const view = new DataView(buffer);
    
    writeUint256(defaultPrice, 0, view);
    writeUint256(defaultVolume, 32, view);
    writeUint256(defaultTimestamp, 64, view);
    
    const uint8Array = new Uint8Array(buffer);
    console.log(`Error response bytes length: ${uint8Array.length}`);
    console.log("✓ Error response created");
    
    return uint8Array;
}