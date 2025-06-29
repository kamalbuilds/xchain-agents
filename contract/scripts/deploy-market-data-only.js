const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Market Data Script Only (Testing Individual Deployment)...\n");

    const network = hre.network.name;
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";

    console.log(`Network: ${network}`);
    console.log(`Contract Address: ${contractAddress}\n`);

    // Read only the market data script
    const marketDataScript = fs.readFileSync(
        path.join(__dirname, "functions", "marketDataFetcher.js"),
        "utf8"
    );

    console.log("📊 Market Data Script Analysis:");
    console.log(`Size: ${marketDataScript.length} characters (~${(marketDataScript.length/1024).toFixed(2)}KB)`);
    
    // Check against Chainlink Functions individual script limit
    const CHAINLINK_MAX_SIZE = 30 * 1024; // 30KB per script
    console.log(`✅ Chainlink Functions Limit Check: ${marketDataScript.length} / ${CHAINLINK_MAX_SIZE} bytes (${((marketDataScript.length/CHAINLINK_MAX_SIZE)*100).toFixed(1)}%)`);
    
    if (marketDataScript.length > CHAINLINK_MAX_SIZE) {
        console.error("❌ Market Data Script exceeds 30KB limit!");
        process.exit(1);
    }

    console.log("✅ Market Data Script is within limits!\n");

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`💰 Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

    try {
        // Estimate gas for market data script only
        console.log("⛽ Gas Estimation:");
        const gasEstimate = await contract.setMarketDataScript.estimateGas(marketDataScript);
        console.log(`Market Data Script: ${gasEstimate.toString()} gas`);
        
        // Estimate cost
        const gasPrice = await hre.ethers.provider.getFeeData();
        const estimatedCost = gasEstimate * (gasPrice.gasPrice || 2n);
        console.log(`Estimated Cost: ${hre.ethers.formatEther(estimatedCost)} ETH`);

        // Upload Market Data Script
        console.log("\n📤 Uploading Market Data Script...");
        console.log(`Preview: "${marketDataScript.substring(0, 100)}..."`);
        
        const tx = await contract.setMarketDataScript(marketDataScript, {
            gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        });
        console.log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Market Data Script uploaded! Block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        
        // Verify upload
        console.log("\n🔍 Verifying upload...");
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script stored: ${scripts[0].length} characters`);
        console.log(`✅ Script matches: ${scripts[0] === marketDataScript}`);
        
        console.log("\n🎉 Market Data Script Deployed Successfully!");
        console.log("\n📊 Deployment Summary:");
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Network: ${network}`);
        console.log(`Script Size: ${scripts[0].length} characters (~${(scripts[0].length/1024).toFixed(2)}KB)`);
        console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`Cost: ${hre.ethers.formatEther(receipt.gasUsed * (gasPrice.gasPrice || 2n))} ETH`);

        console.log("\n✅ Next Steps:");
        console.log("1. Market Data Script is deployed and ready");
        console.log("2. Now we need to optimize the AI Prediction Script to under 30KB");
        console.log("3. Then deploy the optimized AI Prediction Script separately");

    } catch (error) {
        console.error("❌ Failed to deploy Market Data Script:", error.message);
        
        if (error.receipt) {
            console.log(`Gas used: ${error.receipt.gasUsed}`);
            console.log(`Status: ${error.receipt.status}`);
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Market Data deployment failed:", error);
        process.exit(1);
    }); 