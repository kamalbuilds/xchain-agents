const hre = require("hardhat");
const { ethers } = require("hardhat");
const config = require("../deploy-config.json");

/**
 * 🔧 COMPREHENSIVE CCIP INFRASTRUCTURE SETUP
 * 
 * This script sets up all necessary CCIP infrastructure for cross-chain arbitrage:
 * - Chain allowlists
 * - Token approvals
 * - LINK token funding
 * - Subscription management
 * - Agent registrations
 */

async function main() {
    console.log("🔧 SETTING UP CCIP INFRASTRUCTURE FOR CROSS-CHAIN ARBITRAGE");
    console.log("=" .repeat(80));

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} AVAX`);

    // Get network configuration
    const networkName = hre.network.name;
    const networkConfig = config[networkName === "avalancheFuji" ? "avalancheFuji" : "sepolia"];
    
    if (!networkConfig) {
        throw new Error(`❌ Network configuration not found for ${networkName}`);
    }

    console.log(`🌐 Network: ${networkName} (${networkConfig.chainId})`);
    console.log(`🔗 CCIP Router: ${networkConfig.contracts.CCIP_ROUTER}`);
    console.log(`🪙 LINK Token: ${networkConfig.contracts.LINK_TOKEN}`);

    // Contract addresses
    const CONTRACT_ADDRESS = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    
    console.log(`📍 Arbitrage Contract: ${CONTRACT_ADDRESS}`);
    console.log("");

    // ============ STEP 1: CONTRACT SETUP ============
    console.log("🔧 STEP 1: BASIC CONTRACT SETUP");
    console.log("-".repeat(50));

    const ArbitrageCoordinator = await ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinator.attach(CONTRACT_ADDRESS);

    // Register deployer as authorized agent
    console.log("👤 Registering deployer as authorized agent...");
    try {
        const isAuthorized = await contract.authorizedAgents(deployer.address);
        if (!isAuthorized) {
            const registerTx = await contract.registerAgent(deployer.address, "cross-chain-arbitrageur", {
                gasLimit: 300000
            });
            await registerTx.wait();
            console.log("✅ Deployer registered as authorized agent");
        } else {
            console.log("✅ Deployer already registered as authorized agent");
        }
    } catch (error) {
        console.log(`⚠️ Agent registration error: ${error.message}`);
        if (error.message.includes("Ownable")) {
            console.log("💡 Note: Only contract owner can register agents");
        }
    }

    // ============ STEP 2: LINK TOKEN SETUP ============
    console.log("\n💰 STEP 2: LINK TOKEN SETUP");
    console.log("-".repeat(50));

    const linkToken = await ethers.getContractAt("IERC20", networkConfig.contracts.LINK_TOKEN);
    
    // Check LINK balance
    const linkBalance = await linkToken.balanceOf(deployer.address);
    console.log(`💰 Deployer LINK Balance: ${ethers.formatEther(linkBalance)} LINK`);

    const contractLinkBalance = await linkToken.balanceOf(CONTRACT_ADDRESS);
    console.log(`💰 Contract LINK Balance: ${ethers.formatEther(contractLinkBalance)} LINK`);

    // Fund contract with LINK if needed
    const requiredLink = ethers.parseEther("5"); // 5 LINK for testing
    if (contractLinkBalance < requiredLink && linkBalance >= requiredLink) {
        console.log("📤 Transferring LINK to contract...");
        try {
            const transferTx = await linkToken.transfer(CONTRACT_ADDRESS, requiredLink, {
                gasLimit: 100000
            });
            await transferTx.wait();
            console.log(`✅ Transferred ${ethers.formatEther(requiredLink)} LINK to contract`);
        } catch (error) {
            console.log(`❌ LINK transfer failed: ${error.message}`);
        }
    } else if (linkBalance < requiredLink) {
        console.log("⚠️ Insufficient LINK balance. Get LINK from faucet:");
        console.log(`🔗 Avalanche Fuji: https://faucets.chain.link/fuji`);
        console.log(`🔗 Sepolia: https://faucets.chain.link/sepolia`);
    } else {
        console.log("✅ Contract has sufficient LINK balance");
    }

    // ============ STEP 3: CCIP ALLOWLIST SETUP ============
    console.log("\n🌐 STEP 3: CCIP ALLOWLIST SETUP");
    console.log("-".repeat(50));

    const chainSelectors = {
        avalancheFuji: "14767482510784806043",
        sepolia: "16015286601757825753"
    };

    // Determine destination chain
    const destChain = networkName === "avalancheFuji" ? "sepolia" : "avalancheFuji";
    const destChainSelector = chainSelectors[destChain];

    console.log(`🔗 Current Chain: ${networkName} (${chainSelectors[networkName]})`);
    console.log(`🎯 Destination Chain: ${destChain} (${destChainSelector})`);

    // Check if destination chain is whitelisted
    try {
        const isWhitelisted = await contract.whitelistedDestinationChains(destChainSelector);
        console.log(`🔍 Destination chain whitelisted: ${isWhitelisted}`);
        
        if (!isWhitelisted) {
            console.log("⚠️ Destination chain not whitelisted");
            console.log("💡 Owner needs to whitelist destination chain for CCIP messaging");
        }
    } catch (error) {
        console.log(`⚠️ Could not check whitelist status: ${error.message}`);
    }

    // ============ STEP 4: CCIP TOKEN APPROVALS ============
    console.log("\n🪙 STEP 4: CCIP TOKEN APPROVALS");
    console.log("-".repeat(50));

    const ccipTokens = {
        avalancheFuji: {
            bnm: "0xD21341536c5cF5EB1bcb58f6723cE26e8D8E90e4",
            lnm: "0x70F5c5C40b873EA597776DA2C21929A8282A953a"
        },
        sepolia: {
            bnm: "0xFd57b4ddBf88a4e07fF4e34C487b99af2Fe82a05",
            lnm: "0x466D489b6d36E7E3b824ef491C225F5830E81cC1"
        }
    };

    const currentTokens = ccipTokens[networkName];
    if (currentTokens) {
        // Check BnM token balance and approval
        try {
            const bnmToken = await ethers.getContractAt("IERC20", currentTokens.bnm);
            const bnmBalance = await bnmToken.balanceOf(deployer.address);
            const bnmAllowance = await bnmToken.allowance(deployer.address, networkConfig.contracts.CCIP_ROUTER);
            
            console.log(`💰 CCIP BnM Balance: ${ethers.formatEther(bnmBalance)} BnM`);
            console.log(`🔓 CCIP BnM Allowance: ${ethers.formatEther(bnmAllowance)} BnM`);

            // Approve CCIP router if needed
            const requiredApproval = ethers.parseEther("100"); // 100 BnM
            if (bnmAllowance < requiredApproval && bnmBalance > 0) {
                console.log("🔓 Approving CCIP Router for BnM tokens...");
                const approveTx = await bnmToken.approve(networkConfig.contracts.CCIP_ROUTER, requiredApproval, {
                    gasLimit: 100000
                });
                await approveTx.wait();
                console.log("✅ CCIP Router approved for BnM tokens");
            } else if (bnmBalance === 0n) {
                console.log("⚠️ No CCIP BnM tokens. Get from faucet:");
                console.log(`🔗 CCIP Faucet: https://faucets.chain.link/`);
            } else {
                console.log("✅ CCIP Router already approved for BnM tokens");
            }
        } catch (error) {
            console.log(`⚠️ CCIP token setup error: ${error.message}`);
        }
    }

    // ============ STEP 5: CHAINLINK FUNCTIONS SETUP ============
    console.log("\n⚡ STEP 5: CHAINLINK FUNCTIONS SETUP");
    console.log("-".repeat(50));

    try {
        const subscriptionIds = await contract.getSubscriptionIds();
        console.log(`📋 Functions Subscription ID: ${subscriptionIds[0]}`);
        console.log(`🎲 VRF Subscription ID: ${subscriptionIds[1]}`);

        if (subscriptionIds[0] === 0n) {
            console.log("⚠️ No Chainlink Functions subscription set");
            console.log("💡 Create a subscription at: https://functions.chain.link/");
            console.log("💡 Then update with: contract.updateFunctionsSubscriptionId(subscriptionId)");
        }

        if (subscriptionIds[1] === 0n) {
            console.log("⚠️ No VRF subscription set");
            console.log("💡 Create a subscription at: https://vrf.chain.link/");
            console.log("💡 Then update with: contract.updateVRFSubscriptionId(subscriptionId)");
        }
    } catch (error) {
        console.log(`⚠️ Could not retrieve subscription IDs: ${error.message}`);
    }

    // Check if scripts are set
    try {
        console.log("📜 Checking deployed scripts...");
        // This will fail if not owner, but that's expected
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script: ${scripts[0].length} chars`);
        console.log(`✅ AI Prediction Script: ${scripts[1].length} chars`);
    } catch (error) {
        console.log("⚠️ Could not retrieve scripts (owner-only function)");
        console.log("💡 Deploy scripts with:");
        console.log("   npm run deploy:market-data:fuji");
        console.log("   npm run deploy:ai-prediction:fuji");
    }

    // ============ STEP 6: VALIDATION TESTS ============
    console.log("\n🧪 STEP 6: VALIDATION TESTS");
    console.log("-".repeat(50));

    // Test basic contract functions
    try {
        console.log("🔍 Testing contract state...");
        
        // Test agent authorization
        const isAuthorized = await contract.authorizedAgents(deployer.address);
        console.log(`👤 Agent Authorized: ${isAuthorized}`);

        // Test performance metrics
        const metrics = await contract.getPerformanceMetrics();
        console.log(`📊 Total Trades: ${metrics[0]}`);
        console.log(`💰 Total Profit: ${ethers.formatEther(metrics[1])} ETH`);

        // Test active markets
        const activeMarkets = await contract.getActiveMarkets();
        console.log(`📈 Active Markets: ${activeMarkets.length}`);

        console.log("✅ Basic contract validation passed");
    } catch (error) {
        console.log(`⚠️ Contract validation error: ${error.message}`);
    }

    // ============ SUMMARY ============
    console.log("\n📋 SETUP SUMMARY");
    console.log("=" .repeat(60));

    console.log("✅ COMPLETED STEPS:");
    console.log("   🔧 Contract connection established");
    console.log("   👤 Agent registration attempted");
    console.log("   💰 LINK token setup checked");
    console.log("   🌐 CCIP configuration reviewed");
    console.log("   🪙 Token approvals checked");
    console.log("   ⚡ Chainlink services validated");

    console.log("\n⚠️ POTENTIAL ISSUES TO FIX:");
    console.log("   1. Ensure deployer is contract owner or authorized agent");
    console.log("   2. Fund contract with LINK tokens");
    console.log("   3. Create Chainlink Functions subscription");
    console.log("   4. Create VRF subscription");
    console.log("   5. Whitelist destination chains for CCIP");
    console.log("   6. Deploy JavaScript scripts");
    console.log("   7. Fund with CCIP test tokens");

    console.log("\n💡 NEXT STEPS:");
    console.log("   1. Fix any identified issues above");
    console.log("   2. Deploy to Sepolia:");
    console.log("      npm run deploy:sepolia-arbitrage");
    console.log("   3. Run CCIP test:");
    console.log("      npm run test:ccip-arbitrage");

    console.log("\n🔗 USEFUL LINKS:");
    console.log("   🚰 LINK Faucet: https://faucets.chain.link/");
    console.log("   ⚡ Functions: https://functions.chain.link/");
    console.log("   🎲 VRF: https://vrf.chain.link/");
    console.log("   🌐 CCIP Explorer: https://ccip.chain.link/");

    console.log("\n🚀 CCIP INFRASTRUCTURE SETUP COMPLETED!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ CCIP setup failed:", error);
        process.exit(1);
    }); 