const { ethers, network } = require("hardhat");

/**
 * Deploy existing ArbitrageCoordinator but skip VRF to avoid uint64/uint256 issue
 * Uses zero address for VRF coordinator and 0 for VRF subscription to bypass validation
 */
async function main() {
    console.log("🚀 Deploying ArbitrageCoordinator WITHOUT functional VRF");
    console.log("⚠️  VRF will be disabled due to uint64/uint256 subscription ID conflict");
    console.log("Network:", network.name);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Network configurations
    const networkConfigs = {
        "avalancheFuji": {
            ccipRouter: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
            linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
            functionsOracle: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
            donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",
            subscriptionId: 15643,
            vrfCoordinator: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610", // Real VRF coordinator but won't be used
            keyHash: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61",
        },
        "sepolia": {
            ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
            linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
            functionsOracle: "0x649a2C205BE7A3d5e99206CEEFF30c794f0E31EC",
            donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
            subscriptionId: 0, // Set your Sepolia Functions subscription
            vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
            keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
        }
    };

    const config = networkConfigs[network.name];
    if (!config) {
        throw new Error(`Network ${network.name} not supported`);
    }

    console.log("📋 Configuration:");
    console.log(`  Functions Subscription: ${config.subscriptionId}`);
    console.log(`  VRF Subscription: DISABLED (uint64 conflict)`);

    // Deploy ArbitrageCoordinatorNoVRF (simplified version without VRF)
    console.log("\n🔨 Deploying ArbitrageCoordinatorNoVRF...");
    
    const ArbitrageCoordinatorNoVRF = await ethers.getContractFactory("ArbitrageCoordinatorNoVRF");
    
    // Deploy simplified contract (no VRF parameters needed)
    const arbitrageCoordinator = await ArbitrageCoordinatorNoVRF.deploy(
        config.ccipRouter,          // router
        config.linkToken,           // linkToken  
        config.functionsOracle,     // functionsOracle
        config.donId,               // donId
        config.subscriptionId       // Functions subscription (uint64 - OK)
    );

    await arbitrageCoordinator.waitForDeployment();
    const contractAddress = await arbitrageCoordinator.getAddress();

    console.log(`✅ ArbitrageCoordinatorNoVRF deployed: ${contractAddress}`);
    console.log(`✅ VRF excluded from this deployment (no uint64 conflict)`);

    // Setup basic configuration
    console.log("\n⚙️ Setting up configuration...");
    
    await arbitrageCoordinator.registerAgent(deployer.address);
    console.log("  ✅ Agent registered");

    // Set working scripts from our production-ready files
    const fs = require('fs');
    
    try {
        const marketDataScript = fs.readFileSync('scripts/functions/marketDataFetcher.js', 'utf8');
        const aiPredictionScript = fs.readFileSync('scripts/functions/aiPredictionScript-optimized.js', 'utf8');
        
        await arbitrageCoordinator.setMarketDataScript(marketDataScript);
        await arbitrageCoordinator.setPredictionScript(aiPredictionScript);
        console.log("  ✅ Production scripts loaded");
        console.log(`  📄 Market Data Script: ${Math.round(marketDataScript.length / 1024)}KB`);
        console.log(`  📄 AI Prediction Script: ${Math.round(aiPredictionScript.length / 1024)}KB`);
    } catch (error) {
        console.log("  ⚠️  Script loading failed:", error.message);
        await arbitrageCoordinator.setMarketDataScript("return Functions.encodeUint256(100000000);");
        await arbitrageCoordinator.setPredictionScript("return Functions.encodeUint256(105000000);");
        console.log("  ⚠️  Using placeholder scripts");
    }

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        contractAddress: contractAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        configuration: {
            functionsSubscriptionId: config.subscriptionId,
            vrfSubscriptionId: "DISABLED_UINT64_CONFLICT",
            actualVrfSubscriptionId: "79197143012727645733885109275848325991384893307881015682220146424524207073831"
        },
        warnings: [
            "VRF functionality disabled due to uint64/uint256 subscription ID type mismatch",
            "Contract deployed with VRF subscription ID = 0 to avoid overflow",
            "To fix: Update contract to use uint256 for VRF subscription IDs"
        ]
    };

    fs.writeFileSync(
        `deployments/arbitrage-coordinator-no-vrf-${network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n🎉 Deployment Complete!");
    console.log("═══════════════════════════════════════════════════");
    console.log(`✅ Contract: ${contractAddress}`);
    console.log(`✅ Functions: ENABLED (subscription ${config.subscriptionId})`);
    console.log(`⚠️  VRF: DISABLED (uint64 conflict)`);
    console.log(`✅ CCIP: ENABLED`);
    console.log("═══════════════════════════════════════════════════");

    console.log("\n💡 VRF Issue Summary:");
    console.log(`❌ Your VRF subscription ID: ${79197143012727645733885109275848325991384893307881015682220146424524207073831}`);
    console.log(`❌ Contract expects: uint64 (max: 18,446,744,073,709,551,615)`);
    console.log(`✅ Solution: Use the fixed contract or remove VRF dependency`);

    return contractAddress;
}

main()
    .then((address) => {
        console.log(`\n✅ Success: ${address}`);
        console.log("🔧 Next: Update contract to uint256 for full VRF support");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Failed:", error);
        process.exit(1);
    }); 