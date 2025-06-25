const hre = require("hardhat");

async function main() {
    console.log("🐛 Debugging Functions Call Failures...\n");

    const network = hre.network.name;
    console.log(`Network: ${network}`);

    const contractAddress = "0xb994dFecA893A8248e37a33ABdC9bC67f7f0322d";
    console.log(`Contract: ${contractAddress}\n`);

    // Get contract instance
    const ArbitrageCoordinator = await hre.ethers.getContractFactory("ArbitrageCoordinatorMinimal");
    const contract = ArbitrageCoordinator.attach(contractAddress);

    const [signer] = await hre.ethers.getSigners();
    console.log(`Signer: ${signer.address}`);

    // Test 1: Check current subscription details
    console.log("📋 Subscription Details:");
    console.log("=" .repeat(50));
    
    try {
        const subscriptionId = await contract.getSubscriptionId();
        const donId = await contract.donId();
        console.log(`Subscription ID: ${subscriptionId}`);
        console.log(`DON ID: ${donId}`);
        
        // Check if signer is authorized
        const isAuthorized = await contract.authorizedAgents(signer.address);
        console.log(`Agent Authorized: ${isAuthorized}`);
        
        // Check scripts
        const scripts = await contract.getScripts();
        console.log(`Market Data Script: ${scripts[0].length > 0 ? 'Set' : 'Not Set'}`);
        console.log(`Prediction Script: ${scripts[1].length > 0 ? 'Set' : 'Not Set'}`);
        
    } catch (error) {
        console.error("❌ Subscription check failed:", error.message);
    }

    // Test 2: Try to get detailed revert reason for market data request
    console.log("\n🧪 Testing Market Data Request with Detailed Error:");
    console.log("=" .repeat(50));
    
    try {
        const testMarketId = "test-simple-123";
        const testChainId = 1;
        
        console.log(`Testing with Market ID: ${testMarketId}`);
        console.log(`Chain ID: ${testChainId}`);
        
        // First try call (view) to get revert reason
        try {
            await contract.requestMarketData.staticCall(testMarketId, testChainId);
            console.log("✅ Static call succeeded - transaction should work");
        } catch (staticError) {
            console.error("❌ Static call failed:");
            console.error(`   Reason: ${staticError.reason || staticError.message}`);
            
            // Parse common error reasons
            if (staticError.message.includes("Market data script not set")) {
                console.log("🔧 FIX: JavaScript script not uploaded");
                return;
            } else if (staticError.message.includes("UnauthorizedAgent")) {
                console.log("🔧 FIX: Agent not authorized");
                return;
            } else if (staticError.message.includes("subscription")) {
                console.log("🔧 FIX: Subscription issue - check Functions UI");
                return;
            }
        }
        
        // If static call passes, try actual transaction
        console.log("\nAttempting actual transaction...");
        const tx = await contract.requestMarketData(testMarketId, testChainId);
        console.log(`✅ Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        
        // Look for events
        const events = receipt.logs.filter(log => {
            try {
                const decoded = contract.interface.parseLog(log);
                return decoded.name === "AgentRequestCreated";
            } catch {
                return false;
            }
        });
        
        if (events.length > 0) {
            const decoded = contract.interface.parseLog(events[0]);
            console.log(`🎫 Request ID: ${decoded.args.requestId}`);
            console.log("✅ Market data request successful!");
        }
        
    } catch (error) {
        console.error("❌ Market data request failed:");
        console.error(`   Error: ${error.message}`);
        
        // Try to get more specific error details
        if (error.data) {
            try {
                const decoded = contract.interface.parseError(error.data);
                console.error(`   Decoded Error: ${decoded.name}`);
                console.error(`   Args: ${JSON.stringify(decoded.args)}`);
            } catch (decodeError) {
                console.error(`   Raw Error Data: ${error.data}`);
            }
        }
    }

    // Test 3: Try AI prediction request
    console.log("\n🧪 Testing AI Prediction Request:");
    console.log("=" .repeat(50));
    
    try {
        const testMarketId = "test-simple-123";
        const timeHorizon = 24;
        
        // Static call first
        try {
            await contract.requestPrediction.staticCall(testMarketId, timeHorizon);
            console.log("✅ Prediction static call succeeded");
        } catch (staticError) {
            console.error("❌ Prediction static call failed:");
            console.error(`   Reason: ${staticError.reason || staticError.message}`);
            return;
        }
        
        // Actual transaction
        const tx = await contract.requestPrediction(testMarketId, timeHorizon);
        console.log(`✅ Prediction transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Prediction confirmed in block: ${receipt.blockNumber}`);
        
    } catch (error) {
        console.error("❌ AI prediction request failed:");
        console.error(`   Error: ${error.message}`);
    }

    // Test 4: Check Functions subscription status on-chain
    console.log("\n🔗 Checking Subscription Status:");
    console.log("=" .repeat(50));
    
    try {
        // Try to call the Functions oracle directly to check subscription
        const functionsOracleAddress = "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0";
        const functionsOracle = new hre.ethers.Contract(
            functionsOracleAddress,
            [
                "function getSubscription(uint64 subscriptionId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] memory consumers)"
            ],
            signer
        );
        
        const subscriptionId = await contract.getSubscriptionId();
        const subscriptionInfo = await functionsOracle.getSubscription(subscriptionId);
        
        console.log(`Subscription Balance: ${hre.ethers.formatUnits(subscriptionInfo[0], 18)} LINK`);
        console.log(`Request Count: ${subscriptionInfo[1]}`);
        console.log(`Owner: ${subscriptionInfo[2]}`);
        console.log(`Consumers: ${subscriptionInfo[3].length}`);
        console.log(`Contract is Consumer: ${subscriptionInfo[3].includes(contractAddress)}`);
        
        if (!subscriptionInfo[3].includes(contractAddress)) {
            console.log("❌ CONTRACT IS NOT ADDED AS CONSUMER!");
            console.log("🔧 FIX: Add contract as consumer in Functions UI");
        } else {
            console.log("✅ Contract is properly added as consumer");
        }
        
        if (subscriptionInfo[0] < hre.ethers.parseUnits("0.1", 18)) {
            console.log("❌ SUBSCRIPTION BALANCE TOO LOW!");
            console.log("🔧 FIX: Fund subscription with LINK tokens");
        } else {
            console.log("✅ Subscription has sufficient LINK balance");
        }
        
    } catch (error) {
        console.error("❌ Could not check subscription status:");
        console.error(`   Error: ${error.message}`);
    }

    console.log("\n🎯 Summary:");
    console.log("=" .repeat(50));
    console.log("If all tests pass but Functions still fail:");
    console.log("1. Check Functions UI: https://functions.chain.link/");
    console.log("2. Verify contract is added as consumer");
    console.log("3. Verify subscription is funded with LINK");
    console.log("4. Try waiting a few minutes and testing again");
    console.log("5. Check for rate limits or DON congestion");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug script failed:", error);
        process.exit(1);
    }); 