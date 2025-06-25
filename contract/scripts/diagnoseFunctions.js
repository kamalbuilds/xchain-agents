const hre = require("hardhat");

async function main() {
    console.log("🔍 Diagnosing Chainlink Functions Issues...\n");

    // Get network configuration
    const network = hre.network.name;
    console.log(`Network: ${network}`);

    // Contract addresses
    const addresses = {
        sepolia: {
            arbitrageCoordinator: "0xb994dFecA893A8248e37a33ABdC9bC67f7f0322d",
            linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
            functionsOracle: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0"
        },
        avalancheFuji: {
            arbitrageCoordinator: "0xb325ceaf44488f1d46c84efaf4215f4a398bacd1",
            linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
            functionsOracle: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0"
        }
    };

    const contractAddr = addresses[network];
    if (!contractAddr) {
        throw new Error(`No addresses found for network: ${network}`);
    }

    console.log(`ArbitrageCoordinator: ${contractAddr.arbitrageCoordinator}`);
    console.log(`LINK Token: ${contractAddr.linkToken}`);
    console.log(`Functions Oracle: ${contractAddr.functionsOracle}\n`);

    // Get contract instances
    const ArbitrageCoordinator = await hre.ethers.getContractFactory("ArbitrageCoordinatorMinimal");
    const contract = ArbitrageCoordinator.attach(contractAddr.arbitrageCoordinator);

    const LinkToken = await hre.ethers.getContractFactory("MockERC20");
    const linkToken = new hre.ethers.Contract(
        contractAddr.linkToken,
        [
            "function balanceOf(address) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function decimals() view returns (uint8)"
        ],
        await hre.ethers.provider.getSigner()
    );

    // 1. Check contract configuration
    console.log("📋 Contract Configuration:");
    console.log("=" .repeat(50));
    
    try {
        const subscriptionId = await contract.getSubscriptionId();
        const donId = await contract.donId();
        console.log(`✅ Subscription ID: ${subscriptionId}`);
        console.log(`✅ DON ID: ${donId}`);
        
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script: ${scripts[0].length} characters`);
        console.log(`✅ AI Prediction Script: ${scripts[1].length} characters`);
    } catch (error) {
        console.error("❌ Configuration check failed:", error.message);
    }

    // 2. Check LINK token balance
    console.log("\n💰 LINK Token Balance:");
    console.log("=" .repeat(50));
    
    try {
        const balance = await linkToken.balanceOf(contractAddr.arbitrageCoordinator);
        const decimals = await linkToken.decimals();
        const formattedBalance = hre.ethers.formatUnits(balance, decimals);
        console.log(`Contract LINK Balance: ${formattedBalance} LINK`);
        
        if (parseFloat(formattedBalance) < 0.1) {
            console.log("⚠️  WARNING: Contract needs LINK tokens for Functions requests");
            console.log("   Minimum recommended: 1 LINK");
            console.log("   Get LINK from: https://faucets.chain.link/");
        } else {
            console.log("✅ Contract has sufficient LINK balance");
        }
    } catch (error) {
        console.error("❌ LINK balance check failed:", error.message);
    }

    // 3. Check agent authorization
    console.log("\n🤖 Agent Authorization:");
    console.log("=" .repeat(50));
    
    const [deployer] = await hre.ethers.getSigners();
    try {
        const isAuthorized = await contract.authorizedAgents(deployer.address);
        const role = await contract.agentRoles(deployer.address);
        console.log(`Agent Address: ${deployer.address}`);
        console.log(`Is Authorized: ${isAuthorized}`);
        console.log(`Role: ${role || "Not assigned"}`);
        
        if (!isAuthorized) {
            console.log("⚠️  WARNING: Deployer is not authorized as agent");
        } else {
            console.log("✅ Agent is properly authorized");
        }
    } catch (error) {
        console.error("❌ Agent authorization check failed:", error.message);
    }

    // 4. Check Functions subscription status
    console.log("\n🔗 Subscription Analysis:");
    console.log("=" .repeat(50));
    
    const currentSubId = await contract.getSubscriptionId();
    if (currentSubId.toString() === "1") {
        console.log("❌ Using default subscription ID (1)");
        console.log("🔧 ACTION REQUIRED: Update subscription ID");
        console.log("   1. Visit https://functions.chain.link/");
        console.log("   2. Create a subscription and fund it with LINK");
        console.log("   3. Add your contract as a consumer");
        console.log("   4. Update subscription ID using:");
        console.log(`   FUNCTIONS_SUBSCRIPTION_ID=YOUR_SUB_ID npx hardhat run scripts/update-subscriptions-minimal.ts --network ${network}`);
    } else {
        console.log(`✅ Using custom subscription ID: ${currentSubId}`);
        console.log("   Verify the subscription exists and is funded at:");
        console.log("   https://functions.chain.link/");
    }

    // 5. Test contract calls with detailed error info
    console.log("\n🧪 Detailed Function Test:");
    console.log("=" .repeat(50));
    
    try {
        const testMarketId = "test-market-123";
        const testChainId = 1;
        
        console.log("Attempting market data request...");
        
        // Try to estimate gas first
        const gasEstimate = await contract.requestMarketData.estimateGas(testMarketId, testChainId);
        console.log(`✅ Gas estimate: ${gasEstimate.toString()}`);
        
        // If gas estimation succeeds, the call should work
        console.log("✅ Function call validation passed");
        console.log("   Issue likely with subscription configuration");
        
    } catch (error) {
        console.error("❌ Function call failed:");
        console.error(`   Error: ${error.message}`);
        
        if (error.message.includes("Market data script not set")) {
            console.log("   🔧 Solution: Upload JavaScript code");
            console.log(`   npx hardhat run scripts/deployFunctions.js --network ${network}`);
        } else if (error.message.includes("UnauthorizedAgent")) {
            console.log("   🔧 Solution: Register agent");
            console.log("   Call contract.registerAgent() with deployer address");
        } else if (error.message.includes("InsufficientBalance")) {
            console.log("   🔧 Solution: Add LINK tokens to contract");
        } else {
            console.log("   🔧 Check subscription ID and consumer registration");
        }
    }

    console.log("\n🎯 Summary & Next Steps:");
    console.log("=" .repeat(50));
    console.log("1. ✅ Ensure subscription ID is updated (not default '1')");
    console.log("2. ✅ Ensure contract is added as consumer to subscription");
    console.log("3. ✅ Ensure subscription is funded with LINK");
    console.log("4. ✅ Ensure agent is authorized");
    console.log("5. ✅ Ensure JavaScript scripts are uploaded");
    console.log("\n🔗 Useful Links:");
    console.log("   Functions UI: https://functions.chain.link/");
    console.log("   LINK Faucet: https://faucets.chain.link/");
    console.log(`   Contract: ${contractAddr.arbitrageCoordinator}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Diagnosis failed:", error);
        process.exit(1);
    }); 