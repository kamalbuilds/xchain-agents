// Minimal AI Prediction Script for Chainlink Functions
try {
  // Mock prediction data for testing
  const prediction = {
    price: 0.7,
    confidence: 0.8,
    timeHorizon: 24
  };
  
  // Return encoded prediction
  return Functions.encodeUint256(prediction.price * 1e18);
} catch (error) {
  throw Error("Failed to generate prediction");
} 