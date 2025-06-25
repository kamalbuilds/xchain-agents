const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("📤 Uploading Minimal Chainlink Functions JavaScript to Upgradeable Contract...\n");

    const network = hre.network.name;
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2"; // Our deployed proxy

    console.log(`Network: ${network}`);
    console.log(`Contract Address: ${contractAddress}\n`);

    // Read the minimal JavaScript files
    const marketDataScript = fs.readFileSync(
        path.join(__dirname, "functions", "marketDataFetcher-minimal.js"),
        "utf8"
    );
    
    const aiPredictionScript = fs.readFileSync(
        path.join(__dirname, "functions", "aiPredictionScript-minimal.js"),
        "utf8"
    );

    console.log(`Market Data Script Size: ${marketDataScript.length} characters`);
    console.log(`AI Prediction Script Size: ${aiPredictionScript.length} characters`);
    console.log(`Total Size: ${marketDataScript.length + aiPredictionScript.length} characters\n`);

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

    try {
        // Upload Market Data Script
        console.log("📤 Uploading Market Data Script...");
        console.log(`Script preview: "${marketDataScript.substring(0, 100)}..."`);
        
        const gasEstimate1 = await contract.setMarketDataScript.estimateGas(marketDataScript);
        console.log(`Gas estimate: ${gasEstimate1.toString()}`);
        
        const tx1 = await contract.setMarketDataScript(marketDataScript, {
            gasLimit: gasEstimate1 * 120n / 100n // Add 20% buffer
        });
        console.log(`Transaction sent: ${tx1.hash}`);
        
        const receipt1 = await tx1.wait();
        console.log(`✅ Market Data Script uploaded! Block: ${receipt1.blockNumber}`);
        
        // Upload AI Prediction Script
        console.log("\n📤 Uploading AI Prediction Script...");
        console.log(`Script preview: "${aiPredictionScript.substring(0, 100)}..."`);
        
        const gasEstimate2 = await contract.setPredictionScript.estimateGas(aiPredictionScript);
        console.log(`Gas estimate: ${gasEstimate2.toString()}`);
        
        const tx2 = await contract.setPredictionScript(aiPredictionScript, {
            gasLimit: gasEstimate2 * 120n / 100n // Add 20% buffer
        });
        console.log(`Transaction sent: ${tx2.hash}`);
        
        const receipt2 = await tx2.wait();
        console.log(`✅ AI Prediction Script uploaded! Block: ${receipt2.blockNumber}`);
        
        // Verify uploads
        console.log("\n🔍 Verifying uploads...");
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script length: ${scripts[0].length}`);
        console.log(`✅ AI Prediction Script length: ${scripts[1].length}`);
        console.log(`✅ Market Data matches: ${scripts[0] === marketDataScript}`);
        console.log(`✅ AI Prediction matches: ${scripts[1] === aiPredictionScript}`);
        
        console.log("\n🎉 All Functions JavaScript uploaded successfully!");
        
        // Show summary
        console.log("\n📊 Summary:");
        console.log(`Contract: ${contractAddress}`);
        console.log(`Network: ${network}`);
        console.log(`Market Data Script: ${scripts[0].length} characters`);
        console.log(`AI Prediction Script: ${scripts[1].length} characters`);
        console.log(`Total Gas Used: ${(receipt1.gasUsed + receipt2.gasUsed).toString()}`);

    } catch (error) {
        console.error("❌ Failed to upload Functions JavaScript:", error.message);
        
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
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 