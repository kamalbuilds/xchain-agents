import { ethers, upgrades } from "hardhat";

async function main() {
    console.log("🔄 Upgrading ArbitrageCoordinatorUpgradeable...");
    
    // The existing proxy address
    const PROXY_ADDRESS = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    
    // Get the new contract factory
    const ArbitrageCoordinatorUpgradeableV2 = await ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    
    // Upgrade the proxy
    console.log("📝 Upgrading proxy to new implementation...");
    const upgraded = await upgrades.upgradeProxy(PROXY_ADDRESS, ArbitrageCoordinatorUpgradeableV2);
    
    console.log("✅ Proxy upgraded successfully!");
    console.log("🏠 Proxy Address:", await upgraded.getAddress());
    console.log("📄 New Implementation Address:", await upgrades.erc1967.getImplementationAddress(await upgraded.getAddress()));
    
    // Wait for confirmation
    await upgraded.waitForDeployment();
    console.log("⏳ Waiting for deployment confirmation...");
    
    // Verify the upgrade worked by checking if it has the new functions
    try {
        const subscriptionIds = await upgraded.getSubscriptionIds();
        console.log("🎯 Functions Subscription ID:", subscriptionIds[0]);
        console.log("🎲 VRF Subscription ID:", subscriptionIds[1]);
        
        const scripts = await upgraded.getScripts();
        console.log("📜 Market Data Script Length:", scripts[0].length);
        console.log("🤖 AI Prediction Script Length:", scripts[1].length);
        
        console.log("✅ Upgrade verified - contract now supports REAL DON requests!");
    } catch (error) {
        console.error("❌ Error verifying upgrade:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Upgrade failed:", error);
        process.exit(1);
    }); 