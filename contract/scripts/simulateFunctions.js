const { simulateScript } = require("@chainlink/functions-toolkit");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🎯 Simulating Chainlink Functions JavaScript Scripts Locally...\n");

    // Read the JavaScript files
    const marketDataScript = fs.readFileSync(path.join(__dirname, "functions", "marketDataFetcher.js"), "utf8");
    const aiPredictionScript = fs.readFileSync(path.join(__dirname, "functions", "aiPredictionScript.js"), "utf8");

    console.log(`📄 Market Data Script: ${marketDataScript.length} characters`);
    console.log(`📄 AI Prediction Script: ${aiPredictionScript.length} characters\n`);

    // Test 1: Simulate Market Data Fetcher
    console.log("🔍 Test 1: Market Data Fetcher Simulation");
    console.log("=".repeat(50));
    
    try {
        const marketDataResult = await simulateScript({
            source: marketDataScript,
            args: [
                "0x9deb0baac40648821f96f01339229a422e2f5c877de55dc4dbf981f95a1e709c", // NFL: Chiefs vs Raiders
                "137" // Polygon chain ID
            ],
            secrets: {}, // No secrets needed for this test
            maxExecutionTimeMs: 10000,
            numAllowedQueries: 10,
            maxQueryDurationMs: 9000,
            maxQueryResponseBytes: 2097152
        });

        console.log("📊 Market Data Simulation Results:");
        if (marketDataResult.responseBytesHexstring) {
            console.log(`✅ Response: ${marketDataResult.responseBytesHexstring}`);
            
            // Try to decode the response
            try {
                const response = marketDataResult.responseBytesHexstring;
                console.log(`📏 Response length: ${response.length} characters`);
                console.log(`🔢 Response (hex): ${response.substring(0, 100)}...`);
            } catch (decodeError) {
                console.log("⚠️  Could not decode response as market data");
            }
        }
        
        if (marketDataResult.errorString) {
            console.log(`❌ Error: ${marketDataResult.errorString}`);
        }
        
        console.log("\n📋 Console Output:");
        console.log(marketDataResult.capturedTerminalOutput || "No console output");

    } catch (error) {
        console.error("❌ Market Data Simulation failed:", error.message);
    }

    console.log("\n" + "=".repeat(50));

    // Test 2: Simulate AI Prediction Script
    console.log("\n🔍 Test 2: AI Prediction Script Simulation");
    console.log("=".repeat(50));
    
    try {
        const predictionResult = await simulateScript({
            source: aiPredictionScript,
            args: [
                "0x7b76dda87a490fe7fb793ba900c02685aaa193c75277c39f396121f902f9786c", // Gavin Newsom 2024 Election
                "24" // 24 hours time horizon
            ],
            secrets: {
                OPENAI_API_KEY: process.env.OPENAI_API_KEY || "test-key" // Use real key or test key
            },
            maxExecutionTimeMs: 15000,
            numAllowedQueries: 15,
            maxQueryDurationMs: 9000,
            maxQueryResponseBytes: 2097152
        });

        console.log("🤖 AI Prediction Simulation Results:");
        if (predictionResult.responseBytesHexstring) {
            console.log(`✅ Response: ${predictionResult.responseBytesHexstring}`);
            
            // Try to decode the response
            try {
                const response = predictionResult.responseBytesHexstring;
                console.log(`📏 Response length: ${response.length} characters`);
                console.log(`🔢 Response (hex): ${response.substring(0, 100)}...`);
            } catch (decodeError) {
                console.log("⚠️  Could not decode response as prediction data");
            }
        }
        
        if (predictionResult.errorString) {
            console.log(`❌ Error: ${predictionResult.errorString}`);
        }
        
        console.log("\n📋 Console Output:");
        console.log(predictionResult.capturedTerminalOutput || "No console output");

    } catch (error) {
        console.error("❌ AI Prediction Simulation failed:", error.message);
        console.log("💡 Note: AI prediction requires valid API keys for full functionality");
    }

    console.log("\n" + "=".repeat(50));

    // Test 3: Simplified Market Data Test
    console.log("\n🔍 Test 3: Simplified Market Data Test");
    console.log("=".repeat(50));
    
    try {
        // Create a simple test script
        const simpleScript = `
        // Simple market data fetcher for testing
        console.log("Starting simple market data fetch...");
        console.log("Market ID:", args[0]);
        console.log("Chain ID:", args[1]);
        
        // Mock data for testing
        const mockPrice = 65000000000000000000n; // 0.65 ETH in wei (65%)
        const mockVolume = 1000000000000000000000n; // 1000 ETH in wei
        const mockTimestamp = BigInt(Math.floor(Date.now() / 1000));
        
        console.log("Mock price:", mockPrice.toString());
        console.log("Mock volume:", mockVolume.toString());
        console.log("Mock timestamp:", mockTimestamp.toString());
        
        // Encode as uint256 values
        const encodedPrice = mockPrice.toString().padStart(64, '0');
        const encodedVolume = mockVolume.toString().padStart(64, '0');
        const encodedTimestamp = mockTimestamp.toString().padStart(64, '0');
        
        const result = encodedPrice + encodedVolume + encodedTimestamp;
        console.log("Encoded result:", result);
        
        return Functions.encodeString(result);
        `;

        const simpleResult = await simulateScript({
            source: simpleScript,
            args: [
                "test-market-123",
                "137"
            ],
            secrets: {},
            maxExecutionTimeMs: 5000,
            numAllowedQueries: 0, // No HTTP requests needed
        });

        console.log("🧪 Simple Test Results:");
        if (simpleResult.responseBytesHexstring) {
            console.log(`✅ Response: ${simpleResult.responseBytesHexstring}`);
        }
        
        if (simpleResult.errorString) {
            console.log(`❌ Error: ${simpleResult.errorString}`);
        }
        
        console.log("\n📋 Console Output:");
        console.log(simpleResult.capturedTerminalOutput || "No console output");

    } catch (error) {
        console.error("❌ Simple test failed:", error.message);
    }

    console.log("\n🎉 Functions Simulation Complete!");
    console.log("\n📋 Summary:");
    console.log("✅ Functions toolkit installed and working");
    console.log("✅ JavaScript scripts can be simulated locally");
    console.log("✅ Error handling and debugging capabilities available");
    console.log("\n💡 Next steps:");
    console.log("1. Fix any JavaScript errors identified in simulation");
    console.log("2. Test with real API keys in secrets");
    console.log("3. Deploy and test on-chain with working scripts");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Simulation Error:", error);
        process.exit(1);
    }); 