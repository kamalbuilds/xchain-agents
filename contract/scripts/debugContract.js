const hre = require("hardhat");

async function main() {
    console.log("🔍 Debugging Contract State and Fixing Issues...\n");

    const contractAddress = "0xa749b73597fb34136ca6dbbbcb4ca3c9acb730d2";
    console.log(`Contract Address: ${contractAddress}`);

    // Get contract instance
    const ArbitrageCoordinator = await hre.ethers.getContractFactory("ArbitrageCoordinatorMinimal");
    const contract = ArbitrageCoordinator.attach(contractAddress);

    // Get deployer account
    const [deployer] = await hre.ethers.getSigners();
    console.log(`Deployer: ${deployer.address}`);
    console.log(`Balance: ${hre.ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH\n`);

    console.log("📋 Contract State Diagnosis:");
    console.log("=".repeat(50));

    try {
        // Check 1: Subscription ID
        const subscriptionId = await contract.getSubscriptionId();
        console.log(`✅ Subscription ID: ${subscriptionId}`);
    } catch (error) {
        console.log(`❌ Could not get subscription ID: ${error.message}`);
    }

    try {
        // Check 2: Scripts uploaded
        const scripts = await contract.getScripts();
        console.log(`✅ Market Data Script: ${scripts[0].length} characters`);
        console.log(`✅ AI Prediction Script: ${scripts[1].length} characters`);
    } catch (error) {
        console.log(`❌ Could not get scripts: ${error.message}`);
    }

    try {
        // Check 3: Agent authorization - try different approaches
        console.log("\n🔍 Checking agent authorization...");
        
        // Method 1: Direct struct access
        try {
            const agentStruct = await contract.authorizedAgents(deployer.address);
            console.log(`Agent struct: isActive=${agentStruct.isActive}, agentId="${agentStruct.agentId}"`);
            
            if (!agentStruct.isActive) {
                console.log("⚠️  Agent is not active, attempting to register...");
                await registerAgent(contract, deployer);
            } else {
                console.log("✅ Agent is already authorized and active");
            }
        } catch (structError) {
            console.log(`❌ Could not read agent struct: ${structError.message}`);
            console.log("🔧 Attempting to register agent anyway...");
            await registerAgent(contract, deployer);
        }

    } catch (error) {
        console.log(`❌ Agent check failed: ${error.message}`);
    }

    // Check 4: Try to make a Functions request
    console.log("\n🧪 Testing Functions Request...");
    try {
        const testMarketId = "test-market-debug";
        const testChainId = 137;
        
        console.log(`Attempting market data request for: ${testMarketId}`);
        const tx = await contract.requestMarketData(testMarketId, testChainId);
        console.log(`✅ Request sent! Transaction: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Request confirmed! Block: ${receipt.blockNumber}`);
        
        // Find the event
        const event = receipt.logs.find(log => {
            try {
                const decoded = contract.interface.parseLog(log);
                return decoded.name === "AgentRequestCreated";
            } catch {
                return false;
            }
        });

        if (event) {
            const decoded = contract.interface.parseLog(event);
            console.log(`✅ Request ID: ${decoded.args.requestId}`);
        }

    } catch (requestError) {
        console.log(`❌ Functions request failed: ${requestError.message}`);
        
        // Analyze the error
        if (requestError.message.includes("UnauthorizedAgent")) {
            console.log("🔧 Issue: Agent authorization problem");
            await registerAgent(contract, deployer);
        } else if (requestError.message.includes("Market data script not set")) {
            console.log("🔧 Issue: JavaScript scripts not uploaded");
            console.log("💡 Run: npx hardhat run scripts/deployFunctions.js --network avalancheFuji");
        } else if (requestError.message.includes("execution reverted")) {
            console.log("🔧 Issue: Generic execution revert - checking more details...");
            await diagnoseRevertReason(contract, deployer);
        } else {
            console.log(`🔧 Unknown issue: ${requestError.message}`);
        }
    }

    console.log("\n🎯 Diagnosis Complete!");
}

async function registerAgent(contract, deployer) {
    try {
        console.log("📤 Registering deployer as authorized agent...");
        const tx = await contract.registerAgent(deployer.address, "debug-test-agent");
        console.log(`Transaction sent: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`✅ Agent registered! Block: ${receipt.blockNumber}`);
        
        // Verify registration
        const agentStruct = await contract.authorizedAgents(deployer.address);
        console.log(`✅ Verification - Agent active: ${agentStruct.isActive}`);
        
    } catch (error) {
        console.log(`❌ Failed to register agent: ${error.message}`);
        
        if (error.message.includes("already registered")) {
            console.log("✅ Agent is already registered!");
        } else if (error.message.includes("Not owner")) {
            console.log("💡 Issue: Not the contract owner - check if using the right account");
        } else {
            console.log(`💡 Unknown registration error: ${error.message}`);
        }
    }
}

async function diagnoseRevertReason(contract, deployer) {
    console.log("🔍 Diagnosing revert reason...");
    
    try {
        // Check if contract is the right type
        const code = await deployer.provider.getCode(await contract.getAddress());
        if (code === "0x") {
            console.log("❌ Contract has no code deployed!");
            return;
        }
        
        // Try to call a simple view function
        try {
            const subscriptionId = await contract.getSubscriptionId();
            console.log(`✅ Contract is responsive, subscription ID: ${subscriptionId}`);
        } catch (viewError) {
            console.log(`❌ Contract not responsive to view calls: ${viewError.message}`);
            return;
        }
        
        // Check if we're using the right contract interface
        try {
            const owner = await contract.owner();
            console.log(`✅ Contract owner: ${owner}`);
            console.log(`✅ Deployer is owner: ${owner.toLowerCase() === deployer.address.toLowerCase()}`);
        } catch (ownerError) {
            console.log(`❌ Could not check owner: ${ownerError.message}`);
        }
        
    } catch (error) {
        console.log(`❌ Diagnosis failed: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Debug Error:", error);
        process.exit(1);
    }); 