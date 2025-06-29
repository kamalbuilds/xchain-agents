const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying Optimized AI Prediction Script Only...\n");

    const network = hre.network.name;
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";

    console.log(`Network: ${network}`);
    console.log(`Contract Address: ${contractAddress}\n`);

    // Read the optimized AI prediction script
    const aiPredictionScript = fs.readFileSync(
        path.join(__dirname, "functions", "aiPredictionScript-optimized.js"),
        "utf8"
    );

    console.log("📊 Optimized AI Prediction Script Analysis:");
    console.log(`Size: ${aiPredictionScript.length} characters (~${(aiPredictionScript.length/1024).toFixed(2)}KB)`);
    
    // Check against Chainlink Functions individual script limit
    const CHAINLINK_MAX_SIZE = 30 * 1024; // 30KB per script
    console.log(`✅ Chainlink Functions Limit Check: ${aiPredictionScript.length} / ${CHAINLINK_MAX_SIZE} bytes (${((aiPredictionScript.length/CHAINLINK_MAX_SIZE)*100).toFixed(1)}%)`);
    
    if (aiPredictionScript.length > CHAINLINK_MAX_SIZE) {
        console.error("❌ Optimized AI Prediction Script still exceeds 30KB limit!");
        console.log("💡 Need further optimization or consider using IPFS for storage");
        process.exit(1);
    }

    console.log("✅ Optimized AI Prediction Script is within limits!\n");

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`💰 Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

    try {
        // Estimate gas for AI prediction script only
        console.log("⛽ Gas Estimation:");
        const gasEstimate = await contract.setPredictionScript.estimateGas(aiPredictionScript);
        console.log(`AI Prediction Script: ${gasEstimate.toString()} gas`);
        
        // Estimate cost
        const gasPrice = await hre.ethers.provider.getFeeData();
        const estimatedCost = gasEstimate * (gasPrice.gasPrice || 2n);
        console.log(`Estimated Cost: ${hre.ethers.formatEther(estimatedCost)} ETH`);

        // Upload AI Prediction Script
        console.log("\n📤 Uploading Optimized AI Prediction Script...");
        console.log(`Preview: "${aiPredictionScript.substring(0, 100)}..."`);
        
        const tx = await contract.setPredictionScript(aiPredictionScript, {
            gasLimit: gasEstimate * 120n / 100n // Add 20% buffer
        });
        console.log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ AI Prediction Script uploaded! Block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);
        
        // Verify upload
        console.log("\n🔍 Verifying upload...");
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script: ${scripts[0].length} characters`);
        console.log(`✅ AI Prediction Script stored: ${scripts[1].length} characters`);
        console.log(`✅ AI script matches: ${scripts[1] === aiPredictionScript}`);
        
        console.log("\n🎉 Optimized AI Prediction Script Deployed Successfully!");
        console.log("\n📊 Deployment Summary:");
        console.log(`Contract Address: ${contractAddress}`);
        console.log(`Network: ${network}`);
        console.log(`Market Data Script Size: ${scripts[0].length} characters (~${(scripts[0].length/1024).toFixed(2)}KB)`);
        console.log(`AI Prediction Script Size: ${scripts[1].length} characters (~${(scripts[1].length/1024).toFixed(2)}KB)`);
        console.log(`Total Combined Size: ${scripts[0].length + scripts[1].length} characters (~${((scripts[0].length + scripts[1].length)/1024).toFixed(2)}KB)`);
        console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`Cost: ${hre.ethers.formatEther(receipt.gasUsed * (gasPrice.gasPrice || 2n))} ETH`);

        console.log("\n✅ Both Scripts Now Deployed:");
        console.log("1. ✅ Market Data Script (working)");
        console.log("2. ✅ AI Prediction Script (optimized)");
        console.log("3. 🚀 Ready for production testing!");

        console.log("\n🧪 Test Commands:");
        console.log("npm run test:functions:production:fuji");
        console.log("npm run test:functions:don:fuji");

    } catch (error) {
        console.error("❌ Failed to deploy AI Prediction Script:", error.message);
        
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
        console.error("❌ AI Prediction deployment failed:", error);
        process.exit(1);
    }); 