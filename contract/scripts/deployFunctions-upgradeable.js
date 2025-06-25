const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("📤 Uploading JavaScript source code to Upgradeable ArbitrageCoordinator...\n");

    // Get network configuration
    const network = hre.network.name;
    console.log(`Network: ${network}`);

    // Read deployment info from the upgradeable deployment
    const deploymentFile = path.join(__dirname, "../deployments", `arbitrage-coordinator-upgradeable-${network}.json`);
    
    let contractAddress;
    if (fs.existsSync(deploymentFile)) {
        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        contractAddress = deploymentInfo.proxyAddress;
        console.log(`📋 Found deployment info: ${deploymentFile}`);
        console.log(`📍 Contract Type: ${deploymentInfo.contractName}`);
        console.log(`🔄 Upgrade Type: ${deploymentInfo.upgradeType}`);
    } else {
        // Fallback to hardcoded address for avalancheFuji (our recent deployment)
        if (network === "avalancheFuji") {
            contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
        } else {
            throw new Error(`No deployment file found: ${deploymentFile}`);
        }
    }

    if (!contractAddress) {
        throw new Error(`No contract address found for network: ${network}`);
    }

    console.log(`Upgradeable Contract Address: ${contractAddress}\n`);

    // Get contract instance - using the upgradeable version
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

    // Read JavaScript files
    console.log("📄 Reading JavaScript source files...");
    
    const marketDataScript = fs.readFileSync(
        path.join(__dirname, "functions", "marketDataFetcher.js"), 
        "utf8"
    );
    
    const aiPredictionScript = fs.readFileSync(
        path.join(__dirname, "functions", "aiPredictionScript.js"), 
        "utf8"
    );

    console.log(`✅ Market Data Script: ${marketDataScript.length} characters`);
    console.log(`✅ AI Prediction Script: ${aiPredictionScript.length} characters\n`);

    // Upload Market Data Script
    console.log("📤 Uploading Market Data Script...");
    try {
        const tx1 = await contract.setMarketDataScript(marketDataScript, {
            gasLimit: 2000000 // Increase gas limit for large script uploads
        });
        console.log(`Transaction sent: ${tx1.hash}`);
        const receipt1 = await tx1.wait();
        console.log(`✅ Market Data Script uploaded! Block: ${receipt1.blockNumber}`);
    } catch (error) {
        console.error("❌ Failed to upload Market Data Script:", error.message);
        if (error.message.includes("Ownable")) {
            console.log("💡 Make sure you're using the owner account");
        }
        return;
    }

    // Upload AI Prediction Script
    console.log("\n📤 Uploading AI Prediction Script...");
    try {
        const tx2 = await contract.setPredictionScript(aiPredictionScript, {
            gasLimit: 2000000 // Increase gas limit for large script uploads
        });
        console.log(`Transaction sent: ${tx2.hash}`);
        const receipt2 = await tx2.wait();
        console.log(`✅ AI Prediction Script uploaded! Block: ${receipt2.blockNumber}`);
    } catch (error) {
        console.error("❌ Failed to upload AI Prediction Script:", error.message);
        return;
    }

    // Set empty encrypted secrets (placeholder)
    console.log("\n🔐 Setting encrypted secrets placeholder...");
    try {
        const tx3 = await contract.setEncryptedSecrets("0x");
        console.log(`Transaction sent: ${tx3.hash}`);
        const receipt3 = await tx3.wait();
        console.log(`✅ Encrypted secrets set! Block: ${receipt3.blockNumber}`);
    } catch (error) {
        console.error("❌ Failed to set encrypted secrets:", error.message);
        return;
    }

    // Verify uploads
    console.log("\n🔍 Verifying uploaded scripts...");
    try {
        const uploadedScripts = await contract.getScripts();
        const uploadedMarketDataScript = uploadedScripts[0];
        const uploadedPredictionScript = uploadedScripts[1];

        console.log(`📊 Uploaded Market Data Script: ${uploadedMarketDataScript.length} characters`);
        console.log(`🤖 Uploaded AI Prediction Script: ${uploadedPredictionScript.length} characters`);

        // Basic validation
        if (uploadedMarketDataScript.includes("fetchPolymarketCLOBData") && 
            uploadedPredictionScript.includes("generateAIPrediction")) {
            console.log("✅ Scripts contain expected functions!");
        } else {
            console.log("⚠️  Scripts may not have uploaded correctly.");
        }

    } catch (error) {
        console.error("❌ Failed to verify scripts:", error.message);
    }

    console.log("\n🎉 Upgradeable Contract JavaScript Source Code Upload Complete!");
    console.log("\n📋 What was uploaded:");
    console.log("1. 📊 Market Data Fetcher - Fetches real-time prediction market data");
    console.log("2. 🤖 AI Prediction Script - Generates AI-powered market predictions");
    console.log("3. 🔐 Encrypted Secrets - Placeholder for API keys");

    console.log("\n🔧 Upgradeable Contract Benefits:");
    console.log("- ✅ No 24KB contract size limitation");
    console.log("- ✅ Full ArbitrageCoordinator functionality");
    console.log("- ✅ UUPS proxy pattern for future upgrades");
    console.log("- ✅ Owner-controlled upgrade authorization");

    console.log("\n🔗 Next steps:");
    console.log(`1. Update Functions subscription: Add ${contractAddress} as consumer`);
    console.log(`2. Set subscription ID: Update subscription in contract`);
    console.log(`3. Register agents: npx hardhat run scripts/registerAgent.js --network ${network}`);
    console.log(`4. Test integration: Create a test script for the upgradeable contract`);
    console.log(`5. Monitor: https://functions.chain.link/`);

    if (network === "avalancheFuji") {
        console.log(`\n🔗 View on Snowtrace: https://testnet.snowtrace.io/address/${contractAddress}`);
    } else if (network === "sepolia") {
        console.log(`\n🔗 View on Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    }); 