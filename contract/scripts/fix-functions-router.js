const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 Fixing Functions Router Address...");
    
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
            console.log("❌ Functions Router is not set - this is the problem!");
            
            // Since we need to set the functionsRouter but it's not exposed as a setter,
            // we need to re-initialize or call the initialization again
            console.log("🔄 Re-initializing contract...");
            
            const tx = await contract.initialize(
                FUJI_FUNCTIONS_ROUTER,  // router (also used for functionsRouter)
                "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846",  // linkToken
                "0x0000000000000000000000000000000000000000",  // functionsOracle (placeholder)
                "0x66756e2d6176616c616e6368652d66756a692d31000000000000000000000000",  // donId
                15643,  // subscriptionId
                "0x0000000000000000000000000000000000000000",  // vrfCoordinator (placeholder)
                "0x0000000000000000000000000000000000000000000000000000000000000000",  // keyHash (placeholder)
                1  // vrfSubscriptionId
            );
            
            console.log("📝 Transaction:", tx.hash);
            await tx.wait();
            console.log("✅ Re-initialization complete!");
            
        } else if (currentRouter !== FUJI_FUNCTIONS_ROUTER) {
            console.log("⚠️  Functions Router is set but incorrect");
            console.log("💡 Current:", currentRouter);
            console.log("💡 Expected:", FUJI_FUNCTIONS_ROUTER);
        } else {
            console.log("✅ Functions Router is correctly set!");
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
        console.error("❌ Error fixing Functions Router:", error.message);
        
        if (error.message.includes("already initialized")) {
            console.log("💡 Contract is already initialized");
            console.log("🔧 The Functions Router should be set during deployment");
            console.log("🔄 Consider upgrading the contract with a fix");
        }
    }
}

main().catch(console.error); 