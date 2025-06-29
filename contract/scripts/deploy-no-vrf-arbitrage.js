const { ethers, network } = require("hardhat");

/**
 * Deploy Arbitrage Coordinator WITHOUT VRF to avoid uint64/uint256 type conflicts
 * This simplified version focuses on CCIP + Functions core functionality
 */
async function main() {
    console.log("🚀 Deploying Arbitrage Coordinator WITHOUT VRF");
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
            subscriptionId: 15643 // Your existing Functions subscription
        },
        "sepolia": {
            ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
            linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789", 
            functionsOracle: "0x649a2C205BE7A3d5e99206CEEFF30c794f0E31EC",
            donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
            subscriptionId: 0 // Set your Sepolia subscription ID
        },
        "polygonAmoy": {
            ccipRouter: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
            linkToken: "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904",
            functionsOracle: "0xC22a79eBA640940ABB6dF0f7982cc119578E11De",
            donId: "0x66756e2d706f6c79676f6e2d616d6f792d310000000000000000000000000000",
            subscriptionId: 0 // Set your Polygon subscription ID
        }
    };

    const config = networkConfigs[network.name];
    if (!config) {
        throw new Error(`Network ${network.name} not supported. Add configuration.`);
    }

    console.log("📋 Network Configuration:");
    console.log(`  CCIP Router: ${config.ccipRouter}`);
    console.log(`  LINK Token: ${config.linkToken}`);
    console.log(`  Functions Oracle: ${config.functionsOracle}`);
    console.log(`  DON ID: ${config.donId}`);
    console.log(`  Subscription ID: ${config.subscriptionId}`);

    // Deploy the simplified contract (NO VRF)
    console.log("\n🔨 Deploying ArbitrageCoordinator (No VRF)...");
    
    const ArbitrageCoordinator = await ethers.getContractFactory("ArbitrageCoordinator");
    
    // Deploy with constructor arguments (NO VRF subscription ID)
    const arbitrageCoordinator = await ArbitrageCoordinator.deploy(
        config.ccipRouter,
        config.linkToken,
        config.functionsOracle,
        config.donId,
        config.subscriptionId, // ONLY Functions subscription, NO VRF
        0, // Remove VRF subscription parameter
        ethers.ZeroAddress // Remove VRF coordinator parameter
    );

    await arbitrageCoordinator.waitForDeployment();
    const contractAddress = await arbitrageCoordinator.getAddress();

    console.log(`✅ ArbitrageCoordinator deployed to: ${contractAddress}`);

    // Setup initial configuration
    console.log("\n⚙️ Setting up initial configuration...");

    // Register deployer as authorized agent
    console.log("  Registering deployer as authorized agent...");
    await arbitrageCoordinator.registerAgent(deployer.address, "coordinator");
    
    // Whitelist destination chains
    const destinationChains = {
        "avalancheFuji": [11155111], // Sepolia
        "sepolia": [14767482510784806043], // Avalanche Fuji
        "polygonAmoy": [11155111, 14767482510784806043] // Sepolia, Avalanche Fuji
    };

    if (destinationChains[network.name]) {
        console.log("  Whitelisting destination chains...");
        for (const chainSelector of destinationChains[network.name]) {
            await arbitrageCoordinator.whitelistDestinationChain(chainSelector, true);
            console.log(`    ✅ Whitelisted chain selector: ${chainSelector}`);
        }
    }

    // Set JavaScript source codes
    console.log("  Setting Functions scripts...");
    
    // Use existing working scripts
    const marketDataScript = `// Market Data Script Placeholder\nreturn Functions.encodeUint256(100000000000);`; // $100k placeholder
    const predictionScript = `// AI Prediction Script Placeholder\nreturn Functions.encodeUint256(105000000000);`; // $105k prediction
    
    await arbitrageCoordinator.setMarketDataScript(marketDataScript);
    await arbitrageCoordinator.setPredictionScript(predictionScript);
    console.log("    ✅ Scripts configured");

    // Deploy summary
    console.log("\n🎉 Deployment Complete!");
    console.log("═══════════════════════════════════════");
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Network: ${network.name}`);
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Gas Used: Estimated 3-4M gas`);
    console.log("═══════════════════════════════════════");

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        contractAddress: contractAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        configuration: {
            ccipRouter: config.ccipRouter,
            linkToken: config.linkToken,
            functionsOracle: config.functionsOracle,
            donId: config.donId,
            functionsSubscriptionId: config.subscriptionId,
            vrfSubscriptionId: "REMOVED", // No VRF to avoid uint64/uint256 issues
            vrfCoordinator: "REMOVED"
        },
        features: {
            ccip: true,
            functions: true,
            automation: false, // Can be added later
            vrf: false, // REMOVED to avoid type conflicts
            dataStreams: false // Can be added later
        }
    };

    const fs = require('fs');
    fs.writeFileSync(
        `deployments/arbitrage-coordinator-no-vrf-${network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n📄 Next Steps:");
    console.log("1. Fund the contract with LINK tokens for Functions requests");
    console.log("2. Add the contract as a consumer to your Functions subscription");
    console.log("3. Test market data requests using the deployed scripts");
    console.log("4. Configure cross-chain routes for arbitrage opportunities");
    console.log("5. Optional: Add VRF later if needed (with uint256 subscription ID)");

    console.log("\n💡 VRF Integration Notes:");
    console.log("- VRF was removed to avoid uint64/uint256 subscription ID conflicts");
    console.log("- If you need VRF, create subscription with uint256 ID support");
    console.log("- The contract can be upgraded later to include VRF with proper types");

    // Verification command
    if (network.name !== "hardhat" && network.name !== "localhost") {
        console.log("\n🔍 Verification Command:");
        console.log(`npx hardhat verify --network ${network.name} ${contractAddress} "${config.ccipRouter}" "${config.linkToken}" "${config.functionsOracle}" "${config.donId}" ${config.subscriptionId}`);
    }

    return contractAddress;
}

main()
    .then((address) => {
        console.log(`\n✅ Deployment successful: ${address}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 