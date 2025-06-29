const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 Debugging Revert Reason...");
    
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    const contract = await ethers.getContractAt("ArbitrageCoordinatorUpgradeable", contractAddress);
    
    console.log("📄 Contract:", contractAddress);
    
    // Verify Functions Router is set
    const functionsRouter = await contract.functionsRouter();
    console.log("🔗 Functions Router:", functionsRouter);
    
    if (functionsRouter === "0x0000000000000000000000000000000000000000") {
        console.log("❌ Functions Router is still not set!");
        return;
    } else {
        console.log("✅ Functions Router is correctly set");
    }
    
    try {
        console.log("🧪 Testing with static call to get exact error...");
        
        // Try static call first to see the exact revert reason
        const result = await contract.requestMarketData.staticCall(
            "0x01b0b8e2dd0d22ba25e8b89dc0f0e0bb07421e60",
            137
        );
        
        console.log("✅ Static call succeeded! Result:", result);
        console.log("💡 The function should work - the issue might be gas or network related");
        
    } catch (error) {
        console.log("❌ Static call failed with error:", error.message);
        
        // More detailed error analysis
        if (error.data) {
            console.log("📝 Error data:", error.data);
            
            // Try to decode the error
            try {
                const iface = new ethers.Interface([
                    "error UnauthorizedAgent(address agent)",
                    "error InvalidMarket(string marketId)",
                    "error OnlyRouterCanFulfill()",
                    "function requestMarketData(string,uint256) external returns (bytes32)"
                ]);
                
                const decoded = iface.parseError(error.data);
                console.log("🔓 Decoded error:", decoded);
                
            } catch (decodeError) {
                console.log("❌ Could not decode error data");
            }
        }
        
        // Check specific error conditions
        if (error.message.includes("UnauthorizedAgent")) {
            console.log("💡 Issue: Agent not authorized");
        } else if (error.message.includes("Market data script not set")) {
            console.log("💡 Issue: Market data script not set");
        } else if (error.message.includes("OnlyRouterCanFulfill")) {
            console.log("💡 Issue: Router access problem");
        } else if (error.message.includes("execution reverted")) {
            console.log("💡 Issue: General execution revert - checking contract state...");
            
            // Check more contract state
            const subscriptionId = await contract.subscriptionId();
            const donId = await contract.donId();
            const scripts = await contract.getScripts();
            
            console.log("📊 Subscription ID:", subscriptionId.toString());
            console.log("🆔 DON ID:", donId);
            console.log("📜 Market Data Script Length:", scripts[0].length);
            console.log("🤖 AI Prediction Script Length:", scripts[1].length);
            
            if (scripts[0].length === 0) {
                console.log("❌ Market data script is empty!");
            }
            
            // Check Functions Router contract
            console.log("🔗 Checking Functions Router contract...");
            const routerContract = await ethers.getContractAt("IFunctionsRouter", functionsRouter);
            
            try {
                // Try to call a simple function on the router to verify it exists
                const routerOwner = await routerContract.owner();
                console.log("✅ Functions Router is accessible, owner:", routerOwner);
            } catch (routerError) {
                console.log("❌ Cannot access Functions Router:", routerError.message);
            }
        }
    }
}

main().catch(console.error); 