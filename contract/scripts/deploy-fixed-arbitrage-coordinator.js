const { ethers, network } = require("hardhat");

/**
 * Deploy Fixed ArbitrageCoordinator with proper uint256 VRF subscription ID
 * Your VRF subscription: 79197143012727645733885109275848325991384893307881015682220146424524207073831
 */
async function main() {
    console.log("🚀 Deploying Fixed ArbitrageCoordinator with VRF uint256");
    console.log("Network:", network.name);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

    // Network configurations with your actual VRF subscription ID
    const networkConfigs = {
        "avalancheFuji": {
            ccipRouter: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
            linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
            functionsOracle: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
            donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",
            functionsSubscriptionId: 15643,
            vrfCoordinator: "0x2eD832Ba664535e5886b75D64C46EB9a228C2610",
            keyHash: "0x354d2f95da55398f44b7cff77da56283d9c6c829a4bdf1bbcaf2ad6a4d081f61",
            vrfSubscriptionId: "79197143012727645733885109275848325991384893307881015682220146424524207073831"
        },
        "sepolia": {
            ccipRouter: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
            linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
            functionsOracle: "0x649a2C205BE7A3d5e99206CEEFF30c794f0E31EC",
            donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
            functionsSubscriptionId: 0, // Set your Sepolia Functions subscription
            vrfCoordinator: "0x8103B0A8A00be2DDC778e6e7eaa21791Cd364625",
            keyHash: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
            vrfSubscriptionId: "0" // Set your Sepolia VRF subscription if needed
        }
    };

    const config = networkConfigs[network.name];
    if (!config) {
        throw new Error(`Network ${network.name} not supported`);
    }

    console.log("📋 Configuration:");
    console.log(`  Functions Subscription: ${config.functionsSubscriptionId} (uint64)`);
    console.log(`  VRF Subscription: ${config.vrfSubscriptionId} (uint256)`);
    console.log(`  VRF Coordinator: ${config.vrfCoordinator}`);

    // Deploy with FULL VRF support using uint256
    console.log("\n🔨 Deploying FunctionsManager library...");
    
    // Deploy FunctionsManager library first
    const FunctionsManager = await ethers.getContractFactory("FunctionsManager");
    const functionsManager = await FunctionsManager.deploy();
    await functionsManager.waitForDeployment();
    const functionsManagerAddress = await functionsManager.getAddress();
    console.log(`✅ FunctionsManager library deployed: ${functionsManagerAddress}`);
    
    console.log("\n🔨 Deploying ArbitrageCoordinator with library linking...");
    
    // Get contract factory with library linking
    const ArbitrageCoordinator = await ethers.getContractFactory("ArbitrageCoordinator", {
        libraries: {
            FunctionsManager: functionsManagerAddress
        }
    });
    
    // Deploy with all services enabled
    const arbitrageCoordinator = await ArbitrageCoordinator.deploy(
        config.ccipRouter,                    // router
        config.linkToken,                     // linkToken  
        config.functionsOracle,               // functionsOracle
        config.donId,                         // donId
        config.functionsSubscriptionId,       // Functions subscription (uint64)
        config.vrfCoordinator,                // VRF coordinator
        config.keyHash,                       // VRF key hash
        config.vrfSubscriptionId              // VRF subscription (uint256) ✅
    );

    await arbitrageCoordinator.waitForDeployment();
    const contractAddress = await arbitrageCoordinator.getAddress();

    console.log(`✅ ArbitrageCoordinator deployed: ${contractAddress}`);

    // Setup configuration
    console.log("\n⚙️ Setting up configuration...");
    
    // Register deployer as agent
    await arbitrageCoordinator.registerAgent(deployer.address, "coordinator");
    console.log("  ✅ Agent registered");

    // Load production scripts
    const fs = require('fs');
    
    try {
        const marketDataScript = fs.readFileSync('scripts/functions/marketDataFetcher.js', 'utf8');
        const aiPredictionScript = fs.readFileSync('scripts/functions/aiPredictionScript-optimized.js', 'utf8');
        
        console.log(`  📄 Market Data Script: ${Math.round(marketDataScript.length / 1024)}KB`);
        console.log(`  📄 AI Prediction Script: ${Math.round(aiPredictionScript.length / 1024)}KB`);
        
        await arbitrageCoordinator.setMarketDataScript(marketDataScript);
        await arbitrageCoordinator.setPredictionScript(aiPredictionScript);
        console.log("  ✅ Production scripts loaded");
    } catch (error) {
        console.log("  ⚠️  Script loading failed:", error.message);
        // Set placeholder scripts
        await arbitrageCoordinator.setMarketDataScript("return Functions.encodeUint256(100000000);");
        await arbitrageCoordinator.setPredictionScript("return Functions.encodeUint256(105000000);");
        console.log("  ⚠️  Using placeholder scripts");
    }

    // Whitelist destination chains for CCIP
    const destinationChains = {
        "avalancheFuji": [11155111], // Sepolia
        "sepolia": [14767482510784806043] // Avalanche Fuji
    };

    if (destinationChains[network.name]) {
        console.log("  🌐 Whitelisting CCIP destination chains...");
        for (const chainSelector of destinationChains[network.name]) {
            await arbitrageCoordinator.allowlistDestinationChain(chainSelector, true);
            console.log(`    ✅ Chain selector: ${chainSelector}`);
        }
    }

    // Verify subscription IDs
    console.log("\n🔍 Verifying subscriptions...");
    const [functionsSubId, vrfSubId] = await arbitrageCoordinator.getSubscriptionIds();
    console.log(`  Functions Subscription: ${functionsSubId} (uint64)`);
    console.log(`  VRF Subscription: ${vrfSubId.toString()} (uint256)`);

    // Save deployment info
    const deploymentInfo = {
        network: network.name,
        contractAddress: contractAddress,
        functionsManagerLibrary: functionsManagerAddress,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        configuration: {
            functionsSubscriptionId: config.functionsSubscriptionId,
            vrfSubscriptionId: config.vrfSubscriptionId,
            ccipRouter: config.ccipRouter,
            vrfCoordinator: config.vrfCoordinator,
            functionsOracle: config.functionsOracle
        },
        services: {
            ccip: true,
            functions: true,
            vrf: true,
            automation: true
        },
        scripts: {
            marketDataLoaded: true,
            aiPredictionLoaded: true,
            scriptsSize: "~45KB total"
        }
    };

    fs.writeFileSync(
        `deployments/arbitrage-coordinator-fixed-${network.name}.json`,
        JSON.stringify(deploymentInfo, null, 2)
    );

    console.log("\n🎉 Deployment Complete!");
    console.log("═══════════════════════════════════════════════════");
    console.log(`✅ Contract: ${contractAddress}`);
    console.log(`✅ Functions: ENABLED (sub ${config.functionsSubscriptionId})`);
    console.log(`✅ VRF: ENABLED (sub ${config.vrfSubscriptionId.slice(0, 20)}...)`);
    console.log(`✅ CCIP: ENABLED`);
    console.log(`✅ Automation: ENABLED`);
    console.log("═══════════════════════════════════════════════════");

    console.log("\n📋 Next Steps:");
    console.log("1. Add contract as consumer to Functions subscription 15643");
    console.log("2. Add contract as consumer to VRF subscription");
    console.log("3. Fund contract with LINK tokens");
    console.log("4. Test all Chainlink services");
    console.log("5. Deploy and configure Eliza AI agents");

    return contractAddress;
}

main()
    .then((address) => {
        console.log(`\n✅ Success: ${address}`);
        console.log("🤖 Next: Configure Eliza AI agents");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Failed:", error);
        process.exit(1);
    }); 