const hre = require("hardhat");
const { SubscriptionManager, simulateScript, ResponseListener, Location, CodeLanguage } = require("@chainlink/functions-toolkit");

async function main() {
    console.log("🔗 Testing Real Chainlink Functions DON Execution...\n");

    const network = hre.network.name;
    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";

    console.log(`Network: ${network}`);
    console.log(`Contract Address: ${contractAddress}\n`);

    // Get signer
    const [signer] = await hre.ethers.getSigners();
    console.log(`Signer: ${signer.address}`);

    // Network configuration for Avalanche Fuji
    const functionsRouterAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0"; // Fuji Functions Router
    const donId = "fun-avalanche-fuji-1";
    const gatewayUrls = [
        "https://01.functions-gateway.testnet.chain.link/",
        "https://02.functions-gateway.testnet.chain.link/"
    ];

    console.log("📋 Chainlink Functions Configuration:");
    console.log(`Router Address: ${functionsRouterAddress}`);
    console.log(`DON ID: ${donId}`);
    console.log(`Gateway URLs: ${gatewayUrls.length} endpoints\n`);

    try {
        // Initialize Subscription Manager
        const subscriptionManager = new SubscriptionManager({
            signer,
            linkTokenAddress: "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846", // Fuji LINK
            functionsRouterAddress
        });

        await subscriptionManager.initialize();

        // Get contract instance to read the JavaScript source
        const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
        const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

        console.log("📖 Reading deployed JavaScript from contract...");
        const scripts = await contract.getScripts();
        const marketDataScript = scripts[0];
        
        console.log(`Market Data Script: ${marketDataScript.length} characters`);
        
        if (marketDataScript.length === 0) {
            throw new Error("No market data script found in contract. Please deploy first.");
        }

        // Test 1: Simulate script execution locally
        console.log("\n🧪 Test 1: Local simulation of market data script...");
        
        const simulationArgs = ["0x1234567890123456789012345678901234567890", "43113"];
        
        console.log(`Arguments: ${JSON.stringify(simulationArgs)}`);
        
        try {
            const simulationResult = await simulateScript({
                source: marketDataScript,
                args: simulationArgs,
                bytesArgs: [], // No encrypted args for now
                secrets: {}, // No secrets for testing
                maxExecutionTimeMs: 10000,
                numAllowedQueries: 5,
                maxQueryDurationMs: 9000,
                maxQueryResponseBytes: 2 * 1024 * 1024 // 2MB
            });

            console.log("✅ Local simulation successful!");
            console.log(`Response type: ${simulationResult.responseBytesHexstring ? 'bytes' : 'string'}`);
            console.log(`Response: ${simulationResult.responseBytesHexstring || simulationResult.responseString}`);
            console.log(`Execution time: ${simulationResult.executionTimeMs}ms`);
            console.log(`HTTP queries made: ${simulationResult.capturedTerminalOutput.match(/HTTP/g)?.length || 0}`);
            
        } catch (simError) {
            console.log("❌ Local simulation failed:");
            console.log(simError.message);
            console.log("\nThis might be expected if external APIs are required.");
        }

        // Test 2: Check if we have a subscription
        console.log("\n🧪 Test 2: Checking Chainlink Functions subscription...");
        
        let subscriptionId;
        
        try {
            // Try to get existing subscriptions
            const subscriptions = await subscriptionManager.getAllSubscriptions();
            console.log(`Found ${subscriptions.length} existing subscriptions`);
            
            if (subscriptions.length > 0) {
                subscriptionId = subscriptions[0].subscriptionId;
                console.log(`Using existing subscription: ${subscriptionId}`);
                
                // Get subscription details
                const subInfo = await subscriptionManager.getSubscriptionInfo(subscriptionId);
                console.log(`Balance: ${hre.ethers.formatUnits(subInfo.balance, 18)} LINK`);
                console.log(`Owner: ${subInfo.owner}`);
                console.log(`Consumers: ${subInfo.consumers.length}`);
                
                // Check if our contract is a consumer
                const isConsumer = subInfo.consumers.includes(contractAddress);
                console.log(`Contract is consumer: ${isConsumer}`);
                
                if (!isConsumer) {
                    console.log("⚠️ Contract is not a consumer. Adding...");
                    try {
                        const addConsumerTx = await subscriptionManager.addConsumer({
                            subscriptionId,
                            consumerAddress: contractAddress
                        });
                        console.log(`Add consumer tx: ${addConsumerTx.transactionHash}`);
                    } catch (addError) {
                        console.log(`❌ Failed to add consumer: ${addError.message}`);
                    }
                }
                
            } else {
                console.log("⚠️ No subscriptions found. Please create one at:");
                console.log("🔗 https://functions.chain.link/avalanche-fuji");
                console.log("\nSteps to create subscription:");
                console.log("1. Visit the link above");
                console.log("2. Connect your wallet");
                console.log("3. Create new subscription");
                console.log("4. Fund with LINK tokens");
                console.log(`5. Add consumer: ${contractAddress}`);
                return;
            }
            
        } catch (subError) {
            console.log(`❌ Error checking subscriptions: ${subError.message}`);
            console.log("You may need to create a subscription manually.");
            return;
        }

        // Test 3: Update contract with real subscription ID
        console.log("\n🧪 Test 3: Updating contract subscription ID...");
        
        try {
            const currentSubIds = await contract.getSubscriptionIds();
            console.log(`Current Functions subscription: ${currentSubIds[0]}`);
            
            if (currentSubIds[0] !== BigInt(subscriptionId)) {
                console.log(`Updating to real subscription ID: ${subscriptionId}`);
                const updateTx = await contract.updateFunctionsSubscriptionId(subscriptionId);
                await updateTx.wait();
                console.log("✅ Subscription ID updated!");
            } else {
                console.log("✅ Subscription ID already correct!");
            }
            
        } catch (updateError) {
            console.log(`❌ Failed to update subscription: ${updateError.message}`);
        }

        // Test 4: Make a real request to the DON
        console.log("\n🧪 Test 4: Making real request to Chainlink DON...");
        
        try {
            // Create request using contract
            const testMarketId = "0x0000000000000000000000000000000000000000000000000000000000000001";
            const testChainId = 43113;
            
            console.log(`Requesting market data for: ${testMarketId}`);
            
            const requestTx = await contract.requestMarketData(testMarketId, testChainId);
            const receipt = await requestTx.wait();
            
            console.log(`✅ Request submitted! Block: ${receipt.blockNumber}`);
            console.log(`Transaction: ${receipt.hash}`);
            
            // Look for the request ID in events
            let requestId;
            for (const log of receipt.logs) {
                try {
                    const parsed = contract.interface.parseLog(log);
                    if (parsed.name === "AgentRequestCreated") {
                        requestId = parsed.args[0];
                        console.log(`📋 Request ID: ${requestId}`);
                        break;
                    }
                } catch (e) {
                    // Ignore unparseable logs
                }
            }
            
            if (requestId) {
                console.log("\n⏱️ Waiting for DON response...");
                console.log("(This may take 1-5 minutes depending on network congestion)");
                
                // Set up response listener
                const responseListener = new ResponseListener({
                    provider: signer.provider,
                    functionsRouterAddress
                });
                
                // Wait for response (with timeout)
                const timeoutMs = 300000; // 5 minutes
                const startTime = Date.now();
                
                while (Date.now() - startTime < timeoutMs) {
                    try {
                        const response = await responseListener.listenForResponse(requestId);
                        
                        if (response) {
                            console.log("\n🎉 DON Response Received!");
                            console.log(`Response: ${response.responseBytesHexstring || response.responseString}`);
                            console.log(`Error: ${response.errorString || 'None'}`);
                            console.log(`Gas used: ${response.totalCostInJuels}`);
                            break;
                        }
                        
                        // Wait 10 seconds before checking again
                        await new Promise(resolve => setTimeout(resolve, 10000));
                        process.stdout.write(".");
                        
                    } catch (listenError) {
                        console.log(`\n❌ Error listening for response: ${listenError.message}`);
                        break;
                    }
                }
                
                if (Date.now() - startTime >= timeoutMs) {
                    console.log("\n⏰ Response timeout. Check Functions dashboard:");
                    console.log(`🔗 https://functions.chain.link/avalanche-fuji/${subscriptionId}`);
                }
                
            } else {
                console.log("❌ Could not find request ID in transaction logs");
            }
            
        } catch (requestError) {
            console.log(`❌ Failed to make DON request: ${requestError.message}`);
            
            if (requestError.message.includes("subscription")) {
                console.log("\n💡 Subscription issues:");
                console.log("1. Make sure subscription has LINK balance");
                console.log("2. Verify contract is added as consumer");
                console.log("3. Check subscription is active");
            }
        }

        console.log("\n🎉 Chainlink Functions DON Testing Complete!");
        
    } catch (error) {
        console.error("❌ Testing failed:", error.message);
        
        if (error.message.includes("subscription")) {
            console.log("\n📋 Quick Setup Guide:");
            console.log("1. Visit: https://functions.chain.link/avalanche-fuji");
            console.log("2. Create subscription and fund with LINK");
            console.log(`3. Add consumer: ${contractAddress}`);
            console.log("4. Run this test again");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    }); 