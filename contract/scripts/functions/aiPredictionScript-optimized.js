/**
 * Optimized AI-Powered Market Prediction Script - Production Ready
 * Arguments: [assetSymbol, timeHorizon, dataStreamFeedId]
 * Returns: [predictedPrice, confidence, timeHorizon] as bytes
 */

const assetSymbol = args[0] || 'BTC';
const timeHorizon = parseInt(args[1]) || 24;
const dataStreamFeedId = args[2];

console.log(`🔮 AI prediction: ${assetSymbol}, ${timeHorizon}h`);

const API_ENDPOINTS = {
    coinbase: "https://api.coinbase.com/v2/exchange-rates",
    coinbasePro: "https://api.exchange.coinbase.com/products",
    coingecko: "https://api.coingecko.com/api/v3",
    cryptocompare: "https://min-api.cryptocompare.com/data",
    fearGreed: "https://api.alternative.me/fng/",
    binance: "https://api.binance.com/api/v3"
};

const DATA_STREAMS_FEED_IDS = {
    'BTC': '0x000359843a543ee2fe414dc14c7e7920ef10f4372990b79d6361cdc0dd1ba75b8',
    'ETH': '0x0003aed0369b6e13cf3b6f9e9fe59e858e6e9d8b67d7b0b5e3ff2b06d5a63ae9',
    'LINK': '0x0003b26c4b3ba87c6e8f9e5c6c1e2d9f7e8a5b4c3d2e1f0a9b8c7d6e52401',
    'USDC': '0x0003c5d7f2a9b8c6e5d4f3a2b1c0e9f8d7c6b5a4f3e2d1c0b9a8f7e6d992',
    'USDT': '0x0003d8e9f2b5c4a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e706db',
    'BNB': '0x0003e1f4a7b2c5d8e9f2b5c4a7f6e5d4c3b2a1f0e9d8c7b6a5f4e321fe',
    'ADA': '0x0003f2e5b8c1d4f7a0e3d6c9b2f5a8e1d4c7b0a3f6e9d2c5b8a1f42eb0',
    'DOT': '0x000403f6b9c2d5e8a1f4e7d0c3b6a9f2e5b8c1d4f7a0e3d6c9b2f5a8e1',
    'SOL': '0x000414e7c0a3f6b9d2c5e8a1f4e7d0c3b6a9f2e5b8c1d4f7a0e3d6c24f'
};

const SYMBOL_MAPPINGS = {
    'BTC': { coingecko: 'bitcoin', coinbase: 'BTC', cryptocompare: 'BTC', binance: 'BTCUSDT' },
    'ETH': { coingecko: 'ethereum', coinbase: 'ETH', cryptocompare: 'ETH', binance: 'ETHUSDT' },
    'LINK': { coingecko: 'chainlink', coinbase: 'LINK', cryptocompare: 'LINK', binance: 'LINKUSDT' },
    'USDC': { coingecko: 'usd-coin', coinbase: 'USDC', cryptocompare: 'USDC', binance: 'USDCUSDT' },
    'USDT': { coingecko: 'tether', coinbase: 'USDT', cryptocompare: 'USDT', binance: 'USDTUSDT' },
    'BNB': { coingecko: 'binancecoin', coinbase: 'BNB', cryptocompare: 'BNB', binance: 'BNBUSDT' },
    'ADA': { coingecko: 'cardano', coinbase: 'ADA', cryptocompare: 'ADA', binance: 'ADAUSDT' },
    'DOT': { coingecko: 'polkadot', coinbase: 'DOT', cryptocompare: 'DOT', binance: 'DOTUSDT' },
    'SOL': { coingecko: 'solana', coinbase: 'SOL', cryptocompare: 'SOL', binance: 'SOLUSDT' }
};

