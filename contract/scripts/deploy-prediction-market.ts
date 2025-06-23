import { ethers } from "hardhat";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import fs from "fs";
import path from "path";

interface NetworkConfig {
  chainId: number;
  explorer: string;
  contracts: {
    CCIP_ROUTER: string;
    LINK_TOKEN: string;
    CCIP_BNM_TOKEN: string;
    CCIP_LNM_TOKEN: string;
    VRF_COORDINATOR: string;
    VRF_KEY_HASH: string;
    AUTOMATION_REGISTRY: string;
    AUTOMATION_REGISTRAR: string;
    DATA_FEEDS_FEED_REGISTRY?: string;
  };
}

interface DeployConfig {
  [network: string]: NetworkConfig;
}

async function main() {
  const network = await ethers.provider.getNetwork();
  const networkName = process.env.HARDHAT_NETWORK || "localhost";
  
  console.log(`\n🚀 Deploying PredictionMarketDataStreams to network: ${networkName} (chainId: ${network.chainId})`);
  
  // Load configuration
  const configPath = path.join(__dirname, "../deploy-config.json");
  const deployConfig: DeployConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  
  // Find network config
  const currentNetworkConfig = Object.values(deployConfig).find(
    config => config.chainId.toString() === network.chainId.toString()
  );
  
  if (!currentNetworkConfig) {
    throw new Error(`Network configuration not found for chainId: ${network.chainId}`);
  }
  
  console.log(`📋 Using network configuration for ${networkName}:`);
  console.log(`   CCIP Router: ${currentNetworkConfig.contracts.CCIP_ROUTER}`);
  console.log(`   LINK Token: ${currentNetworkConfig.contracts.LINK_TOKEN}`);
  console.log(`   Data Feeds Registry: ${currentNetworkConfig.contracts.DATA_FEEDS_FEED_REGISTRY || "N/A"}`);
  
  // Deploy PredictionMarketDataStreams
  const PredictionMarketDataStreams = await ethers.getContractFactory("PredictionMarketDataStreams");
  
  const deploymentArgs = [
    currentNetworkConfig.contracts.CCIP_ROUTER,
    currentNetworkConfig.contracts.LINK_TOKEN
  ];
  
  console.log(`\n📦 Deploying with constructor arguments:`);
  console.log(`   Router: ${deploymentArgs[0]}`);
  console.log(`   LINK: ${deploymentArgs[1]}`);
  
  const predictionMarket = await PredictionMarketDataStreams.deploy(...deploymentArgs);
  await predictionMarket.waitForDeployment();
  
  const contractAddress = await predictionMarket.getAddress();
  console.log(`✅ PredictionMarketDataStreams deployed to: ${contractAddress}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId.toString(),
    contractAddress,
    constructorArgs: deploymentArgs,
    deployedAt: new Date().toISOString(),
    explorer: `${currentNetworkConfig.explorer}/address/${contractAddress}`,
    verificationCommand: `npx hardhat verify --network ${networkName} ${contractAddress} ${deploymentArgs.map(arg => `"${arg}"`).join(" ")}`
  };
  
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentPath = path.join(deploymentsDir, `prediction-market-${networkName}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);
  console.log(`🔍 Explorer: ${deploymentInfo.explorer}`);
  
  // Wait for block confirmations before verification
  console.log(`\n⏳ Waiting for 3 block confirmations...`);
  await predictionMarket.deploymentTransaction()?.wait(3);
  
  console.log(`\n📋 To verify the contract, run:`);
  console.log(`${deploymentInfo.verificationCommand}`);
  
  console.log(`\n🎯 Next steps for Chainlink configuration:`);
  console.log(`1. Fund the contract with LINK tokens for CCIP operations`);
  console.log(`2. Set up Chainlink Functions subscription`);
  console.log(`3. Configure Data Streams access if available on this network`);
  console.log(`4. Configure Polymarket API integration for prediction market data`);
  
  return {
    contractAddress,
    deploymentInfo
  };
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export default main; 