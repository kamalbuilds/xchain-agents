const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 Simple DON Request Test...");
    
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    const contract = await ethers.getContractAt("ArbitrageCoordinatorUpgradeable", contractAddress);
    
    console.log("📄 Contract:", contractAddress);
    
    const [signer] = await ethers.getSigners();
    console.log("🔑 Signer:", signer.address);
    
    // Check subscription ID
    const subscriptionIds = await contract.getSubscriptionIds();
    console.log("🎯 Functions Subscription:", subscriptionIds[0].toString());
    
    // Check if authorized
    const isAuth = await contract.authorizedAgents(signer.address);
    console.log("🔐 Is Authorized:", isAuth);
    
    if (!isAuth) {
        console.log("⚡ Authorizing agent...");
        const authTx = await contract.registerAgent(signer.address, "test-agent");
        await authTx.wait();
        console.log("✅ Agent authorized!");
    }
    
    // Make request
    console.log("🚀 Making DON request...");
    const tx = await contract.requestMarketData(
        "0x01b0b8e2dd0d22ba25e8b89dc0f0e0bb07421e60",
        137,
        { gasLimit: 500000 }
    );
    
    console.log("📝 Tx:", tx.hash);
    const receipt = await tx.wait();
    console.log("✅ Confirmed! Block:", receipt.blockNumber);
    console.log("⛽ Gas:", receipt.gasUsed.toString());
    
    console.log("🎉 REAL DON REQUEST SENT!");
    console.log("📈 Check your subscription dashboard for fulfillment count increase!");
}

main().catch(console.error); 