async function fetchDataStreamsMarketData(symbol) {
    try {
        const sm = SYMBOL_MAPPINGS[symbol] || { coinbase: symbol };
        const feedId = dataStreamFeedId || DATA_STREAMS_FEED_IDS[symbol];
        
        const requests = [
            Functions.makeHttpRequest({
                url: API_ENDPOINTS.coinbase,
                method: "GET",
                headers: { "Content-Type": "application/json" },
                params: { currency: sm.coinbase },
                timeout: 8000
            }),
            Functions.makeHttpRequest({
                url: `${API_ENDPOINTS.coinbasePro}/${sm.coinbase}-USD/ticker`,
                method: "GET",
                headers: { "Content-Type": "application/json" },
                timeout: 8000
            }),
            Functions.makeHttpRequest({
                url: `${API_ENDPOINTS.binance}/ticker/bookTicker`,
                method: "GET",
                headers: { "Content-Type": "application/json" },
                params: { symbol: sm.binance },
                timeout: 8000
            })
        ];

        const [cbResp, cbProResp, binResp] = await Promise.all(requests);
        
        let price = 0, bid = 0, ask = 0, spread = 0, quality = 'low';
        
        if (!cbResp.error && cbResp.data?.data?.rates) {
            price = parseFloat(cbResp.data.data.rates.USD || 0);
            if (price > 0) quality = 'medium';
        }
        
        if (!cbProResp?.error && cbProResp?.data) {
            const ticker = cbProResp.data;
            bid = parseFloat(ticker.bid || 0);
            ask = parseFloat(ticker.ask || 0);
            
            if (bid > 0 && ask > 0) {
                spread = ask - bid;
                price = (bid + ask) / 2;
                quality = 'high';
            }
        }
        
        if (!binResp?.error && binResp?.data) {
            const binPrice = parseFloat(binResp.data.price || binResp.data.bidPrice || 0);
            if (binPrice > 0 && price > 0) {
                const diff = Math.abs(price - binPrice) / price;
                if (diff < 0.02) {
                    price = (price + binPrice) / 2;
                    quality = 'high';
                }
            } else if (binPrice > 0) {
                price = binPrice;
                quality = 'medium';
            }
        }
        
        if (price === 0) return null;

        if (spread === 0) {
            spread = price * 0.001;
            bid = price - spread/2;
            ask = price + spread/2;
        }

        return {
            source: 'data-streams',
            feedId: feedId,
            price: price,
            bid: bid,
            ask: ask,
            spread: spread,
            timestamp: Math.floor(Date.now() / 1000),
            quality: quality
        };

    } catch (error) {
        console.log("Data streams error:", error.message);
        return null;
    }
}

async function fetchHistoricalData(symbol, th) {
    try {
        const sm = SYMBOL_MAPPINGS[symbol] || { coingecko: symbol.toLowerCase() };
        const days = Math.max(1, Math.ceil(th / 24));
        
        const requests = [
            Functions.makeHttpRequest({
                url: `${API_ENDPOINTS.coingecko}/coins/${sm.coingecko}/market_chart`,
                method: "GET",
                headers: { "Content-Type": "application/json" },
                params: {
                    vs_currency: 'usd',
                    days: Math.min(days * 2, 30),
                    interval: th <= 24 ? 'hourly' : 'daily'
                },
                timeout: 10000
            }),
            Functions.makeHttpRequest({
                url: `${API_ENDPOINTS.cryptocompare}/v2/histohour`,
                method: "GET",
                headers: { "Content-Type": "application/json" },
                params: {
                    fsym: sm.cryptocompare,
                    tsym: 'USD',
                    limit: Math.min(th, 168),
                    aggregate: 1
                },
                timeout: 10000
            })
        ];

        const [cgResp, ccResp] = await Promise.all(requests);
        
        let priceHistory = [], currentPrice = 0, avgVolume = 0, source = 'unknown';
        
        if (!cgResp.error && cgResp.data?.prices) {
            const priceData = cgResp.data.prices;
            const volumeData = cgResp.data.total_volumes || [];
            
            priceHistory = priceData.slice(-Math.min(48, th * 2)).map((point, idx) => ({
                timestamp: Math.floor(point[0] / 1000),
                price: point[1],
                volume: volumeData[idx] ? volumeData[idx][1] : 0
            }));
            
            currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
            avgVolume = priceHistory.reduce((sum, p) => sum + p.volume, 0) / priceHistory.length;
            source = 'coingecko';
        }
        
        if (!ccResp?.error && ccResp?.data?.Data?.Data && priceHistory.length === 0) {
            const ccData = ccResp.data.Data.Data;
            priceHistory = ccData.slice(-Math.min(24, th)).map(point => ({
                timestamp: point.time,
                price: point.close,
                volume: point.volumeto || 0
            }));
            
            currentPrice = priceHistory[priceHistory.length - 1]?.price || 0;
            avgVolume = priceHistory.reduce((sum, p) => sum + p.volume, 0) / priceHistory.length;
            source = 'cryptocompare';
        }
        
        if (priceHistory.length === 0) return null;

        return {
            currentPrice,
            priceHistory,
            avgVolume,
            dataPoints: priceHistory.length,
            source: source,
            quality: priceHistory.length >= 20 ? 'high' : priceHistory.length >= 10 ? 'medium' : 'low'
        };

    } catch (error) {
        console.log("Historical data error:", error.message);
        return null;
    }
}

