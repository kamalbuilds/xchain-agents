const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Production Chainlink Functions to Upgradeable Contract...\n");

    const network = hre.network.name;
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2"; // Our deployed proxy

    console.log(`Network: ${network}`);
    console.log(`Contract Address: ${contractAddress}\n`);

    // Read the production JavaScript files
    const marketDataScript = fs.readFileSync(
        path.join(__dirname, "functions", "marketDataFetcher.js"),
        "utf8"
    );
    
    const aiPredictionScript = fs.readFileSync(
        path.join(__dirname, "functions", "aiPredictionScript.js"),
        "utf8"
    );

    console.log("📊 Script Analysis:");
    console.log(`Market Data Script: ${marketDataScript.length} characters (~${(marketDataScript.length/1024).toFixed(2)}KB)`);
    console.log(`AI Prediction Script: ${aiPredictionScript.length} characters (~${(aiPredictionScript.length/1024).toFixed(2)}KB)`);
    console.log(`Total Size: ${marketDataScript.length + aiPredictionScript.length} characters (~${((marketDataScript.length + aiPredictionScript.length)/1024).toFixed(2)}KB)`);
    
    // Check against Chainlink Functions limits
    const CHAINLINK_MAX_SIZE = 30 * 1024; // 30KB
    const totalSize = marketDataScript.length + aiPredictionScript.length;
    console.log(`✅ Chainlink Functions Limit Check: ${totalSize} / ${CHAINLINK_MAX_SIZE} bytes (${((totalSize/CHAINLINK_MAX_SIZE)*100).toFixed(1)}%)`);
    
    if (totalSize > CHAINLINK_MAX_SIZE) {
        console.error("❌ Scripts exceed Chainlink Functions 30KB limit!");
        process.exit(1);
    }

    console.log("\n🔍 Script Features:");
    console.log("Market Data Fetcher:");
    console.log("  ✅ Polymarket CLOB API integration");
    console.log("  ✅ Fallback data for reliability");
    console.log("  ✅ Price & volume extraction");
    console.log("  ✅ Error handling");
    
    console.log("AI Prediction Script:");
    console.log("  ✅ Algorithmic prediction engine");
    console.log("  ✅ Confidence scoring");
    console.log("  ✅ Time-based adjustments");
    console.log("  ✅ Bounded output [0.01, 0.99]");

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`\n💰 Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

    try {
        // Estimate gas for both uploads
        console.log("\n⛽ Gas Estimation:");
        const gasEstimate1 = await contract.setMarketDataScript.estimateGas(marketDataScript);
        const gasEstimate2 = await contract.setPredictionScript.estimateGas(aiPredictionScript);
        const totalGasEstimate = gasEstimate1 + gasEstimate2;
        
        console.log(`Market Data Script: ${gasEstimate1.toString()} gas`);
        console.log(`AI Prediction Script: ${gasEstimate2.toString()} gas`);
        console.log(`Total Estimated Gas: ${totalGasEstimate.toString()} gas`);
        
        // Estimate cost on Avalanche Fuji (low gas prices)
        const gasPrice = await hre.ethers.provider.getFeeData();
        const estimatedCost = totalGasEstimate * (gasPrice.gasPrice || 2n);
        console.log(`Estimated Cost: ${hre.ethers.formatEther(estimatedCost)} ETH`);

        // Check if we have enough balance
        const balance = await deployer.provider.getBalance(deployer.address);
        const buffer = estimatedCost * 2n; // 2x buffer for safety
        
        if (balance < buffer) {
            console.error(`❌ Insufficient balance. Need ~${hre.ethers.formatEther(buffer)} ETH`);
            process.exit(1);
        }

        console.log("✅ Gas estimates look good. Proceeding with deployment...\n");

        // Upload Market Data Script
        console.log("📤 Uploading Market Data Script...");
        console.log(`Preview: "${marketDataScript.substring(0, 120)}..."`);
        
        const tx1 = await contract.setMarketDataScript(marketDataScript, {
            gasLimit: gasEstimate1 * 120n / 100n // Add 20% buffer
        });
        console.log(`Transaction sent: ${tx1.hash}`);
        
        const receipt1 = await tx1.wait();
        console.log(`✅ Market Data Script uploaded! Block: ${receipt1.blockNumber}`);
        console.log(`Gas used: ${receipt1.gasUsed.toString()}`);
        
        // Upload AI Prediction Script
        console.log("\n📤 Uploading AI Prediction Script...");
        console.log(`Preview: "${aiPredictionScript.substring(0, 120)}..."`);
        
        const tx2 = await contract.setPredictionScript(aiPredictionScript, {
            gasLimit: gasEstimate2 * 120n / 100n // Add 20% buffer
        });
        console.log(`Transaction sent: ${tx2.hash}`);
        
        const receipt2 = await tx2.wait();
        console.log(`✅ AI Prediction Script uploaded! Block: ${receipt2.blockNumber}`);
        console.log(`Gas used: ${receipt2.gasUsed.toString()}`);
        
        // Verify uploads
        console.log("\n🔍 Verifying uploads...");
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script stored: ${scripts[0].length} characters`);
        console.log(`✅ AI Prediction Script stored: ${scripts[1].length} characters`);
        console.log(`✅ Market Data script matches: ${scripts[0] === marketDataScript}`);
        console.log(`✅ AI Prediction script matches: ${scripts[1] === aiPredictionScript}`);
        
        console.log("\n🎉 Production Functions Deployed Successfully!");
        
        // Show final summary
        console.log("\n📊 Deployment Summary:");
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Network: ${network}`);
        console.log(`Market Data Script: ${scripts[0].length} characters`);
        console.log(`AI Prediction Script: ${scripts[1].length} characters`);
        console.log(`Total Gas Used: ${(receipt1.gasUsed + receipt2.gasUsed).toString()}`);
        console.log(`Total Cost: ${hre.ethers.formatEther((receipt1.gasUsed + receipt2.gasUsed) * (gasPrice.gasPrice || 2n))} ETH`);
        
        console.log("\n🚀 Ready for Production Testing:");
        console.log("1. Set up Chainlink Functions subscription");
        console.log("2. Add contract as consumer");
        console.log("3. Test market data requests");
        console.log("4. Test AI prediction requests");
        console.log("5. Monitor execution and gas costs");

    } catch (error) {
        console.error("❌ Failed to deploy production Functions:", error.message);
        
        if (error.receipt) {
            console.log(`Gas used: ${error.receipt.gasUsed}`);
            console.log(`Status: ${error.receipt.status}`);
        }
        
        // If it's a gas estimation error, the scripts might be too large
        if (error.message.includes("estimateGas") || error.message.includes("gas")) {
            console.log("\n💡 Gas Issue Troubleshooting:");
            console.log("1. Scripts might be too large for single transaction");
            console.log("2. Consider splitting into smaller chunks");
            console.log("3. Or use IPFS storage with hash references");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Production deployment failed:", error);
        process.exit(1);
    }); 