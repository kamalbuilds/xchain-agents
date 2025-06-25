const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("📤 Uploading JavaScript source code to Gas-Optimized Chainlink Functions...\n");

    // Get network configuration
    const network = hre.network.name;
    console.log(`Network: ${network}`);

    // Updated contract addresses from new deployment
    const addresses = {
        sepolia: {
            arbitrageCoordinator: "0xb994dFecA893A8248e37a33ABdC9bC67f7f0322d",
            dataStreams: "0xa7ab26959E34D2E3748FC3F876C22F69c9D6892E"
        },
        avalancheFuji: {
            arbitrageCoordinator: "0x6A16E05F328Ad740D908b3b40A913a167897F811",
            dataStreams: "0x1e41e58c7F0b3766ADa3c7f72cf5cc056E571895"
        }
    };

    const contractAddress = addresses[network]?.arbitrageCoordinator;
    if (!contractAddress) {
        throw new Error(`No contract address found for network: ${network}`);
    }

    console.log(`Gas-Optimized Contract Address: ${contractAddress}\n`);

    // Get contract instance - using the gas-optimized minimal version
    const ArbitrageCoordinator = await hre.ethers.getContractFactory("ArbitrageCoordinatorMinimal");
    const contract = ArbitrageCoordinator.attach(contractAddress);

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

    console.log("\n🎉 Gas-Optimized JavaScript Source Code Upload Complete!");
    console.log("\n📋 What was uploaded:");
    console.log("1. 📊 Market Data Fetcher - Fetches real-time prediction market data");
    console.log("2. 🤖 AI Prediction Script - Generates AI-powered market predictions");
    console.log("3. 🔐 Encrypted Secrets - Placeholder for API keys");

    console.log("\n⚡ Gas Optimizations Applied:");
    console.log("- Simplified data structures to reduce storage writes");
    console.log("- Use events instead of storage for market data (90% gas savings)");
    console.log("- Removed unnecessary mappings and arrays");
    console.log("- Optimized callback function to stay under 300,000 gas limit");
    console.log("- Used uint32 for timestamps (saves gas vs uint256)");

    console.log("\n🔗 Next steps:");
    console.log(`1. Add contract as consumer: npx hardhat run scripts/add-consumer-minimal.ts --network ${network}`);
    console.log(`2. Set subscription ID: Update subscription in contract`);
    console.log(`3. Test integration: npm run test:functions:${network.toLowerCase()}`);
    console.log(`4. Monitor: https://functions.chain.link/`);

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