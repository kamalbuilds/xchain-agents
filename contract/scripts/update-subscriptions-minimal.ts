import { ethers } from "hardhat";
import { config } from "dotenv";

// Load environment variables
config();

async function main() {
  console.log("🔄 Updating Functions subscription ID...");
  
  // Contract addresses for ArbitrageCoordinatorMinimal
  const addresses = {
    sepolia: "0xb994dFecA893A8248e37a33ABdC9bC67f7f0322d",
    avalancheFuji: "0x6A16E05F328Ad740D908b3b40A913a167897F811"
  };

  const network = process.env.HARDHAT_NETWORK || "avalancheFuji";
  const contractAddress = addresses[network as keyof typeof addresses];
  
  if (!contractAddress) {
    throw new Error(`No contract address found for network: ${network}`);
  }

  console.log(`Network: ${network}`);
  console.log(`Contract: ${contractAddress}`);

  // Get subscription ID from environment or use default
  const subscriptionId = process.env.FUNCTIONS_SUBSCRIPTION_ID || "15643";
  console.log(`Subscription ID: ${subscriptionId}`);

  // Get contract instance
  const [signer] = await ethers.getSigners();
  console.log(`Signer: ${signer.address}`);

  const ArbitrageCoordinator = await ethers.getContractFactory("ArbitrageCoordinatorMinimal");
  const contract = ArbitrageCoordinator.attach(contractAddress) as any;

  try {
    // Update subscription ID
    console.log("\n📤 Setting subscription ID...");
    const tx = await contract.setSubscriptionId(subscriptionId);
    console.log(`Transaction sent: ${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Subscription ID updated! Block: ${receipt.blockNumber}`);

    // Verify the update
    const currentSubscriptionId = await contract.getSubscriptionId();
    console.log(`✅ Current subscription ID: ${currentSubscriptionId}`);

    if (currentSubscriptionId.toString() === subscriptionId) {
      console.log("🎉 Subscription ID successfully updated!");
    } else {
      console.log("⚠️  Subscription ID mismatch!");
    }

  } catch (error: any) {
    console.error("❌ Failed to update subscription ID:", error.message);
    
    if (error.message.includes("Not owner")) {
      console.log("💡 Make sure you're using the contract owner account");
    }
    
    process.exit(1);
  }

  console.log("\n📋 Next steps:");
  console.log("1. Test Functions integration");
  console.log("2. Monitor requests on Functions UI");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 