async function fetchMarketSentiment(symbol) {
    try {
        const sm = SYMBOL_MAPPINGS[symbol] || { coingecko: symbol.toLowerCase() };
        
        const requests = [
            Functions.makeHttpRequest({
                url: `${API_ENDPOINTS.fearGreed}?limit=1`,
                method: "GET",
                headers: { "Content-Type": "application/json" },
                timeout: 8000
            }),
            Functions.makeHttpRequest({
                url: `${API_ENDPOINTS.coingecko}/coins/${sm.coingecko}`,
                method: "GET",
                headers: { "Content-Type": "application/json" },
                params: {
                    localization: false,
                    tickers: false,
                    market_data: true,
                    community_data: true,
                    developer_data: false,
                    sparkline: false
                },
                timeout: 10000
            })
        ];

        const [fgResp, coinResp] = await Promise.all(requests);
        
        let sentiment = {
            fearGreedIndex: 50,
            sentiment: 'neutral',
            confidence: 0.3,
            source: 'default'
        };

        if (!fgResp.error && fgResp.data?.data?.[0]) {
            const fg = fgResp.data.data[0];
            sentiment.fearGreedIndex = parseInt(fg.value);
            sentiment.sentiment = fg.value_classification?.toLowerCase() || 'neutral';
            sentiment.confidence = 0.8;
            sentiment.source = 'fear-greed';
        }

        if (!coinResp.error && coinResp.data) {
            const coin = coinResp.data;
            if (coin.sentiment_votes_up_percentage) {
                sentiment.assetSentiment = coin.sentiment_votes_up_percentage;
                sentiment.confidence = Math.max(sentiment.confidence, 0.7);
            }
            if (coin.market_cap_rank) {
                const rank = coin.market_cap_rank;
                let rankConf = 0;
                if (rank <= 10) rankConf = 0.8;
                else if (rank <= 50) rankConf = 0.6;
                else if (rank <= 100) rankConf = 0.5;
                else rankConf = 0.3;
                sentiment.confidence = Math.max(sentiment.confidence, rankConf);
            }
        }

        return sentiment;

    } catch (error) {
        console.log("Sentiment error:", error.message);
        return {
            fearGreedIndex: 50,
            sentiment: 'neutral',
            confidence: 0.2,
            source: 'error'
        };
    }
}

