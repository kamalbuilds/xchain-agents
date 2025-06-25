const hre = require("hardhat");

async function main() {
    console.log("👥 Registering authorized agent...\n");

    const contractAddress = "0x6A16E05F328Ad740D908b3b40A913a167897F811";
    console.log(`Contract Address: ${contractAddress}`);

    // Get contract instance
    const ArbitrageCoordinator = await hre.ethers.getContractFactory("ArbitrageCoordinatorMinimal");
    const contract = ArbitrageCoordinator.attach(contractAddress);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);

    try {
        // Register deployer as authorized agent
        console.log("\n📤 Registering deployer as authorized agent...");
        const tx = await contract.registerAgent(deployer.address, "test-agent");
        console.log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Agent registered! Block: ${receipt.blockNumber}`);

        // Verify registration
        const isAuthorized = await contract.authorizedAgents(deployer.address);
        console.log(`✅ Agent is authorized: ${isAuthorized.isActive}`);

    } catch (error) {
        console.error("❌ Failed to register agent:", error.message);
        
        if (error.message.includes("already registered")) {
            console.log("✅ Agent is already registered!");
        } else if (error.message.includes("Not owner")) {
            console.log("💡 Make sure you're using the contract owner account");
        }
    }

    console.log("\n🎉 Agent registration complete!");
    console.log("Now you can test Functions requests.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Error:", error);
        process.exit(1);
    }); 