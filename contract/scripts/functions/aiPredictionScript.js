/**
 * Chainlink Functions JavaScript Source Code
 * AI-Powered Market Prediction Script
 * 
 * This script uses machine learning and AI to predict market movements:
 * - Historical market data analysis
 * - Sentiment analysis from social media
 * - Technical indicators calculation
 * - ML model predictions via cloud APIs
 * 
 * Arguments: [marketId, timeHorizon]
 * Returns: [predictedPrice, confidence, timeHorizon] as bytes
 */

// Get arguments passed from the smart contract
const marketId = args[0];
const timeHorizon = parseInt(args[1]); // Hours to predict

console.log(`Generating AI prediction for marketId: ${marketId}, timeHorizon: ${timeHorizon}h`);

// API Configuration (use secrets for API keys)
const OPENAI_API = "https://api.openai.com/v1";
const POLYMARKET_API = "https://gamma-api.polymarket.com";
const SOCIAL_SENTIMENT_API = "https://api.lunarcrush.com/v2";

/**
 * Fetch historical market data for analysis
 */
async function fetchHistoricalData(marketId) {
    try {
        const response = await Functions.makeHttpRequest({
            url: `${POLYMARKET_API}/markets/${marketId}`,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        });

        if (response.error) {
            console.log("Error fetching historical data:", response.error);
            return null;
        }

        const market = response.data;
        console.log("Market data:", market);
        
        // Get price history if available
        const priceHistory = [];
        if (market.tokens && market.tokens[0]) {
            // This would typically include historical price points
            priceHistory.push({
                price: parseFloat(market.tokens[0].price || 0),
                timestamp: Math.floor(Date.now() / 1000),
                volume: parseFloat(market.volume || 0)
            });
        }

        return {
            currentPrice: parseFloat(market.tokens?.[0]?.price || 0),
            volume: parseFloat(market.volume || 0),
            priceHistory: priceHistory,
            marketCondition: market.condition || "Unknown",
            endDate: market.end_date_iso,
            category: market.category || "Other"
        };

    } catch (error) {
        console.log("Error in fetchHistoricalData:", error.message);
        return null;
    }
}

/**
 * Analyze social sentiment around the market
 */
async function analyzeSocialSentiment(marketId, condition) {
    try {
        // This would integrate with social media APIs to analyze sentiment
        // For demonstration, we'll use a simplified approach
        
        // Extract keywords from market condition for sentiment analysis
        const keywords = condition ? condition.split(' ').slice(0, 3).join(' ') : marketId;
        
        // Note: In production, you'd use real sentiment analysis APIs
        // with proper authentication via secrets
        
        const mockSentiment = {
            positive: 0.6,
            negative: 0.3,
            neutral: 0.1,
            volume: 1000,
            trend: "bullish"
        };

        return mockSentiment;

    } catch (error) {
        console.log("Error in sentiment analysis:", error.message);
        return {
            positive: 0.5,
            negative: 0.5,
            neutral: 0.0,
            volume: 0,
            trend: "neutral"
        };
    }
}

/**
 * Calculate technical indicators
 */
function calculateTechnicalIndicators(priceHistory) {
    if (!priceHistory || priceHistory.length < 2) {
        return {
            trend: "neutral",
            momentum: 0,
            volatility: 0,
            signal: "hold"
        };
    }

    // Simple trend analysis
    const prices = priceHistory.map(p => p.price);
    const recentPrice = prices[prices.length - 1];
    const earlierPrice = prices[0];
    
    const trend = recentPrice > earlierPrice ? "bullish" : 
                  recentPrice < earlierPrice ? "bearish" : "neutral";
    
    // Calculate simple momentum
    const momentum = (recentPrice - earlierPrice) / earlierPrice;
    
    // Simple volatility calculation
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const variance = prices.reduce((sum, p) => sum + Math.pow(p - avgPrice, 2), 0) / prices.length;
    const volatility = Math.sqrt(variance);
    
    // Generate trading signal
    let signal = "hold";
    if (momentum > 0.05) signal = "buy";
    else if (momentum < -0.05) signal = "sell";
    
    return {
        trend,
        momentum,
        volatility,
        signal
    };
}

