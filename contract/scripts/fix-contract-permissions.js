const hre = require("hardhat");
const { ethers } = require("hardhat");

/**
 * 🔧 FIX CONTRACT PERMISSIONS AND OWNERSHIP
 * 
 * This script addresses common permission issues that cause transaction reverts:
 * - Agent registration
 * - Contract funding
 * - Basic setup validation
 */

async function main() {
    console.log("🔧 FIXING CONTRACT PERMISSIONS AND SETUP");
    console.log("=" .repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

    const CONTRACT_ADDRESS = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    console.log(`📍 Contract: ${CONTRACT_ADDRESS}`);

    // Get contract instance
    const ArbitrageCoordinator = await ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinator.attach(CONTRACT_ADDRESS);

    // ============ CHECK OWNERSHIP ============
    console.log("\n👑 CHECKING OWNERSHIP");
    console.log("-".repeat(40));

    try {
        const owner = await contract.owner();
        console.log(`📋 Contract Owner: ${owner}`);
        console.log(`🤔 Is Deployer Owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log("⚠️ WARNING: Deployer is not the contract owner!");
            console.log("💡 Only the owner can register agents and set scripts");
            console.log(`💡 Current owner: ${owner}`);
            console.log(`💡 Your address: ${deployer.address}`);
        }
    } catch (error) {
        console.log(`❌ Could not check ownership: ${error.message}`);
    }

    // ============ AGENT REGISTRATION ============
    console.log("\n👤 AGENT REGISTRATION");
    console.log("-".repeat(40));

    try {
        // Check if deployer is authorized
        const isAuthorized = await contract.authorizedAgents(deployer.address);
        console.log(`📋 Is Authorized Agent: ${isAuthorized}`);

        if (!isAuthorized) {
            console.log("🔄 Attempting to register as agent...");
            try {
                // Use lower gas limit and estimate gas first
                const gasEstimate = await contract.registerAgent.estimateGas(
                    deployer.address, 
                    "cross-chain-arbitrageur"
                );
                console.log(`⛽ Estimated Gas: ${gasEstimate}`);

                const registerTx = await contract.registerAgent(
                    deployer.address, 
                    "cross-chain-arbitrageur",
                    { 
                        gasLimit: gasEstimate + 50000n, // Add buffer
                        gasPrice: ethers.parseUnits("30", "gwei") // Explicit gas price
                    }
                );
                
                console.log(`📤 Transaction sent: ${registerTx.hash}`);
                const receipt = await registerTx.wait();
                console.log(`✅ Agent registered successfully! Block: ${receipt.blockNumber}`);
            } catch (regError) {
                console.log(`❌ Registration failed: ${regError.message}`);
                if (regError.message.includes("Ownable")) {
                    console.log("💡 Only contract owner can register agents");
                }
            }
        } else {
            console.log("✅ Already registered as authorized agent");
        }
    } catch (error) {
        console.log(`❌ Agent check failed: ${error.message}`);
    }

    // ============ SIMPLE FUNCTION TESTS ============
    console.log("\n🧪 SIMPLE FUNCTION TESTS");
    console.log("-".repeat(40));

    // Test read-only functions first
    try {
        console.log("📊 Testing read-only functions...");
        
        // Test performance metrics
        const metrics = await contract.getPerformanceMetrics();
        console.log(`✅ Performance Metrics: ${metrics[0]} trades, ${ethers.formatEther(metrics[1])} ETH profit`);
        
        // Test active markets
        const activeMarkets = await contract.getActiveMarkets();
        console.log(`✅ Active Markets: ${activeMarkets.length} markets`);
        
        // Test subscription IDs
        const subscriptionIds = await contract.getSubscriptionIds();
        console.log(`✅ Subscription IDs: Functions=${subscriptionIds[0]}, VRF=${subscriptionIds[1]}`);
        
    } catch (error) {
        console.log(`❌ Read-only function test failed: ${error.message}`);
    }

    // ============ MOCK DATA TEST ============
    console.log("\n📝 MOCK DATA TEST");
    console.log("-".repeat(40));

    // Only try if we're authorized
    const isAuthorized = await contract.authorizedAgents(deployer.address).catch(() => false);
    
    if (isAuthorized) {
        console.log("🧪 Testing with mock request fulfillment...");
        
        try {
            // Create a simple mock request
            const mockRequestId = ethers.keccak256(
                ethers.AbiCoder.defaultAbiCoder().encode(
                    ["uint256", "address"],
                    [Date.now(), deployer.address]
                )
            );

            // Simple response data (price, volume, timestamp)
            const mockResponse = ethers.AbiCoder.defaultAbiCoder().encode(
                ["uint256", "uint256", "uint256"],
                [52000000, 50000000000, Math.floor(Date.now() / 1000)] // 52 cents, 50k volume
            );

            console.log(`📋 Mock Request ID: ${mockRequestId}`);
            
            // Estimate gas for fulfillment
            const gasEstimate = await contract.fulfillRequest.estimateGas(
                mockRequestId,
                mockResponse,
                "0x"
            );
            console.log(`⛽ Estimated Gas: ${gasEstimate}`);

            // Execute fulfillment
            const fulfillTx = await contract.fulfillRequest(
                mockRequestId,
                mockResponse,
                "0x",
                { 
                    gasLimit: gasEstimate + 100000n,
                    gasPrice: ethers.parseUnits("30", "gwei")
                }
            );

            console.log(`📤 Fulfill Transaction: ${fulfillTx.hash}`);
            const receipt = await fulfillTx.wait();
            console.log(`✅ Mock fulfillment successful! Block: ${receipt.blockNumber}`);

            // Check for events
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    console.log(`📅 Event: ${parsed.name}`);
                } catch (e) {
                    // Ignore unparseable logs
                }
            }

        } catch (testError) {
            console.log(`❌ Mock test failed: ${testError.message}`);
            
            if (testError.message.includes("revert")) {
                console.log("💡 Contract logic is reverting the transaction");
                console.log("💡 This might be due to missing scripts or other requirements");
            }
        }
    } else {
        console.log("⚠️ Skipping mock test - not authorized agent");
    }

    // ============ DIAGNOSIS SUMMARY ============
    console.log("\n🔍 DIAGNOSIS SUMMARY");
    console.log("=" .repeat(60));

    try {
        const owner = await contract.owner();
        const isOwner = owner.toLowerCase() === deployer.address.toLowerCase();
        const isAgent = await contract.authorizedAgents(deployer.address);
        
        console.log("📋 PERMISSIONS STATUS:");
        console.log(`   👑 Is Contract Owner: ${isOwner}`);
        console.log(`   👤 Is Authorized Agent: ${isAgent}`);
        
        if (!isOwner && !isAgent) {
            console.log("\n❌ PERMISSION ISSUES DETECTED:");
            console.log("   🚫 Not contract owner");
            console.log("   🚫 Not authorized agent");
            console.log("\n💡 SOLUTIONS:");
            console.log("   1. Use the contract owner account");
            console.log("   2. Have owner register your address as agent");
            console.log("   3. Transfer ownership to your address");
        } else if (isOwner) {
            console.log("\n✅ OWNER ACCESS CONFIRMED");
            console.log("   You have full access to all contract functions");
        } else if (isAgent) {
            console.log("\n✅ AGENT ACCESS CONFIRMED");
            console.log("   You can make requests but not manage the contract");
        }
        
        // Check script deployment
        console.log("\n📜 SCRIPT STATUS:");
        try {
            const scripts = await contract.getScripts();
            if (scripts[0].length > 0) {
                console.log(`   ✅ Market Data Script: ${scripts[0].length} chars`);
            } else {
                console.log("   ❌ Market Data Script: Not deployed");
            }
            
            if (scripts[1].length > 0) {
                console.log(`   ✅ AI Prediction Script: ${scripts[1].length} chars`);
            } else {
                console.log("   ❌ AI Prediction Script: Not deployed");
            }
        } catch (e) {
            console.log("   ⚠️ Cannot check scripts (owner only)");
        }

    } catch (error) {
        console.log(`❌ Could not complete diagnosis: ${error.message}`);
    }

    console.log("\n🚀 PERMISSION CHECK COMPLETED!");
    console.log("Check the status above and follow suggested solutions");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Permission fix failed:", error);
        process.exit(1);
    }); 