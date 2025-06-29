const hre = require("hardhat");

async function main() {
    console.log("🔄 Updating Contract with Real Chainlink Functions Subscription ID...\n");

    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    const realSubscriptionId = 15643; // Your subscription ID from the dashboard

    console.log(`Contract Address: ${contractAddress}`);
    console.log(`New Subscription ID: ${realSubscriptionId}\n`);

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [signer] = await hre.ethers.getSigners();
    console.log(`Signer: ${signer.address}`);

    try {
        // Check current subscription IDs
        console.log("📋 Checking current subscription IDs...");
        const currentIds = await contract.getSubscriptionIds();
        console.log(`Current Functions Subscription: ${currentIds[0]}`);
        console.log(`Current VRF Subscription: ${currentIds[1]}`);

        if (currentIds[0] === BigInt(realSubscriptionId)) {
            console.log("✅ Subscription ID is already correct!");
            return;
        }

        // Update Functions subscription ID
        console.log(`\n🔄 Updating Functions subscription from ${currentIds[0]} to ${realSubscriptionId}...`);
        
        const updateTx = await contract.updateFunctionsSubscriptionId(realSubscriptionId);
        console.log(`Transaction sent: ${updateTx.hash}`);
        
        const receipt = await updateTx.wait();
        console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);

        // Verify the update
        console.log("\n🔍 Verifying update...");
        const updatedIds = await contract.getSubscriptionIds();
        console.log(`New Functions Subscription: ${updatedIds[0]}`);
        console.log(`VRF Subscription (unchanged): ${updatedIds[1]}`);

        if (updatedIds[0] === BigInt(realSubscriptionId)) {
            console.log("\n🎉 Subscription ID successfully updated!");
            console.log("\n📋 Your contract is now ready for real Chainlink Functions execution!");
            console.log("🧪 Test with: npm run test:functions:production:fuji");
        } else {
            console.log("❌ Update failed - subscription ID doesn't match");
        }

    } catch (error) {
        console.error("❌ Failed to update subscription ID:", error.message);
        
        if (error.message.includes("Ownable")) {
            console.log("💡 Make sure you're using the correct account that deployed the contract");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Update failed:", error);
        process.exit(1);
    }); 