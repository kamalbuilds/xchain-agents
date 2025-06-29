const hre = require("hardhat");
const { ethers, upgrades } = require("hardhat");
const config = require("../deploy-config.json");

/**
 * Deploy ArbitrageCoordinatorUpgradeable to Sepolia for cross-chain testing
 */
async function main() {
    console.log("🚀 DEPLOYING ARBITRAGE COORDINATOR TO SEPOLIA");
    console.log("=" .repeat(60));

    const [deployer] = await ethers.getSigners();
    console.log(`👤 Deploying with account: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

    // Get Sepolia configuration
    const sepoliaConfig = config.sepolia;
    console.log(`🔗 Network: Sepolia (${sepoliaConfig.chainId})`);
    console.log(`🌍 Explorer: ${sepoliaConfig.explorer}`);

    // Deploy ArbitrageCoordinatorUpgradeable
    console.log("\n📦 Deploying ArbitrageCoordinatorUpgradeable...");
    const ArbitrageCoordinator = await ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    
    const arbitrageCoordinator = await upgrades.deployProxy(
        ArbitrageCoordinator,
        [
            sepoliaConfig.contracts.CCIP_ROUTER,
            sepoliaConfig.contracts.LINK_TOKEN,
            sepoliaConfig.contracts.FUNCTIONS_ORACLE,
            sepoliaConfig.contracts.FUNCTIONS_DON_ID,
            0, // Subscription ID (to be set later)
            sepoliaConfig.contracts.VRF_COORDINATOR,
            sepoliaConfig.contracts.VRF_KEY_HASH,
            0  // VRF Subscription ID (to be set later)
        ],
        { 
            initializer: "initialize",
            kind: "uups"
        }
    );

    await arbitrageCoordinator.waitForDeployment();
    const contractAddress = await arbitrageCoordinator.getAddress();

    console.log(`✅ ArbitrageCoordinatorUpgradeable deployed to: ${contractAddress}`);
    console.log(`🔗 Explorer: ${sepoliaConfig.explorer}/address/${contractAddress}`);

    // Register deployer as authorized agent
    console.log("\n👤 Registering deployer as authorized agent...");
    try {
        const registerTx = await arbitrageCoordinator.registerAgent(deployer.address, "cross-chain-arbitrageur");
        await registerTx.wait();
        console.log("✅ Deployer registered as authorized agent");
    } catch (error) {
        console.log(`⚠️ Registration failed: ${error.message}`);
    }

    // Save deployment info
    const deploymentInfo = {
        network: "sepolia",
        chainId: sepoliaConfig.chainId,
        contractAddress: contractAddress, 
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        explorer: `${sepoliaConfig.explorer}/address/${contractAddress}`,
        chainlinkServices: {
            ccipRouter: sepoliaConfig.contracts.CCIP_ROUTER,
            linkToken: sepoliaConfig.contracts.LINK_TOKEN,
            functionsOracle: sepoliaConfig.contracts.FUNCTIONS_ORACLE,
            donId: sepoliaConfig.contracts.FUNCTIONS_DON_ID,
            vrfCoordinator: sepoliaConfig.contracts.VRF_COORDINATOR,
            keyHash: sepoliaConfig.contracts.VRF_KEY_HASH
        }
    };

    // Write deployment info to file
    const fs = require("fs");
    const deploymentPath = `./deployments/arbitrage-coordinator-sepolia.json`;
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
    console.log(`💾 Deployment info saved to: ${deploymentPath}`);

    console.log("\n🎉 SEPOLIA DEPLOYMENT COMPLETED!");
    console.log("=" .repeat(60));
    console.log("📋 DEPLOYMENT SUMMARY:");
    console.log(`   📍 Contract: ${contractAddress}`);
    console.log(`   🌍 Network: Sepolia (${sepoliaConfig.chainId})`);
    console.log(`   👤 Deployer: ${deployer.address}`);
    console.log(`   🔗 CCIP Router: ${sepoliaConfig.contracts.CCIP_ROUTER}`);
    console.log(`   ⚡ Functions Oracle: ${sepoliaConfig.contracts.FUNCTIONS_ORACLE}`);
    console.log(`   🎲 VRF Coordinator: ${sepoliaConfig.contracts.VRF_COORDINATOR}`);

    console.log("\n📝 NEXT STEPS:");
    console.log("1. Fund contract with LINK tokens for Chainlink services");
    console.log("2. Create Chainlink Functions subscription and add contract as consumer");
    console.log("3. Create VRF subscription and add contract as consumer");
    console.log("4. Set up CCIP allowlist with Avalanche Fuji contract");
    console.log("5. Deploy market data and AI prediction scripts");
    console.log("6. Run cross-chain arbitrage test:");
    console.log("   npm run test:ccip-arbitrage");

    console.log("\n🌐 CROSS-CHAIN TESTING READY!");
    console.log("Your Sepolia contract is now ready for cross-chain arbitrage testing with Avalanche Fuji");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 