import { ethers } from "hardhat";
import hre from "hardhat";
import fs from "fs";
import path from "path";

interface NetworkConfig {
  router: string;
  linkToken: string;
  functionsOracle: string;
  donId: string;
  vrfCoordinator: string;
  vrfKeyHash: string;
}

const networkConfigs: Record<string, NetworkConfig> = {
  sepolia: {
    router: "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59",
    linkToken: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    functionsOracle: "0xb83E47C2bC239B3bf370bc41e1459A34b41238D0",
    donId: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
    vrfCoordinator: "0x9DdfaCa8183c41ad55329BdeeD9F6A8d53168B1B",
    vrfKeyHash: "0x787d74caea10b2b357790d5b5247c2f63d1d91572a9846f780606e4d953677ae",
  },
  baseSepolia: {
    router: "0x9dcF9D205C9De35334D646BeE44b2D2859712A09",
    linkToken: "0xE4aB69C077896252FAFBD49EFD26B5D171A32410",
    functionsOracle: "0xf9B8fc078197181C841c296C876945aaa425B278",
    donId: "0x66756e2d626173652d7365706f6c69612d310000000000000000000000000000",
    vrfCoordinator: "0x5CE8D5A2BC84beb22a398CCA51996F7930313D61",
    vrfKeyHash: "0x9fe0eebf5e446e3c998ec9bb19951541aee00bb90ea201ae456421a2ded86805",
  },
  polygonAmoy: {
    router: "0x9C32fCB86BF0f4a1A8921a9Fe46de3198bb884B2",
    linkToken: "0x0Fd9e8d3aF1aaee056EB9e802c3A762a667b1904",
    functionsOracle: "0xC22a79eBA640940ABB6dF0f7982cc119578E11De",
    donId: "0x66756e2d706f6c79676f6e2d616d6f792d31000000000000000000000000000000",
    vrfCoordinator: "0x343300b5d84D444B2ADc9116FEF1bED02BE49Cf2",
    vrfKeyHash: "0x6b05c0b20eec86b1b7b8c9daf4c3d7e3b2eae20a43a5b8d93f77b5d8c85d6d63",
  },
  arbitrumSepolia: {
    router: "0x2a9C5afB0d0e4BAb2BCdaE109EC4b0c4Be15a165",
    linkToken: "0xb1D4538B4571d411F07960EF2838Ce337FE1E80E",
    functionsOracle: "0x234a5fb5Bd614a7AA2FfAB244D603abFA0Ac5C5C",
    donId: "0x66756e2d617262697472756d2d7365706f6c69612d3100000000000000000000",
    vrfCoordinator: "0x5ce8d5a2bc84beb22a398cca51996f7930313d61",
    vrfKeyHash: "0x1770bdc7eec7771f7ba4ffd640f34260d7f095b79c92d34a5b2551d6f6cfd2be",
  },
  avalancheFuji: {
    router: "0xF694E193200268f9a4868e4Aa017A0118C9a8177",
    linkToken: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",
    functionsOracle: "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0",
    donId: "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",
    vrfCoordinator: "0x5C210eF41CD1a72de73bF76eC39637bB0d3d7BEE",
    vrfKeyHash: "0xc799bd1e3bd4d1a41cd4968997a4e03dfd2a3c7c04b695881138580163f42887",
  },
};

async function main() {
  console.log("🚀 Deploying ArbitrageCoordinator to network:", hre.network.name, `(chainId: ${hre.network.config.chainId})`);
  
  const networkName = hre.network.name;
  const config = networkConfigs[networkName];
  
  if (!config) {
    throw new Error(`Network configuration not found for: ${networkName}`);
  }
  
  console.log("📋 Using network configuration for", networkName + ":");
  console.log("   CCIP Router:", config.router);
  console.log("   VRF Coordinator:", config.vrfCoordinator);
  console.log("   LINK Token:", config.linkToken);
  console.log("   Functions Oracle:", config.functionsOracle);
  
  // Deploy FunctionsManager library first
  console.log("\n📚 Deploying FunctionsManager library...");
  const FunctionsManagerFactory = await ethers.getContractFactory("FunctionsManager");
  const functionsManager = await FunctionsManagerFactory.deploy();
  await functionsManager.waitForDeployment();
  const functionsManagerAddress = await functionsManager.getAddress();
  
  console.log("✅ FunctionsManager library deployed at:", functionsManagerAddress);

  // Deploy ArbitrageCoordinator with library linking
  console.log("\n📦 Deploying ArbitrageCoordinator with linked libraries...");
  const ArbitrageCoordinatorFactory = await ethers.getContractFactory("ArbitrageCoordinator", {
    libraries: {
      FunctionsManager: functionsManagerAddress,
    },
  });
  
  console.log("📦 Deploying with constructor arguments:");
  console.log("   Router:", config.router);
  console.log("   LINK:", config.linkToken);
  console.log("   Functions Oracle:", config.functionsOracle);
  console.log("   DON ID:", config.donId);
  console.log("   Functions Subscription ID: 1 (placeholder - update after deployment)");
  console.log("   VRF Coordinator:", config.vrfCoordinator);
  console.log("   VRF Key Hash:", config.vrfKeyHash);
  console.log("   VRF Subscription ID: 1 (placeholder - update after deployment)");
  
  const arbitrageCoordinator = await ArbitrageCoordinatorFactory.deploy(
    config.router,
    config.linkToken,
    config.functionsOracle,
    config.donId,
    1, // Functions subscription ID (placeholder)
    config.vrfCoordinator,
    config.vrfKeyHash,
    1  // VRF subscription ID (placeholder)
  );

  await arbitrageCoordinator.waitForDeployment();
  const arbitrageCoordinatorAddress = await arbitrageCoordinator.getAddress();

  console.log("\n🎉 Deployment successful!");
  console.log("📍 Contract addresses:");
  console.log("   FunctionsManager Library:", functionsManagerAddress);
  console.log("   ArbitrageCoordinator:", arbitrageCoordinatorAddress);

  console.log("\n📝 Verify contracts with:");
  console.log(`npx hardhat verify --network ${networkName} ${functionsManagerAddress}`);
  console.log(`npx hardhat verify --network ${networkName} ${arbitrageCoordinatorAddress} \\`);
  console.log(`  "${config.router}" \\`);
  console.log(`  "${config.linkToken}" \\`);
  console.log(`  "${config.functionsOracle}" \\`);
  console.log(`  "${config.donId}" \\`);
  console.log(`  "1" \\`);
  console.log(`  "${config.vrfCoordinator}" \\`);
  console.log(`  "${config.vrfKeyHash}" \\`);
  console.log(`  "1"`);

  console.log("\n📋 Next steps:");
  console.log("1. 💰 Fund the contract with LINK tokens");
  console.log("2. 🎲 Set up VRF subscription and add contract as consumer");
  console.log("3. ⚡ Set up Functions subscription and add contract as consumer");
  console.log("4. 📤 Upload JavaScript source code via deployFunctions.js");
  console.log("5. 🧪 Test the integration with testFunctions.js");
  
  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: hre.network.config.chainId,
    functionsManager: functionsManagerAddress,
    arbitrageCoordinator: arbitrageCoordinatorAddress,
    timestamp: new Date().toISOString(),
    config: config
  };
  
  console.log("\n💾 Deployment complete:", JSON.stringify(deploymentInfo, null, 2));
}

  main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("❌ Deployment failed:", error);
      process.exit(1);
    });

export default main; 