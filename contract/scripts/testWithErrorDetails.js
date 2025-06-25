const hre = require("hardhat");

async function main() {
    console.log("🔍 Testing Functions with Detailed Error Analysis...\n");

    const contractAddress = "0x6A16E05F328Ad740D908b3b40A913a167897F811";
    console.log(`Contract Address: ${contractAddress}`);

    // Get contract instance
    const ArbitrageCoordinator = await hre.ethers.getContractFactory("ArbitrageCoordinatorMinimal");
    const contract = ArbitrageCoordinator.attach(contractAddress);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}\n`);

    // Test with detailed error handling
    console.log("🧪 Testing Market Data Request with Error Details...");
    try {
        const testMarketId = "0x9deb0baac40648821f96f01339229a422e2f5c877de55dc4dbf981f95a1e709c";
        const testChainId = 137;

        // First, simulate the transaction to get the revert reason
        try {
            await contract.requestMarketData.staticCall(testMarketId, testChainId);
            console.log("✅ Static call succeeded - transaction should work");
        } catch (staticError) {
            console.log(`❌ Static call failed: ${staticError.message}`);
            
            // Try to extract more specific error information
            if (staticError.reason) {
                console.log(`📋 Revert reason: ${staticError.reason}`);
            }
            if (staticError.code) {
                console.log(`📋 Error code: ${staticError.code}`);
            }
            if (staticError.data) {
                console.log(`📋 Error data: ${staticError.data}`);
            }
        }

        // If static call works, try the actual transaction
        console.log("\n📤 Attempting actual transaction...");
        const tx = await contract.requestMarketData(testMarketId, testChainId);
        console.log(`✅ Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Transaction confirmed! Block: ${receipt.blockNumber}`);

    } catch (error) {
        console.log(`❌ Transaction failed: ${error.message}`);
        
        // Additional debugging
        if (error.reason) {
            console.log(`📋 Detailed reason: ${error.reason}`);
        }
        
        // Check specific error patterns
        if (error.message.includes("insufficient funds")) {
            console.log("💡 Issue: Insufficient gas or LINK tokens");
        } else if (error.message.includes("revert")) {
            console.log("💡 Issue: Smart contract revert - checking contract state...");
            await checkContractState(contract);
        }
    }

    console.log("\n🎯 Detailed Error Analysis Complete!");
}

async function checkContractState(contract) {
    console.log("\n🔍 Contract State Check:");
    
    try {
        const subscriptionId = await contract.getSubscriptionId();
        console.log(`✅ Subscription ID: ${subscriptionId}`);
    } catch (error) {
        console.log(`❌ Could not get subscription ID: ${error.message}`);
    }

    try {
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script: ${scripts[0].length} characters`);
        console.log(`✅ AI Prediction Script: ${scripts[1].length} characters`);
        
        if (scripts[0].length === 0) {
            console.log("❌ Market data script is empty!");
        }
    } catch (error) {
        console.log(`❌ Could not get scripts: ${error.message}`);
    }

    try {
        // Check if we can call view functions
        const activeMarkets = await contract.getActiveMarkets();
        console.log(`✅ Active markets: ${activeMarkets.length}`);
    } catch (error) {
        console.log(`❌ Could not get active markets: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    });