// Minimal Market Data Fetcher for Chainlink Functions
try {
  // Mock market data for testing
  const mockData = {
    price: 0.65,
    volume: 1000,
    timestamp: Math.floor(Date.now() / 1000)
  };
  
  // Return encoded data
  return Functions.encodeUint256(mockData.price * 1e18);
} catch (error) {
  throw Error("Failed to fetch market data");
} 