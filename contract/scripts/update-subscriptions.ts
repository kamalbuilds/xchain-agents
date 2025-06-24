import { ethers } from "hardhat";
import * as fs from "fs";

async function main() {
  console.log("🔄 Updating Chainlink subscription IDs...");

  // Contract addresses (update these with your deployed contract addresses)
  const ARBITRAGE_COORDINATOR_ADDRESS = "0xb61289C2450ad164e23247615116C14C56598aB5";
  
  // New subscription IDs (update these with your actual subscription IDs)
  const FUNCTIONS_SUBSCRIPTION_ID = process.env.FUNCTIONS_SUBSCRIPTION_ID || "1";
  const VRF_SUBSCRIPTION_ID = process.env.VRF_SUBSCRIPTION_ID || "1";

  // Get signer
  const [signer] = await ethers.getSigners();

  // Create contract interface
  const arbitrageCoordinatorAbi = [
    "function getSubscriptionIds() external view returns (uint64 functionsSubId, uint64 vrfSubId)",
    "function updateFunctionsSubscriptionId(uint64 _subscriptionId) external",
    "function updateVRFSubscriptionId(uint64 _vrfSubscriptionId) external"
  ];

  const arbitrageCoordinator = new ethers.Contract(
    ARBITRAGE_COORDINATOR_ADDRESS,
    arbitrageCoordinatorAbi,
    signer
  );

  console.log("📋 Current subscription IDs:");
  try {
    const currentIds = await arbitrageCoordinator.getSubscriptionIds();
    console.log(`   Functions Subscription ID: ${currentIds[0]}`);
    console.log(`   VRF Subscription ID: ${currentIds[1]}`);
  } catch (error) {
    console.log("   Could not retrieve current subscription IDs");
  }

  // Update Functions subscription ID
  if (FUNCTIONS_SUBSCRIPTION_ID !== "1") {
    console.log(`\n🔧 Updating Functions subscription ID to: ${FUNCTIONS_SUBSCRIPTION_ID}`);
    try {
      const tx1 = await arbitrageCoordinator.updateFunctionsSubscriptionId(FUNCTIONS_SUBSCRIPTION_ID);
      await tx1.wait();
      console.log("✅ Functions subscription ID updated successfully");
      console.log(`   Transaction hash: ${tx1.hash}`);
    } catch (error) {
      console.error("❌ Failed to update Functions subscription ID:", error);
    }
  } else {
    console.log("⚠️  Functions subscription ID not provided (using placeholder)");
  }

  // Update VRF subscription ID
  if (VRF_SUBSCRIPTION_ID !== "1") {
    console.log(`\n🎲 Updating VRF subscription ID to: ${VRF_SUBSCRIPTION_ID}`);
    try {
      const tx2 = await arbitrageCoordinator.updateVRFSubscriptionId(VRF_SUBSCRIPTION_ID);
      await tx2.wait();
      console.log("✅ VRF subscription ID updated successfully");
      console.log(`   Transaction hash: ${tx2.hash}`);
    } catch (error) {
      console.error("❌ Failed to update VRF subscription ID:", error);
    }
  } else {
    console.log("⚠️  VRF subscription ID not provided (using placeholder)");
  }

  // Verify updates
  console.log("\n📋 Updated subscription IDs:");
  try {
    const updatedIds = await arbitrageCoordinator.getSubscriptionIds();
    console.log(`   Functions Subscription ID: ${updatedIds[0]}`);
    console.log(`   VRF Subscription ID: ${updatedIds[1]}`);
  } catch (error) {
    console.log("   Could not retrieve updated subscription IDs");
  }

  // Save configuration for reference
  const config = {
    arbitrageCoordinatorAddress: ARBITRAGE_COORDINATOR_ADDRESS,
    functionsSubscriptionId: FUNCTIONS_SUBSCRIPTION_ID,
    vrfSubscriptionId: VRF_SUBSCRIPTION_ID,
    lastUpdated: new Date().toISOString(),
    network: (await ethers.provider.getNetwork()).name
  };

  fs.writeFileSync(
    "subscription-config.json",
    JSON.stringify(config, null, 2)
  );

  console.log("\n💾 Configuration saved to subscription-config.json");
  
  console.log("\n📚 Next Steps:");
  console.log("1. Create Chainlink Functions subscription at https://functions.chain.link");
  console.log("2. Create Chainlink VRF subscription at https://vrf.chain.link");
  console.log("3. Fund both subscriptions with LINK tokens");
  console.log("4. Add your contract addresses as consumers to both subscriptions");
  console.log("5. Run this script again with the actual subscription IDs");
  console.log("\n🔗 Useful Links:");
  console.log("   Functions Documentation: https://docs.chain.link/chainlink-functions");
  console.log("   VRF Documentation: https://docs.chain.link/vrf");
  console.log("   LINK Faucet: https://faucets.chain.link");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 