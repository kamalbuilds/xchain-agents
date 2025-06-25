import { ethers } from "hardhat";
import hre from "hardhat";

interface NetworkConfig {
  functionsOracle: string;
  donId: string;
}

const networkConfigs: Record<string, NetworkConfig> = {
  sepolia: {
    functionsOracle: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
  },
  avalancheFuji: {
    functionsOracle: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
    donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",
  },
};

async function main() {
  console.log("🚀 Deploying ArbitrageCoordinatorMinimal to network:", hre.network.name, `(chainId: ${hre.network.config.chainId})`);

  const networkName = hre.network.name;
  const config = networkConfigs[networkName];

  if (!config) {
    throw new Error(`Network configuration not found for: ${networkName}`);
  }

  console.log("📋 Using network configuration for", networkName + ":");
  console.log("   Functions Oracle:", config.functionsOracle);
  console.log("   DON ID:", config.donId);

  // Deploy ArbitrageCoordinatorMinimal
  console.log("\n📦 Deploying ArbitrageCoordinatorMinimal...");
  const ArbitrageCoordinatorFactory = await ethers.getContractFactory("ArbitrageCoordinatorMinimal");

  console.log("📦 Deploying with constructor arguments:");
  console.log("   Functions Oracle:", config.functionsOracle);
  console.log("   DON ID:", config.donId);
  console.log("   Functions Subscription ID: 1 (placeholder - update after deployment)");

  const arbitrageCoordinator = await ArbitrageCoordinatorFactory.deploy(
    config.functionsOracle,
    config.donId
  );

  await arbitrageCoordinator.waitForDeployment();
  const arbitrageCoordinatorAddress = await arbitrageCoordinator.getAddress();

  console.log("\n🎉 Deployment successful!");
  console.log("📍 Contract address:");
  console.log("   ArbitrageCoordinatorMinimal:", arbitrageCoordinatorAddress);

  console.log("\n📝 Verify contract with:");
  console.log(`npx hardhat verify --network ${networkName} ${arbitrageCoordinatorAddress} \\`);
  console.log(`  "${config.functionsOracle}" \\`);
  console.log(`  "${config.donId}"`);

  console.log("\n📋 Next steps:");
  console.log("1. ⚡ Set up Functions subscription and add contract as consumer");
  console.log("2. 📤 Upload JavaScript source code via deployFunctions.js");
  console.log("3. 👥 Register authorized agents");
  console.log("4. 🧪 Test the integration with testFunctions.js");

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: hre.network.config.chainId,
    arbitrageCoordinatorMinimal: arbitrageCoordinatorAddress,
    timestamp: new Date().toISOString(),
    config: config
  };

  console.log("\n💾 Deployment complete:", JSON.stringify(deploymentInfo, null, 2));
  
  return arbitrageCoordinatorAddress;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

export default main; 