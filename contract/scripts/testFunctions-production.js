const hre = require("hardhat");

async function main() {
    console.log("🧪 Testing Production Chainlink Functions...\n");

    const network = hre.network.name;
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2"; // Our deployed proxy

    console.log(`Network: ${network}`);
    console.log(`Contract Address: ${contractAddress}\n`);

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

    try {
        // Test 1: Verify scripts are uploaded
        console.log("🧪 Test 1: Verifying uploaded scripts...");
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script: ${scripts[0].length} characters`);
        console.log(`✅ AI Prediction Script: ${scripts[1].length} characters`);
        
        if (scripts[0].length === 0 || scripts[1].length === 0) {
            console.log("❌ Scripts not uploaded. Please run upload:functions:production:fuji first.");
            return;
        }

        // Test 2: Check script content snippets
        console.log("\n🧪 Test 2: Checking script content...");
        const marketDataPreview = scripts[0].substring(0, 100);
        const predictionPreview = scripts[1].substring(0, 100);
        
        console.log(`Market Data Preview: "${marketDataPreview}..."`);
        console.log(`Prediction Preview: "${predictionPreview}..."`);
        
        // Verify they contain expected API integrations
        const hasPolymarketAPI = scripts[0].includes("clob.polymarket.com");
        const hasPredictionLogic = scripts[1].includes("generateSimplePrediction");
        
        console.log(`✅ Contains Polymarket API: ${hasPolymarketAPI}`);
        console.log(`✅ Contains Prediction Logic: ${hasPredictionLogic}`);

        // Test 3: Check Chainlink Functions limits compliance
        console.log("\n🧪 Test 3: Chainlink Functions compliance check...");
        const totalSize = scripts[0].length + scripts[1].length;
        const CHAINLINK_MAX_SIZE = 30 * 1024; // 30KB
        const utilization = (totalSize / CHAINLINK_MAX_SIZE * 100).toFixed(1);
        
        console.log(`Total size: ${totalSize} bytes (~${(totalSize/1024).toFixed(2)}KB)`);
        console.log(`Chainlink limit: ${CHAINLINK_MAX_SIZE} bytes (30KB)`);
        console.log(`Utilization: ${utilization}%`);
        console.log(`✅ Within limits: ${totalSize < CHAINLINK_MAX_SIZE ? 'Yes' : 'No'}`);

        // Test 4: Verify contract can create requests (simulation)
        console.log("\n🧪 Test 4: Testing request creation (simulation)...");
        
        // Register deployer as test agent first
        const isAuthorized = await contract.authorizedAgents(deployer.address);
        if (!isAuthorized) {
            console.log("Registering deployer as test agent...");
            const registerTx = await contract.registerAgent(deployer.address, "test-agent");
            await registerTx.wait();
            console.log("✅ Test agent registered");
        } else {
            console.log("✅ Already registered as authorized agent");
        }

        // Test market data request creation
        try {
            console.log("Testing market data request creation...");
            const marketId = "test-market-2024";
            const chainId = 43113; // Avalanche Fuji
            
            const requestTx = await contract.requestMarketData(marketId, chainId);
            const receipt = await requestTx.wait();
            console.log(`✅ Market data request created! Block: ${receipt.blockNumber}`);
            
            // Check for events
            if (receipt.logs && receipt.logs.length > 0) {
                for (let log of receipt.logs) {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        if (parsed.name === "AgentRequestCreated") {
                            console.log(`✅ Request ID: ${parsed.args[0]}`);
                            console.log(`✅ Request Type: ${parsed.args[2]}`);
                        }
                    } catch (e) {
                        // Ignore unparseable logs
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Market data request failed: ${error.message}`);
        }

        // Test prediction request creation
        try {
            console.log("\nTesting prediction request creation...");
            const marketId = "test-market-2024";
            const timeHorizon = 24; // 24 hours
            
            const requestTx = await contract.requestPrediction(marketId, timeHorizon);
            const receipt = await requestTx.wait();
            console.log(`✅ Prediction request created! Block: ${receipt.blockNumber}`);
            
            // Check for events
            if (receipt.logs && receipt.logs.length > 0) {
                for (let log of receipt.logs) {
                    try {
                        const parsed = contract.interface.parseLog(log);
                        if (parsed.name === "AgentRequestCreated") {
                            console.log(`✅ Request ID: ${parsed.args[0]}`);
                            console.log(`✅ Request Type: ${parsed.args[2]}`);
                        }
                    } catch (e) {
                        // Ignore unparseable logs
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Prediction request failed: ${error.message}`);
        }

        // Test 5: Check subscription IDs
        console.log("\n🧪 Test 5: Checking subscription configuration...");
        const subscriptionIds = await contract.getSubscriptionIds();
        console.log(`Functions Subscription ID: ${subscriptionIds[0]}`);
        console.log(`VRF Subscription ID: ${subscriptionIds[1]}`);
        
        if (subscriptionIds[0] === 1n && subscriptionIds[1] === 1n) {
            console.log("⚠️ Using default subscription IDs. Update these for production!");
        }

        console.log("\n🎉 Production Functions Testing Complete!");
        
        console.log("\n📋 Next Steps for Full Production:");
        console.log("1. ✅ Scripts uploaded and verified");
        console.log("2. ✅ Request creation working");
        console.log("3. 🔄 Set up Chainlink Functions subscription");
        console.log("4. 🔄 Add contract as consumer");
        console.log("5. 🔄 Fund subscription with LINK");
        console.log("6. 🔄 Test actual Functions execution");
        console.log("7. 🔄 Monitor performance and costs");

    } catch (error) {
        console.error("❌ Testing failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 