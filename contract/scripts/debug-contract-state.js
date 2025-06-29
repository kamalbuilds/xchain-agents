const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging Contract State...");
    
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    const contract = await ethers.getContractAt("ArbitrageCoordinatorUpgradeable", contractAddress);
    
    console.log("📄 Contract:", contractAddress);
    
    try {
        // Check basic state
        const subscriptionIds = await contract.getSubscriptionIds();
        console.log("🎯 Functions Subscription:", subscriptionIds[0].toString());
        console.log("🎲 VRF Subscription:", subscriptionIds[1].toString());
        
        // Check Functions router
        const functionsRouter = await contract.functionsRouter();
        console.log("🔗 Functions Router:", functionsRouter);
        
        // Check DON ID
        const donId = await contract.donId();
        console.log("🆔 DON ID:", donId);
        
        // Check scripts
        const scripts = await contract.getScripts();
        console.log("📜 Market Data Script Length:", scripts[0].length);
        console.log("🤖 AI Prediction Script Length:", scripts[1].length);
        
        // Check if scripts are set
        if (scripts[0].length === 0) {
            console.log("❌ Market data script is empty!");
        } else {
            console.log("✅ Market data script is set");
        }
        
        if (scripts[1].length === 0) {
            console.log("❌ Prediction script is empty!");
        } else {
            console.log("✅ Prediction script is set");
        }
        
        // Check signer
        const [signer] = await ethers.getSigners();
        console.log("🔑 Signer:", signer.address);
        
        const isAuth = await contract.authorizedAgents(signer.address);
        console.log("🔐 Is Authorized Agent:", isAuth);
        
        // Check owner
        const owner = await contract.owner();
        console.log("👑 Contract Owner:", owner);
        console.log("🤔 Is Signer Owner:", signer.address.toLowerCase() === owner.toLowerCase());
        
        // Test calling with static call first
        console.log("\n🧪 Testing with Static Call...");
        try {
            await contract.requestMarketData.staticCall(
                "0x01b0b8e2dd0d22ba25e8b89dc0f0e0bb07421e60",
                137
            );
            console.log("✅ Static call succeeded - function should work");
        } catch (error) {
            console.log("❌ Static call failed:", error.message);
            
            if (error.message.includes("Market data script not set")) {
                console.log("💡 Issue: Market data script is not set");
            } else if (error.message.includes("UnauthorizedAgent")) {
                console.log("💡 Issue: Agent not authorized");
            } else if (error.message.includes("subscriptionId")) {
                console.log("💡 Issue: Subscription problem");
            } else {
                console.log("💡 Issue: Unknown error");
            }
        }
        
    } catch (error) {
        console.error("❌ Error debugging contract:", error.message);
    }
}

main().catch(console.error); 