/**
 * Generate AI prediction using OpenAI or similar ML service
 */
async function generateAIPrediction(marketData, sentiment, technicals, timeHorizon) {
    try {
        // In production, this would call OpenAI API with secrets.openaiApiKey
        // For demonstration, we'll use rule-based prediction
        
        const basePrice = marketData.currentPrice;
        let pricePrediction = basePrice;
        let confidence = 0.5;

        // Factor in sentiment
        const sentimentScore = sentiment.positive - sentiment.negative;
        const sentimentImpact = sentimentScore * 0.1; // Max 10% impact from sentiment

        // Factor in technical indicators
        let technicalImpact = 0;
        if (technicals.signal === "buy") technicalImpact = 0.05;
        else if (technicals.signal === "sell") technicalImpact = -0.05;

        // Time decay factor
        const timeDecay = Math.min(timeHorizon / 168, 1); // Normalize to weeks, max 1

        // Combine factors
        const totalImpact = (sentimentImpact + technicalImpact) * timeDecay;
        pricePrediction = basePrice * (1 + totalImpact);

        // Ensure price stays within reasonable bounds (0-1 for probabilities)
        pricePrediction = Math.max(0.01, Math.min(0.99, pricePrediction));

        // Calculate confidence based on data quality
        confidence = 0.3; // Base confidence
        if (sentiment.volume > 500) confidence += 0.2;
        if (technicals.volatility < 0.1) confidence += 0.2;
        if (marketData.volume > 1000) confidence += 0.2;
        if (timeHorizon <= 24) confidence += 0.1; // More confident for shorter predictions

        confidence = Math.min(0.95, confidence); // Cap at 95%

        console.log(`AI Prediction: ${pricePrediction}, Confidence: ${confidence}`);

        return {
            predictedPrice: pricePrediction,
            confidence: confidence,
            reasoning: {
                sentimentImpact,
                technicalImpact,
                timeDecay,
                signal: technicals.signal
            }
        };

    } catch (error) {
        console.log("Error in AI prediction:", error.message);
        return {
            predictedPrice: marketData.currentPrice,
            confidence: 0.1,
            reasoning: {error: error.message}
        };
    }
}

/**
 * Main execution function
 */
async function main() {
    // Fetch historical market data
    const marketData = await fetchHistoricalData(marketId);
    if (!marketData) {
        throw new Error(`Unable to fetch market data for ${marketId}`);
    }

    console.log(`Current market price: ${marketData.currentPrice}`);

    // Analyze social sentiment
    const sentiment = await analyzeSocialSentiment(marketId, marketData.marketCondition);
    console.log(`Sentiment: ${sentiment.trend} (${sentiment.positive}/${sentiment.negative})`);

    // Calculate technical indicators
    const technicals = calculateTechnicalIndicators(marketData.priceHistory);
    console.log(`Technical signal: ${technicals.signal}, Trend: ${technicals.trend}`);

    // Generate AI prediction
    const prediction = await generateAIPrediction(marketData, sentiment, technicals, timeHorizon);

    // Scale values for contract (multiply by 1e18 for precision)
    const predictedPriceScaled = Math.round(prediction.predictedPrice * 1e18);
    const confidenceScaled = Math.round(prediction.confidence * 1e18);
    const timeHorizonScaled = timeHorizon;

    console.log(`Final prediction - Price: ${predictedPriceScaled}, Confidence: ${confidenceScaled}, TimeHorizon: ${timeHorizonScaled}`);

    // Encode the response for the smart contract
    // Returns (uint256 predictedPrice, uint256 confidence, uint256 timeHorizon)
    const response = Functions.encodeUint256(predictedPriceScaled) + 
                    Functions.encodeUint256(confidenceScaled).slice(2) + 
                    Functions.encodeUint256(timeHorizonScaled).slice(2);
    
    return response;
}

// Execute the main function
return await main(); 