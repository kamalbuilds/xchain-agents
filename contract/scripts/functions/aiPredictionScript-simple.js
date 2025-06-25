/**
 * Simplified Chainlink Functions AI Prediction Script
 * Optimized for gas efficiency and testing
 * 
 * Arguments: [marketId, timeHorizon]
 * Returns: [predictedPrice, confidence, timeHorizon] as bytes
 */

const marketId = args[0];
const timeHorizon = parseInt(args[1]);

console.log(`Generating prediction for market: ${marketId}, timeHorizon: ${timeHorizon}h`);

/**
 * Simple prediction algorithm for testing
 */
function generateSimplePrediction(marketId, timeHorizon) {
    // Mock prediction based on market ID hash and time horizon
    const marketHash = marketId.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const randomFactor = (marketHash % 100) / 100;
    
    // Base prediction around 50% with some variance
    let predictedPrice = 0.5 + (randomFactor - 0.5) * 0.3;
    
    // Adjust based on time horizon (longer = more uncertainty)
    const timeAdjustment = Math.min(timeHorizon / 168, 0.1); // Max 10% adjustment for 1 week
    predictedPrice += (Math.random() - 0.5) * timeAdjustment;
    
    // Ensure bounds [0.01, 0.99]
    predictedPrice = Math.max(0.01, Math.min(0.99, predictedPrice));
    
    // Confidence decreases with time horizon
    let confidence = Math.max(0.6, 0.9 - (timeHorizon / 168) * 0.3);
    
    console.log(`Prediction: price=${predictedPrice}, confidence=${confidence}`);
    
    return {
        predictedPrice,
        confidence,
        timeHorizon
    };
}

/**
 * Main execution
 */
function main() {
    const result = generateSimplePrediction(marketId, timeHorizon);
    
    // Convert to wei (18 decimals)
    const predictedPriceWei = Math.floor(result.predictedPrice * 1e18);
    const confidenceWei = Math.floor(result.confidence * 1e18);
    
    console.log(`Final: predictedPriceWei=${predictedPriceWei}, confidenceWei=${confidenceWei}, timeHorizon=${timeHorizon}`);
    
    // Return as bytes-encoded array
    return Functions.encodeUint256(predictedPriceWei) + 
           Functions.encodeUint256(confidenceWei).slice(2) + 
           Functions.encodeUint256(timeHorizon).slice(2);
}

return main(); 