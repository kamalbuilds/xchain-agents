import { ethers } from "hardhat";
import deployArbitrageCoordinator from "./deploy-arbitrage-coordinator";
import deployPredictionMarket from "./deploy-prediction-market";
import fs from "fs";
import path from "path";

interface DeploymentSummary {
  network: string;
  chainId: string;
  contracts: {
    arbitrageCoordinator?: string;
    predictionMarket?: string;
  };
  deployed: boolean;
  error?: string;
}

const SUPPORTED_NETWORKS = [
  "sepolia",
  "baseSepolia", 
  "polygonAmoy",
  "arbitrumSepolia",
  "avalancheFuji"
];

async function main() {
  const networkName = process.env.HARDHAT_NETWORK;
  
  if (!networkName) {
    console.log("❌ Please specify a network using --network flag");
    console.log("📋 Supported networks:", SUPPORTED_NETWORKS.join(", "));
    process.exit(1);
  }
  
  if (!SUPPORTED_NETWORKS.includes(networkName)) {
    console.log(`❌ Unsupported network: ${networkName}`);
    console.log("📋 Supported networks:", SUPPORTED_NETWORKS.join(", "));
    process.exit(1);
  }
  
  const network = await ethers.provider.getNetwork();
  console.log(`\n🚀 Starting deployment to ${networkName} (chainId: ${network.chainId})`);
  
  const deploymentSummary: DeploymentSummary = {
    network: networkName,
    chainId: network.chainId.toString(),
    contracts: {},
    deployed: false
  };
  
  try {
    // Deploy ArbitrageCoordinator
    console.log(`\n1️⃣  Deploying ArbitrageCoordinator...`);
    const arbitrageResult = await deployArbitrageCoordinator();
    deploymentSummary.contracts.arbitrageCoordinator = arbitrageResult.contractAddress;
    console.log(`✅ ArbitrageCoordinator deployed: ${arbitrageResult.contractAddress}`);
    
    // Deploy PredictionMarketDataStreams
    console.log(`\n2️⃣  Deploying PredictionMarketDataStreams...`);
    const predictionResult = await deployPredictionMarket();
    deploymentSummary.contracts.predictionMarket = predictionResult.contractAddress;
    console.log(`✅ PredictionMarketDataStreams deployed: ${predictionResult.contractAddress}`);
    
    deploymentSummary.deployed = true;
    
    // Save deployment summary
    const deploymentsDir = path.join(__dirname, "../deployments");
    const summaryPath = path.join(deploymentsDir, `deployment-summary-${networkName}.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(deploymentSummary, null, 2));
    
    console.log(`\n🎉 Deployment completed successfully!`);
    console.log(`📄 Summary saved to: ${summaryPath}`);
    
    // Print summary
    printDeploymentSummary(deploymentSummary);
    
    // Print next steps
    printNextSteps(networkName, deploymentSummary);
    
  } catch (error) {
    deploymentSummary.deployed = false;
    deploymentSummary.error = error instanceof Error ? error.message : String(error);
    
    console.error(`\n❌ Deployment failed:`, error);
    
    // Save failed deployment info
    const deploymentsDir = path.join(__dirname, "../deployments");
    const summaryPath = path.join(deploymentsDir, `deployment-summary-${networkName}-failed.json`);
    fs.writeFileSync(summaryPath, JSON.stringify(deploymentSummary, null, 2));
    
    process.exit(1);
  }
}

function printDeploymentSummary(summary: DeploymentSummary) {
  console.log(`\n📊 Deployment Summary`);
  console.log(`═══════════════════════════════════════════════`);
  console.log(`Network: ${summary.network}`);
  console.log(`Chain ID: ${summary.chainId}`);
  console.log(`Status: ${summary.deployed ? "✅ Success" : "❌ Failed"}`);
  
  if (summary.contracts.arbitrageCoordinator) {
    console.log(`ArbitrageCoordinator: ${summary.contracts.arbitrageCoordinator}`);
  }
  
  if (summary.contracts.predictionMarket) {
    console.log(`PredictionMarketDataStreams: ${summary.contracts.predictionMarket}`);
  }
  
  if (summary.error) {
    console.log(`Error: ${summary.error}`);
  }
  console.log(`═══════════════════════════════════════════════`);
}

function printNextSteps(network: string, summary: DeploymentSummary) {
  console.log(`\n🎯 Next Steps for Chainlink Configuration`);
  console.log(`═══════════════════════════════════════════════`);
  
  console.log(`\n1. 💰 Fund Contracts with LINK Tokens:`);
  if (summary.contracts.arbitrageCoordinator) {
    console.log(`   • ArbitrageCoordinator: ${summary.contracts.arbitrageCoordinator}`);
  }
  if (summary.contracts.predictionMarket) {
    console.log(`   • PredictionMarketDataStreams: ${summary.contracts.predictionMarket}`);
  }
  
  console.log(`\n2. 🎲 Set up VRF Subscription:`);
  console.log(`   • Visit: https://vrf.chain.link/${network}`);
  console.log(`   • Create a new subscription`);
  console.log(`   • Add your ArbitrageCoordinator contract as a consumer`);
  console.log(`   • Fund the subscription with LINK tokens`);
  
  console.log(`\n3. 🤖 Set up Automation Upkeep:`);
  console.log(`   • Visit: https://automation.chain.link/${network}`);
  console.log(`   • Register a new upkeep for ArbitrageCoordinator`);
  console.log(`   • Set appropriate gas limits and funding`);
  
  console.log(`\n4. ⚡ Set up Chainlink Functions:`);
  console.log(`   • Visit: https://functions.chain.link/`);
  console.log(`   • Create a subscription for your contracts`);
  console.log(`   • Upload your JavaScript code for market analysis`);
  console.log(`   • Add your contracts as authorized consumers`);
  
  console.log(`\n5. 🌉 Configure CCIP (Cross-Chain):`);
  console.log(`   • Ensure contracts are funded with LINK for cross-chain operations`);
  console.log(`   • Configure destination chain selectors for supported networks`);
  console.log(`   • Test cross-chain message sending between testnets`);
  
  console.log(`\n6. 📊 Set up Data Streams (if available):`);
  console.log(`   • Contact Chainlink for Data Streams access on testnets`);
  console.log(`   • Configure feed IDs for the assets you want to track`);
  console.log(`   • Set up proper authentication and fee management`);
  
  console.log(`\n7. 🔗 Integration Testing:`);
  console.log(`   • Test VRF randomness generation`);
  console.log(`   • Test automation triggers`);
  console.log(`   • Test cross-chain messaging`);
  console.log(`   • Test Chainlink Functions execution`);
  
  console.log(`\n8. 📈 Polymarket Integration:`);
  console.log(`   • Set up Polymarket API credentials`);
  console.log(`   • Configure market data polling`);
  console.log(`   • Test prediction market data retrieval`);
  
  console.log(`\n═══════════════════════════════════════════════`);
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