const hre = require("hardhat");

async function main() {
    console.log("🚀 Deploying Real Functions Consumer Contract...\n");

    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    
    const balance = await deployer.provider.getBalance(deployer.address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

    console.log("📋 Deploying FunctionsConsumerExample...");
    
    try {
        // Deploy the contract
        const FunctionsConsumerExample = await hre.ethers.getContractFactory("FunctionsConsumerExample");
        const functionsConsumer = await FunctionsConsumerExample.deploy();
        
        await functionsConsumer.waitForDeployment();
        const contractAddress = await functionsConsumer.getAddress();
        
        console.log(`✅ Contract deployed to: ${contractAddress}`);
        
        // Verify contract on explorer (if supported)
        if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
            console.log("\n⏳ Waiting for block confirmations...");
            await functionsConsumer.deploymentTransaction().wait(5);
            
            try {
                console.log("🔍 Verifying contract on explorer...");
                await hre.run("verify:verify", {
                    address: contractAddress,
                    constructorArguments: [],
                });
                console.log("✅ Contract verified on explorer");
            } catch (error) {
                console.log("⚠️ Verification failed (contract may already be verified)");
            }
        }

        // Save deployment info
        const deploymentInfo = {
            network: hre.network.name,
            chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
            contractAddress: contractAddress,
            deployer: deployer.address,
            deploymentTx: functionsConsumer.deploymentTransaction().hash,
            timestamp: new Date().toISOString(),
            routerAddress: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
            gasUsed: (await functionsConsumer.deploymentTransaction().wait()).gasUsed.toString()
        };

        const fs = require("fs");
        const path = require("path");
        const deploymentsDir = path.join(__dirname, "..", "deployments");
        
        if (!fs.existsSync(deploymentsDir)) {
            fs.mkdirSync(deploymentsDir);
        }
        
        const filename = `real-functions-consumer-${hre.network.name}.json`;
        const filepath = path.join(deploymentsDir, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
        console.log(`📄 Deployment info saved to: ${filename}`);

        console.log(`\n🎉 Real Functions Consumer Deployed Successfully!`);
        console.log(`\n📋 Contract Details:`);
        console.log(`Address: ${contractAddress}`);
        console.log(`Network: ${hre.network.name}`);
        console.log(`Router: 0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0`);
        console.log(`Owner: ${deployer.address}`);
        
        console.log(`\n🔄 Next Steps:`);
        console.log(`1. Add this contract as a consumer to subscription 15643:`);
        console.log(`   https://functions.chain.link/avalanche-fuji/15643`);
        console.log(`2. Consumer Address: ${contractAddress}`);
        console.log(`3. Test with: npm run test:real:functions:fuji`);
        
        console.log(`\n💡 This contract will make REAL DON requests that will:`);
        console.log(`✅ Execute JavaScript on multiple DON nodes`);
        console.log(`✅ Make real API calls to Polymarket`);
        console.log(`✅ Return aggregated market data`);
        console.log(`✅ Increase your fulfillment count`);
        console.log(`✅ Consume LINK from your subscription`);

    } catch (error) {
        console.error("❌ Deployment failed:", error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 