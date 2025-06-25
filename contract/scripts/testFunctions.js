const hre = require("hardhat");

async function main() {
    console.log("🧪 Testing Chainlink Functions Integration...\n");

    // Get network configuration
    const network = hre.network.name;
    console.log(`Network: ${network}`);

    // Updated contract addresses from new deployment
    const addresses = {
        sepolia: {
            arbitrageCoordinator: "0xb994dFecA893A8248e37a33ABdC9bC67f7f0322d"
        },
        avalancheFuji: {
            arbitrageCoordinator: "0x65889afb511548c1db8887271fdbd2a4847b0fa2"
        }
    };

    const contractAddress = addresses[network]?.arbitrageCoordinator;
    if (!contractAddress) {
        throw new Error(`No contract address found for network: ${network}`);
    }

    console.log(`Contract Address: ${contractAddress}\n`);

    // Get contract instance - using the minimal version
    const ArbitrageCoordinator = await hre.ethers.getContractFactory("ArbitrageCoordinatorMinimal");
    const contract = ArbitrageCoordinator.attach(contractAddress);

    // Get deployer account (should be authorized agent)
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

    // Check if deployer is authorized agent
    try {
        const isAuthorized = await contract.authorizedAgents(deployer.address);
        if (!isAuthorized) {
            console.log("⚠️  Registering deployer as authorized agent...");
            const tx = await contract.registerAgent(deployer.address, "test-agent");
            await tx.wait();
            console.log("✅ Agent registered!");
        } else {
            console.log("✅ Deployer is authorized agent");
        }
    } catch (error) {
        console.error("❌ Failed to check/register agent:", error.message);
        return;
    }

    // Test 1: Market Data Request
    console.log("\n🔍 Test 1: Market Data Request");
    console.log("=".repeat(50));
    
    try {
        // Real Polymarket market ID - NFL Saturday: Chiefs vs. Raiders (verified to exist)
        const testMarketId = "0x9deb0baac40648821f96f01339229a422e2f5c877de55dc4dbf981f95a1e709c";
        const testChainId = 137; // Polygon mainnet (where Polymarket operates)

        console.log(`Requesting market data for Market ID: ${testMarketId}`);
        console.log(`Chain ID: ${testChainId} (Polygon - where Polymarket operates)`);
        console.log(`Market: NFL Saturday: Chiefs vs. Raiders`);

        const tx1 = await contract.requestMarketData(testMarketId, testChainId);
        console.log(`📤 Transaction sent: ${tx1.hash}`);
        
        const receipt = await tx1.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);

        // Find the AgentRequestCreated event
        const event = receipt.logs.find(log => {
            try {
                const decoded = contract.interface.parseLog(log);
                return decoded.name === "AgentRequestCreated";
            } catch {
                return false;
            }
        });

        if (event) {
            const decoded = contract.interface.parseLog(event);
            const requestId = decoded.args.requestId;
            console.log(`🎫 Request ID: ${requestId}`);
            console.log("⏳ Waiting for Chainlink Functions to fulfill request...");
            console.log("   (This can take 1-2 minutes on testnet)");
            
            // Note: In a real scenario, you'd listen for the AgentRequestFulfilled event
            // For now, we'll just show the request was created successfully
        } else {
            console.log("⚠️  AgentRequestCreated event not found in transaction logs");
        }

    } catch (error) {
        console.error("❌ Market data request failed:", error.message);
        if (error.message.includes("UnauthorizedAgent")) {
            console.log("💡 Make sure the deployer address is registered as an authorized agent");
        }
        if (error.message.includes("InsufficientBalance")) {
            console.log("💡 Make sure the Functions subscription has enough LINK tokens");
        }
        if (error.message.includes("Market data script not set")) {
            console.log("💡 Upload JavaScript source code first: npx hardhat run scripts/deployFunctions.js --network", network);
        }
    }

    // Test 2: AI Prediction Request
    console.log("\n🔍 Test 2: AI Prediction Request");
    console.log("=".repeat(50));
    
    try {
        // Real Polymarket market ID - 2024 Presidential Election (verified to exist)
        const testMarketId = "0x7b76dda87a490fe7fb793ba900c02685aaa193c75277c39f396121f902f9786c";
        const timeHorizon = 24; // 24 hours

        console.log(`Requesting AI prediction for Market ID: ${testMarketId}`);
        console.log(`Time Horizon: ${timeHorizon} hours`);
        console.log(`Market: Will Gavin Newsom win the 2024 US Presidential Election?`);

        const tx2 = await contract.requestPrediction(testMarketId, timeHorizon);
        console.log(`📤 Transaction sent: ${tx2.hash}`);
        
        const receipt2 = await tx2.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt2.blockNumber}`);

        // Find the AgentRequestCreated event
        const event2 = receipt2.logs.find(log => {
            try {
                const decoded = contract.interface.parseLog(log);
                return decoded.name === "AgentRequestCreated";
            } catch {
                return false;
            }
        });

        if (event2) {
            const decoded = contract.interface.parseLog(event2);
            const requestId = decoded.args.requestId;
            console.log(`🎫 Request ID: ${requestId}`);
            console.log("⏳ Waiting for Chainlink Functions to fulfill request...");
        }

    } catch (error) {
        console.error("❌ AI prediction request failed:", error.message);
        if (error.message.includes("Prediction script not set")) {
            console.log("💡 Upload JavaScript source code first: npx hardhat run scripts/deployFunctions.js --network", network);
        }
        if (error.message.includes("InsufficientBalance")) {
            console.log("💡 Make sure the Functions subscription has enough LINK tokens");
        }
    }

    // Test 3: Check Contract State
    console.log("\n🔍 Test 3: Contract State Check");
    console.log("=".repeat(50));
    
    try {
        // Check subscription ID
        const subscriptionId = await contract.getSubscriptionId();
        console.log(`Functions Subscription ID: ${subscriptionId}`);

        // Check scripts are uploaded
        try {
            const scripts = await contract.getScripts();
            console.log(`Market Data Script Length: ${scripts[0].length} characters`);
            console.log(`AI Prediction Script Length: ${scripts[1].length} characters`);
        } catch (error) {
            console.log("❌ Could not retrieve scripts (may require owner access)");
        }

        // Check active markets
        try {
            const activeMarkets = await contract.getActiveMarkets();
            console.log(`Active Markets: ${activeMarkets.length}`);
            if (activeMarkets.length > 0) {
                console.log(`First Active Market: ${activeMarkets[0]}`);
            }
        } catch (error) {
            console.log("ℹ️  No active markets yet");
        }

    } catch (error) {
        console.error("❌ Contract state check failed:", error.message);
    }

    console.log("\n🎉 Chainlink Functions Test Complete!");
    console.log("\n📋 What happens next:");
    console.log("1. 🕒 Functions requests are processed by the DON (1-2 minutes)");
    console.log("2. 📊 Market data gets stored in the contract");
    console.log("3. 🤖 AI predictions are generated and stored");
    console.log("4. ⚡ Future: Arbitrage opportunities automatically detected");
    console.log("5. 🔄 Future: Cross-chain messages sent via CCIP");

    console.log("\n🔗 Monitor your requests:");
    console.log(`Etherscan (Sepolia): https://sepolia.etherscan.io/address/${contractAddress}`);
    console.log(`Snowtrace (Fuji): https://testnet.snowtrace.io/address/${contractAddress}`);
    console.log("Functions UI: https://functions.chain.link/");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    }); 