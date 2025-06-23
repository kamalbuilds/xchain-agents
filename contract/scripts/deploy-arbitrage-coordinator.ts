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
  
  console.log(`\n🚀 Deploying ArbitrageCoordinator to network: ${networkName} (chainId: ${network.chainId})`);
  
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
  console.log(`   VRF Coordinator: ${currentNetworkConfig.contracts.VRF_COORDINATOR}`);
  console.log(`   LINK Token: ${currentNetworkConfig.contracts.LINK_TOKEN}`);
  
  // Deploy ArbitrageCoordinator
  const ArbitrageCoordinator = await ethers.getContractFactory("ArbitrageCoordinator");
  
  const deploymentArgs = [
    currentNetworkConfig.contracts.CCIP_ROUTER,
    currentNetworkConfig.contracts.LINK_TOKEN,
    currentNetworkConfig.contracts.VRF_COORDINATOR,
    currentNetworkConfig.contracts.VRF_KEY_HASH,
    currentNetworkConfig.contracts.AUTOMATION_REGISTRAR
  ];
  
  console.log(`\n📦 Deploying with constructor arguments:`);
  console.log(`   Router: ${deploymentArgs[0]}`);
  console.log(`   LINK: ${deploymentArgs[1]}`);
  console.log(`   VRF Coordinator: ${deploymentArgs[2]}`);
  console.log(`   VRF Key Hash: ${deploymentArgs[3]}`);
  console.log(`   Automation Registrar: ${deploymentArgs[4]}`);
  
  const arbitrageCoordinator = await ArbitrageCoordinator.deploy(...deploymentArgs);
  await arbitrageCoordinator.waitForDeployment();
  
  const contractAddress = await arbitrageCoordinator.getAddress();
  console.log(`✅ ArbitrageCoordinator deployed to: ${contractAddress}`);
  
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
  
  const deploymentPath = path.join(deploymentsDir, `arbitrage-coordinator-${networkName}.json`);
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`📄 Deployment info saved to: ${deploymentPath}`);
  console.log(`🔍 Explorer: ${deploymentInfo.explorer}`);
  
  // Wait for block confirmations before verification
  console.log(`\n⏳ Waiting for 3 block confirmations...`);
  await arbitrageCoordinator.deploymentTransaction()?.wait(3);
  
  console.log(`\n📋 To verify the contract, run:`);
  console.log(`${deploymentInfo.verificationCommand}`);
  
  console.log(`\n🎯 Next steps for Chainlink configuration:`);
  console.log(`1. Fund the contract with LINK tokens for VRF and Automation`);
  console.log(`2. Register VRF subscription at: https://vrf.chain.link/`);
  console.log(`3. Set up Automation Upkeep at: https://automation.chain.link/`);
  console.log(`4. Configure CCIP allowlist for cross-chain operations`);
  
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