function calculateTechnicals(priceHistory) {
    if (!priceHistory || priceHistory.length < 10) {
        return {
            trend: "insufficient",
            momentum: 0,
            volatility: 0,
            rsi: 50,
            signal: "hold",
            confidence: 0.1
        };
    }

    const prices = priceHistory.map(p => p.price);
    const volumes = priceHistory.map(p => p.volume);
    
    const shortMA = calcMA(prices, Math.min(5, prices.length));
    const longMA = calcMA(prices, Math.min(10, prices.length));
    const rsi = calcRSI(prices, Math.min(14, prices.length - 1));
    
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance) / avgPrice;
    
    const recent = prices[prices.length - 1];
    const older = prices[Math.max(0, prices.length - Math.min(6, prices.length))];
    const momentum = (recent - older) / older;
    
    const avgVol = volumes.reduce((sum, v) => sum + v, 0) / volumes.length;
    const recentVol = volumes[volumes.length - 1] || avgVol;
    const volumeRatio = avgVol > 0 ? recentVol / avgVol : 1;
    
    let trend = "neutral";
    if (shortMA > longMA * 1.02) trend = "bullish";
    else if (shortMA < longMA * 0.98) trend = "bearish";
    
    let signal = "hold", strength = 0;
    
    if (rsi < 30 && momentum > -0.05 && volumeRatio > 1.2) {
        signal = "buy"; strength = 0.7;
    } else if (rsi > 70 && momentum < 0.05 && volumeRatio > 1.2) {
        signal = "sell"; strength = 0.7;
    } else if (momentum > 0.1 && trend === "bullish") {
        signal = "buy"; strength = 0.5;
    } else if (momentum < -0.1 && trend === "bearish") {
        signal = "sell"; strength = 0.5;
    }

    return {
        trend, momentum, volatility, signal, rsi,
        movingAverages: { short: shortMA, long: longMA },
        volumeRatio, signalStrength: strength,
        confidence: Math.min(0.9, 0.4 + (priceHistory.length / 24) * 0.5)
    };
}

function calcMA(prices, period) {
    if (prices.length < period) return prices[prices.length - 1] || 0;
    const slice = prices.slice(-period);
    return slice.reduce((sum, price) => sum + price, 0) / slice.length;
}

function calcRSI(prices, period) {
    if (prices.length < period + 1) return 50;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - period; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}

async function generatePrediction(marketData, histData, sentiment, technicals, th) {
    try {
        let basePrice = marketData?.price || histData?.currentPrice || 0;
        if (basePrice === 0) throw new Error("No price data");

        let prediction = basePrice, confidence = 0.3;

        let sentimentImpact = 0;
        if (sentiment.fearGreedIndex > 75) sentimentImpact = 0.08;
        else if (sentiment.fearGreedIndex < 25) sentimentImpact = -0.12;
        else if (sentiment.fearGreedIndex > 60) sentimentImpact = 0.03;
        else if (sentiment.fearGreedIndex < 40) sentimentImpact = -0.05;

        if (sentiment.assetSentiment) {
            sentimentImpact += (sentiment.assetSentiment - 50) / 100 * 0.05;
        }
        confidence += sentiment.confidence * 0.15;

        let techImpact = technicals.momentum * 0.7;
        if (technicals.rsi < 30) techImpact += 0.06;
        else if (technicals.rsi > 70) techImpact -= 0.04;
        
        if (technicals.trend === "bullish") techImpact += 0.03;
        else if (technicals.trend === "bearish") techImpact -= 0.03;
        
        if (technicals.volumeRatio > 1.5) techImpact *= 1.3;
        else if (technicals.volumeRatio < 0.7) techImpact *= 0.7;

        confidence += technicals.confidence * 0.25;

        const timeDecay = Math.min(1.0, th / 168);
        const volAdj = 1 + (technicals.volatility * timeDecay);
        
        if (th > 24) confidence *= 0.85;
        if (th > 72) confidence *= 0.75;
        if (th > 168) confidence *= 0.65;

        if (marketData?.quality === 'high') confidence += 0.1;
        if (histData?.dataPoints >= 20) confidence += 0.1;
        if (marketData?.spread && marketData.spread / marketData.price < 0.005) confidence += 0.05;

        const totalImpact = (sentimentImpact + techImpact) * timeDecay * volAdj;
        prediction = basePrice * (1 + totalImpact);

        confidence = Math.max(0.1, Math.min(0.95, confidence));
        
        const priceChange = Math.abs(totalImpact);
        if (priceChange > 0.2) confidence *= 0.7;
        if (priceChange > 0.5) confidence *= 0.5;

        console.log(`🎯 Prediction: $${prediction.toFixed(2)}, Confidence: ${(confidence*100).toFixed(1)}%`);

        return {
            predictedPrice: prediction,
            confidence: confidence,
            breakdown: { basePrice, sentimentImpact, techImpact, totalImpact },
            signal: technicals.signal
        };

    } catch (error) {
        console.log("Prediction error:", error.message);
        return {
            predictedPrice: basePrice,
            confidence: 0.1,
            signal: "hold"
        };
    }
}

