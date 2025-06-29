const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 Making Careful DON Request...");
    
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    const contract = await ethers.getContractAt("ArbitrageCoordinatorUpgradeable", contractAddress);
    
    console.log("📄 Contract:", contractAddress);
    
    // Get signer
    const [signer] = await ethers.getSigners();
    console.log("🔑 Signer:", signer.address);
    
    // Check balance
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("💰 Balance:", ethers.formatEther(balance), "AVAX");
    
    // Verify state
    const functionsRouter = await contract.functionsRouter();
    console.log("🔗 Functions Router:", functionsRouter);
    
    const subscriptionId = await contract.subscriptionId();
    console.log("🎯 Subscription ID:", subscriptionId.toString());
    
    try {
        console.log("⛽ Estimating gas...");
        
        // Estimate gas for the transaction
        const gasEstimate = await contract.requestMarketData.estimateGas(
            "0x01b0b8e2dd0d22ba25e8b89dc0f0e0bb07421e60",
            137
        );
        console.log("📊 Gas estimate:", gasEstimate.toString());
        
        // Add 20% buffer for gas
        const gasLimit = (gasEstimate * 120n) / 100n;
        console.log("🛡️  Gas limit (with buffer):", gasLimit.toString());
        
        // Check if we have enough balance for gas
        const gasPrice = await ethers.provider.getFeeData();
        const gasCost = gasLimit * gasPrice.gasPrice;
        console.log("💸 Estimated gas cost:", ethers.formatEther(gasCost), "AVAX");
        
        if (balance < gasCost) {
            console.log("❌ Insufficient balance for gas!");
            return;
        }
        
        console.log("🚀 Making DON request with proper gas settings...");
        
        const tx = await contract.requestMarketData(
            "0x01b0b8e2dd0d22ba25e8b89dc0f0e0bb07421e60",
            137,
            {
                gasLimit: gasLimit,
                gasPrice: gasPrice.gasPrice
            }
        );
        
        console.log("📝 Transaction hash:", tx.hash);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("✅ Transaction successful!");
            console.log("📦 Block number:", receipt.blockNumber);
            console.log("⛽ Gas used:", receipt.gasUsed.toString());
            
            // Look for events
            console.log("🔍 Searching for events...");
            
            const events = receipt.logs.map(log => {
                try {
                    return contract.interface.parseLog(log);
                } catch {
                    return null;
                }
            }).filter(event => event !== null);
            
            events.forEach(event => {
                console.log(`📢 Event: ${event.name}`);
                if (event.name === "RequestSent") {
                    console.log(`🎯 Request ID: ${event.args.id}`);
                    console.log("🎉 REAL DON REQUEST SENT SUCCESSFULLY!");
                    console.log("📈 This should increase your fulfillment count!");
                } else if (event.name === "AgentRequestCreated") {
                    console.log(`📋 Agent Request: ${event.args.requestId}`);
                    console.log(`🤖 Agent: ${event.args.agent}`);
                    console.log(`📝 Type: ${event.args.requestType}`);
                }
            });
            
            if (events.length === 0) {
                console.log("⚠️  No events found, but transaction was successful");
            }
            
        } else {
            console.log("❌ Transaction failed with status:", receipt.status);
        }
        
    } catch (error) {
        console.error("❌ Error making DON request:", error.message);
        
        if (error.code === "INSUFFICIENT_FUNDS") {
            console.log("💡 Issue: Insufficient funds for gas");
        } else if (error.message.includes("reverted")) {
            console.log("💡 Issue: Transaction reverted - check contract state");
        } else if (error.message.includes("gas")) {
            console.log("💡 Issue: Gas related problem");
        } else {
            console.log("💡 Unknown error - full error:", error);
        }
    }
}

main().catch(console.error); 