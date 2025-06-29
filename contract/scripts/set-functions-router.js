const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Setting Functions Router Address...");
    
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    const contract = await ethers.getContractAt("ArbitrageCoordinatorUpgradeable", contractAddress);
    
    // Avalanche Fuji Functions Router address
    const FUJI_FUNCTIONS_ROUTER = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0";
    
    console.log("📄 Contract:", contractAddress);
    console.log("🔗 Setting Functions Router to:", FUJI_FUNCTIONS_ROUTER);
    
    try {
        // Check current router
        const currentRouter = await contract.functionsRouter();
        console.log("🔍 Current Functions Router:", currentRouter);
        
        if (currentRouter === "0x0000000000000000000000000000000000000000") {
            console.log("❌ Functions Router is not set - fixing now!");
            
            // Set the correct Functions Router
            const tx = await contract.setFunctionsRouter(FUJI_FUNCTIONS_ROUTER);
            console.log("📝 Transaction:", tx.hash);
            
            const receipt = await tx.wait();
            console.log("✅ Transaction confirmed! Block:", receipt.blockNumber);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
        } else if (currentRouter !== FUJI_FUNCTIONS_ROUTER) {
            console.log("⚠️  Functions Router is set but incorrect");
            console.log("💡 Current:", currentRouter);
            console.log("💡 Expected:", FUJI_FUNCTIONS_ROUTER);
            
            // Update to correct router
            const tx = await contract.setFunctionsRouter(FUJI_FUNCTIONS_ROUTER);
            console.log("📝 Updating to correct router...");
            await tx.wait();
            console.log("✅ Updated successfully!");
            
        } else {
            console.log("✅ Functions Router is already correctly set!");
        }
        
        // Verify the fix
        const newRouter = await contract.functionsRouter();
        console.log("🔍 New Functions Router:", newRouter);
        
        if (newRouter === FUJI_FUNCTIONS_ROUTER) {
            console.log("🎉 SUCCESS! Functions Router is now correctly set!");
            console.log("🚀 DON requests should now work!");
        } else {
            console.log("❌ Functions Router still not set correctly");
        }
        
    } catch (error) {
        console.error("❌ Error setting Functions Router:", error.message);
    }
}

main().catch(console.error); 