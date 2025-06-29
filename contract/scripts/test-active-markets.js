/**
 * Test Finding Active Markets with Orderbook Data
 * This script finds active markets that have live trading activity
 */

const axios = require('axios');

const POLYMARKET_CLOB_API = "https://clob.polymarket.com";

async function findActiveMarketsWithOrderbooks() {
    console.log("=== Finding Active Markets with Orderbook Data ===");
    
    try {
        // Get markets without filters first to see what's available
        const response = await axios.get(`${POLYMARKET_CLOB_API}/markets`, {
            params: {
                limit: 100  // Get more markets to check
            }
        });

        console.log(`Found ${response.data?.data?.length || 0} total markets`);
        
        if (!response.data?.data?.length) {
            console.log("No markets found");
            return;
        }

        let foundMarketsWithOrderbooks = 0;
        let checkedMarkets = 0;
        
        // Check markets for truly active ones (active=true AND closed=false)
        for (let i = 0; i < response.data.data.length && checkedMarkets < 20; i++) {
            const market = response.data.data[i];
            
            // Skip markets that are closed or inactive
            if (market.closed || !market.active) {
                continue;
            }
            
            if (!market.tokens || market.tokens.length === 0) {
                continue;
            }
            
            checkedMarkets++;
            const token = market.tokens[0];
            console.log(`\n--- Testing Market ${checkedMarkets}: ${market.question.substring(0, 60)}...`);
            console.log(`Active: ${market.active}, Closed: ${market.closed}`);
            console.log(`Token ID: ${token.token_id}`);
            
            try {
                const bookResponse = await axios.get(`${POLYMARKET_CLOB_API}/book`, {
                    params: {
                        token_id: token.token_id
                    }
                });

                const book = bookResponse.data;
                if (book.bids && book.bids.length > 0 && book.asks && book.asks.length > 0) {
                    foundMarketsWithOrderbooks++;
                    
                    const bestBid = parseFloat(book.bids[0].price);
                    const bestAsk = parseFloat(book.asks[0].price);
                    const midPrice = (bestBid + bestAsk) / 2;
                    
                    const bidVolume = book.bids.reduce((sum, bid) => sum + parseFloat(bid.size || 0), 0);
                    const askVolume = book.asks.reduce((sum, ask) => sum + parseFloat(ask.size || 0), 0);
                    const totalVolume = bidVolume + askVolume;
                    
                    console.log(`✅ HAS ORDERBOOK DATA!`);
                    console.log(`   Bids: ${book.bids.length}, Asks: ${book.asks.length}`);
                    console.log(`   Best Bid: ${bestBid}, Best Ask: ${bestAsk}`);
                    console.log(`   Mid Price: ${midPrice}`);
                    console.log(`   Volume: ${totalVolume.toFixed(2)} (bids: ${bidVolume.toFixed(2)}, asks: ${askVolume.toFixed(2)})`);
                    console.log(`   Condition ID: ${market.condition_id}`);
                    
                    // If this is the first one found, use it as our test case
                    if (foundMarketsWithOrderbooks === 1) {
                        console.log(`\n🎯 USING THIS MARKET FOR TESTING!`);
                        return {
                            conditionId: market.condition_id,
                            tokenId: token.token_id,
                            question: market.question,
                            price: midPrice,
                            volume: totalVolume,
                            market: market
                        };
                    }
                } else {
                    console.log(`❌ No orderbook data (bids: ${book.bids?.length || 0}, asks: ${book.asks?.length || 0})`);
                }
                
            } catch (bookError) {
                if (bookError.response?.status === 404) {
                    console.log(`❌ No orderbook exists`);
                } else {
                    console.log(`❌ Book error: ${bookError.message}`);
                }
            }
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`\n=== Summary ===`);
        console.log(`Found ${foundMarketsWithOrderbooks} active markets with orderbook data out of ${checkedMarkets} checked`);
        
        // If no truly active markets found, let's try a different approach
        if (foundMarketsWithOrderbooks === 0) {
            console.log(`\n🔄 No truly active markets found. Let's try just active markets (ignoring closed status)...`);
            
            for (let i = 0; i < Math.min(20, response.data.data.length); i++) {
                const market = response.data.data[i];
                
                // Just check if it has active=true, ignore closed status
                if (!market.active || !market.tokens || market.tokens.length === 0) {
                    continue;
                }
                
                const token = market.tokens[0];
                
                try {
                    const bookResponse = await axios.get(`${POLYMARKET_CLOB_API}/book`, {
                        params: {
                            token_id: token.token_id
                        }
                    });

                    const book = bookResponse.data;
                    if (book.bids && book.bids.length > 0 && book.asks && book.asks.length > 0) {
                        const bestBid = parseFloat(book.bids[0].price);
                        const bestAsk = parseFloat(book.asks[0].price);
                        const midPrice = (bestBid + bestAsk) / 2;
                        
                        const bidVolume = book.bids.reduce((sum, bid) => sum + parseFloat(bid.size || 0), 0);
                        const askVolume = book.asks.reduce((sum, ask) => sum + parseFloat(ask.size || 0), 0);
                        const totalVolume = bidVolume + askVolume;
                        
                        console.log(`\n✅ FOUND ACTIVE MARKET WITH ORDERBOOK (even if closed)!`);
                        console.log(`   Question: ${market.question.substring(0, 80)}...`);
                        console.log(`   Active: ${market.active}, Closed: ${market.closed}`);
                        console.log(`   Mid Price: ${midPrice}`);
                        console.log(`   Volume: ${totalVolume.toFixed(2)}`);
                        console.log(`   Condition ID: ${market.condition_id}`);
                        
                        return {
                            conditionId: market.condition_id,
                            tokenId: token.token_id,
                            question: market.question,
                            price: midPrice,
                            volume: totalVolume,
                            market: market
                        };
                    }
                } catch (bookError) {
                    // Continue to next market
                    continue;
                }
                
                await new Promise(resolve => setTimeout(resolve, 50));
            }
        }
        
        return null;
        
    } catch (error) {
        console.log("Error finding active markets:", error.message);
        return null;
    }
}

async function main() {
    const activeMarket = await findActiveMarketsWithOrderbooks();
    
    if (activeMarket) {
        console.log(`\n🚀 Test the Functions script with this market:`);
        console.log(`   Condition ID: ${activeMarket.conditionId}`);
        console.log(`   Question: ${activeMarket.question}`);
        console.log(`   Expected Price: ${activeMarket.price}`);
        console.log(`   Expected Volume: ${activeMarket.volume}`);
        console.log(`\n📝 Copy this condition ID to test in Functions playground:`);
        console.log(`   ${activeMarket.conditionId}`);
    } else {
        console.log(`\n❌ No markets with orderbook data found`);
        console.log(`\n🤔 This suggests Polymarket might have very few active markets with live orderbooks.`);
        console.log(`   The Functions script should handle this by using fallback data.`);
    }
}

main().catch(console.error); 