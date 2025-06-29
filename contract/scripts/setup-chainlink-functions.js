const hre = require("hardhat");

async function main() {
    console.log("🔗 Chainlink Functions Setup Guide for Avalanche Fuji\n");

    const network = hre.network.name;
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";

    console.log(`Network: ${network}`);
    console.log(`Contract Address: ${contractAddress}\n`);

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [signer] = await hre.ethers.getSigners();
    console.log(`Signer Address: ${signer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await signer.provider.getBalance(signer.address))} ETH\n`);

    // Step 1: Verify deployed scripts
    console.log("📋 Step 1: Verifying deployed JavaScript Functions...");
    const scripts = await contract.getScripts();
    
    console.log(`✅ Market Data Script: ${scripts[0].length} characters (~${(scripts[0].length/1024).toFixed(1)}KB)`);
    console.log(`✅ AI Prediction Script: ${scripts[1].length} characters (~${(scripts[1].length/1024).toFixed(1)}KB)`);
    console.log(`✅ Total Size: ${scripts[0].length + scripts[1].length} characters (~${((scripts[0].length + scripts[1].length)/1024).toFixed(1)}KB)`);
    
    if (scripts[0].length === 0) {
        console.log("❌ No market data script found. Please deploy first with:");
        console.log("   npm run upload:functions:production:fuji");
        return;
    }

    // Verify API integrations in the script
    const hasPolymarketAPI = scripts[0].includes("clob.polymarket.com");
    const hasGammaAPI = scripts[0].includes("gamma-api.polymarket.com");
    console.log(`✅ Contains Polymarket CLOB API: ${hasPolymarketAPI}`);
    console.log(`✅ Contains Polymarket Gamma API: ${hasGammaAPI}`);

    // Step 2: Current subscription status
    console.log("\n📋 Step 2: Current subscription configuration...");
    const subscriptionIds = await contract.getSubscriptionIds();
    console.log(`Current Functions Subscription ID: ${subscriptionIds[0]}`);
    console.log(`Current VRF Subscription ID: ${subscriptionIds[1]}`);
    
    if (subscriptionIds[0] === 1n) {
        console.log("⚠️ Using default subscription ID (1). You need to create a real subscription.");
    }

    // Step 3: Manual setup instructions
    console.log("\n🔧 Step 3: Manual Chainlink Functions Setup");
    console.log("=========================================");
    
    console.log("\n1️⃣ Create Chainlink Functions Subscription:");
    console.log("   🔗 Visit: https://functions.chain.link/avalanche-fuji");
    console.log("   📝 Connect your wallet");
    console.log("   🆕 Click 'Create Subscription'");
    console.log("   💰 Fund with LINK tokens (get from: https://faucets.chain.link/avalanche-fuji)");

    console.log("\n2️⃣ Add Contract as Consumer:");
    console.log(`   📋 Consumer Address: ${contractAddress}`);
    console.log("   ➕ Click 'Add Consumer' in your subscription");
    console.log("   📝 Paste the contract address above");

    console.log("\n3️⃣ Update Contract with Real Subscription ID:");
    console.log("   📝 Copy your subscription ID from the Functions dashboard");
    console.log("   🔄 Run this command to update: ");
    console.log(`   npx hardhat run --network avalancheFuji -e "
        const contract = await hre.ethers.getContractAt('ArbitrageCoordinatorUpgradeable', '${contractAddress}');
        await contract.updateFunctionsSubscriptionId(YOUR_SUBSCRIPTION_ID);
        console.log('Subscription updated!');
    "`);

    console.log("\n4️⃣ Test with Real Market Data:");
    console.log("   🧪 After setup, test with: npm run test:functions:production:fuji");

    // Step 4: Show what the JavaScript will do
    console.log("\n📋 Step 4: What your deployed Functions will do:");
    console.log("===============================================");
    console.log("🔍 Market Data Fetcher will:");
    console.log("   • Hit Polymarket CLOB API for real-time prices");
    console.log("   • Hit Polymarket Gamma API for backup data");
    console.log("   • Calculate mid-price from bid/ask spreads");
    console.log("   • Aggregate volume from order books");
    console.log("   • Return: [price, volume, timestamp] as bytes");
    
    console.log("\n🤖 AI Prediction Script will:");
    console.log("   • Generate algorithmic predictions");
    console.log("   • Calculate confidence scores");
    console.log("   • Adjust for time horizons");
    console.log("   • Return: [predictedPrice, confidence, timeHorizon] as bytes");

    // Step 5: Network info
    console.log("\n📡 Network Information:");
    console.log("======================");
    console.log(`Router Address: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0`);
    console.log(`DON ID: fun-avalanche-fuji-1`);
    console.log(`LINK Token: 0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846`);
    console.log(`Chain ID: 43113`);
    
    // Step 6: Test request creation
    console.log("\n📋 Step 6: Test request creation (simulation):");
    try {
        // Check if we're authorized to make requests
        const isAuthorized = await contract.authorizedAgents(signer.address);
        
        if (!isAuthorized) {
            console.log("⚠️ Not authorized as agent. Registering...");
            const registerTx = await contract.registerAgent(signer.address, "test-agent");
            await registerTx.wait();
            console.log("✅ Registered as authorized agent");
        } else {
            console.log("✅ Already authorized as agent");
        }

        // Create a test request
        console.log("🧪 Creating test market data request...");
        const testMarketId = "0x00eb89b2ba57adb8b9af21b37f73d3d3d4c7e6c3e5c4b9e6f2f5e5b6d1234567";
        const testChainId = 43113;
        
        const requestTx = await contract.requestMarketData(testMarketId, testChainId, {
            gasLimit: 500000 // Higher gas limit for safety
        });
        const receipt = await requestTx.wait();
        
        console.log(`✅ Test request created! Block: ${receipt.blockNumber}`);
        console.log(`Transaction: ${receipt.hash}`);
        
        // Parse events
        for (const log of receipt.logs) {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed.name === "AgentRequestCreated") {
                    console.log(`📋 Request ID: ${parsed.args[0]}`);
                    console.log(`📋 Request Type: ${parsed.args[2]}`);
                }
            } catch (e) {
                // Ignore unparseable logs
            }
        }

        console.log("\n💡 Note: This request won't execute until you:");
        console.log("   1. Set up a real Functions subscription");
        console.log("   2. Fund it with LINK");
        console.log("   3. Add the contract as consumer");
        console.log("   4. Update the subscription ID in the contract");

    } catch (error) {
        console.log(`❌ Test request failed: ${error.message}`);
        if (error.message.includes("subscription")) {
            console.log("💡 This confirms you need a real subscription to execute Functions");
        }
    }

    console.log("\n🎉 Setup Guide Complete!");
    console.log("\n📋 Summary Checklist:");
    console.log("☐ Create Functions subscription at functions.chain.link");
    console.log("☐ Fund subscription with LINK tokens");
    console.log(`☐ Add consumer: ${contractAddress}`);
    console.log("☐ Update contract with real subscription ID");
    console.log("☐ Test with: npm run test:functions:production:fuji");
    
    console.log("\n🔗 Useful Links:");
    console.log("   Functions App: https://functions.chain.link/avalanche-fuji");
    console.log("   LINK Faucet: https://faucets.chain.link/avalanche-fuji");
    console.log("   Explorer: https://testnet.snowtrace.io/");
    console.log(`   Your Contract: https://testnet.snowtrace.io/address/${contractAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Setup failed:", error);
        process.exit(1);
    }); 