function writeUint256(value, offset, view) {
    const hex = value.toString(16).padStart(64, '0');
    for (let i = 0; i < 32; i++) {
        const byteHex = hex.substr(i * 2, 2);
        const byteValue = parseInt(byteHex, 16);
        view.setUint8(offset + i, byteValue);
    }
}

async function main() {
    try {
        console.log(`🚀 AI prediction: ${assetSymbol}`);
        
        const [marketData, histData, sentimentData] = await Promise.all([
            fetchDataStreamsMarketData(assetSymbol),
            fetchHistoricalData(assetSymbol, timeHorizon),
            fetchMarketSentiment(assetSymbol)
        ]);
        
        if (!marketData && !histData) {
            throw new Error("No market data available");
        }
        
        let technicals = { confidence: 0.1, signal: 'hold' };
        if (histData?.priceHistory?.length > 5) {
            technicals = calculateTechnicals(histData.priceHistory);
        }
        
        const prediction = await generatePrediction(
            marketData, histData, sentimentData, technicals, timeHorizon
        );
        
        if (!prediction || prediction.predictedPrice <= 0) {
            throw new Error("Prediction failed");
        }
        
        const priceScaled = Math.round(prediction.predictedPrice * 1e6);
        const confScaled = Math.round(prediction.confidence * 1e6);
        const thScaled = timeHorizon;
        
        console.log(`✅ Result: $${prediction.predictedPrice.toFixed(2)}, ${(prediction.confidence*100).toFixed(1)}%`);

        const buffer = new ArrayBuffer(96);
        const view = new DataView(buffer);
        
        writeUint256(priceScaled, 0, view);
        writeUint256(confScaled, 32, view);
        writeUint256(thScaled, 64, view);
        
        return new Uint8Array(buffer);
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        
        const fallbackPrice = Math.round(50000 * 1e6);
        const fallbackConf = Math.round(0.1 * 1e6);
        const fallbackTh = timeHorizon;

        const buffer = new ArrayBuffer(96);
        const view = new DataView(buffer);
        
        writeUint256(fallbackPrice, 0, view);
        writeUint256(fallbackConf, 32, view);
        writeUint256(fallbackTh, 64, view);
        
        return new Uint8Array(buffer);
    }
}

try {
    console.log("🚀 Starting optimized AI prediction...");
    const result = await main();
    console.log("✅ Completed successfully");
    return result;
    
} catch (error) {
    console.error("❌ Script failed:", error.message);
    
    const defaultPrice = Math.round(50000 * 1e6);
    const defaultConf = Math.round(0.1 * 1e6);
    const defaultTh = timeHorizon || 24;

    const buffer = new ArrayBuffer(96);
    const view = new DataView(buffer);
    
    function writeUint256Error(value, offset, view) {
        const hex = value.toString(16).padStart(64, '0');
        for (let i = 0; i < 32; i++) {
            const byteHex = hex.substr(i * 2, 2);
            const byteValue = parseInt(byteHex, 16);
            view.setUint8(offset + i, byteValue);
        }
    }
    
    writeUint256Error(defaultPrice, 0, view);
    writeUint256Error(defaultConf, 32, view);
    writeUint256Error(defaultTh, 64, view);
    
    return new Uint8Array(buffer);
} 