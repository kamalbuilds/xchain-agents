import { ethers } from "hardhat";
import { config } from "dotenv";

// Load environment variables
config();

async function main() {
    console.log("🔗 Adding contract as consumer to Functions subscription...");
    
    // Get the signer
    const [signer] = await ethers.getSigners();
    console.log(`Using account: ${signer.address}`);
    
    // Contract addresses
    const addresses = {
        avalancheFuji: "0x6A16E05F328Ad740D908b3b40A913a167897F811"
    };
    
    const contractAddress = addresses.avalancheFuji;
    const subscriptionId = 15643; // Your existing subscription ID
    
    // Network configuration for Avalanche Fuji
    const functionsRouterAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    
    console.log(`Network: Avalanche Fuji`);
    console.log(`Contract Address: ${contractAddress}`);
    console.log(`Subscription ID: ${subscriptionId}`);
    console.log(`Functions Router: ${functionsRouterAddress}`);
    
    try {
        // Simple ABI for just adding consumer - avoid complex getSubscription call
        const functionsRouterAbi = [
            "function addConsumer(uint64 subscriptionId, address consumer) external"
        ];
        
        const functionsRouter = new ethers.Contract(functionsRouterAddress, functionsRouterAbi, signer);
        
        // Add contract as consumer directly
        console.log("\n📤 Adding contract as consumer...");
        const tx = await functionsRouter.addConsumer(subscriptionId, contractAddress);
        console.log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Consumer added! Transaction: ${receipt.hash}`);
        
        console.log("\n🎉 Success! Contract should now be an authorized consumer.");
        console.log("\n🔗 Next steps:");
        console.log("1. Run: npm run test:functions:fuji");
        console.log("2. Check Functions UI: https://functions.chain.link/fuji");
        console.log(`3. Monitor on Snowtrace: https://testnet.snowtrace.io/tx/${receipt.hash}`);
        
    } catch (error: any) {
        console.error("\n❌ Error adding consumer:", error);
        
        if (error?.message?.includes("already exists")) {
            console.log("\n✅ Contract is already a consumer of this subscription!");
        } else if (error?.message?.includes("revert")) {
            console.log("\n💡 Possible issues:");
            console.log("- Contract is already a consumer");
            console.log("- Not the subscription owner");
            console.log("- Subscription doesn't exist");
            console.log("- Network/RPC issues");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 