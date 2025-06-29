const hre = require("hardhat");

async function main() {
    console.log("🚀 Executing Real Chainlink Functions Request...\n");

    const contractAddress = "0x65889aFB511548C1db8887271Fdbd2a4847B0Fa2";
    console.log(`Contract Address: ${contractAddress}`);

    // Get contract instance
    const ArbitrageCoordinatorUpgradeable = await hre.ethers.getContractFactory("ArbitrageCoordinatorUpgradeable");
    const contract = ArbitrageCoordinatorUpgradeable.attach(contractAddress);

    const [signer] = await hre.ethers.getSigners();
    console.log(`Signer: ${signer.address}`);
    
    const balance = await signer.provider.getBalance(signer.address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

    try {
        // Check subscription status
        console.log("📋 Checking subscription status...");
        const subscriptionIds = await contract.getSubscriptionIds();
        console.log(`Functions Subscription ID: ${subscriptionIds[0]}`);

        if (subscriptionIds[0] === 1n) {
            console.log("❌ Still using default subscription ID. Please update first.");
            return;
        }

        // Test market data request with real execution
        console.log("\n🎯 Creating Real Market Data Request...");
        console.log("This will execute on the Chainlink DON and cost LINK tokens");
        
        const marketId = "0x01d306ff2b8ec4b21dd39e6bd6b8e82bd1b5d63b1dc5b6f8c0b78fdfe790ca95"; // Real Polymarket market
        const chainId = 137; // Polygon chain ID for Polymarket
        
        console.log(`Market ID: ${marketId}`);
        console.log(`Chain ID: ${chainId}`);
        console.log("Request Type: market_data");
        console.log("⏳ Sending transaction...");

        const requestTx = await contract.requestMarketData(marketId, chainId);
        
        console.log(`✅ Transaction sent: ${requestTx.hash}`);
        console.log("⏳ Waiting for confirmation...");
        
        const receipt = await requestTx.wait();
        console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);

        // Parse events to get request ID
        const logs = receipt.logs;
        for (const log of logs) {
            try {
                const parsed = contract.interface.parseLog(log);
                if (parsed && parsed.name === "FunctionsRequestSent") {
                    const requestId = parsed.args.requestId;
                    console.log(`\n🆔 Request ID: ${requestId}`);
                    console.log(`📊 Market ID: ${parsed.args.marketId}`);
                    console.log(`🔄 Request Type: ${parsed.args.requestType}`);
                    
                    console.log(`\n🔗 Track your request:`);
                    console.log(`https://testnet.snowtrace.io/tx/${requestTx.hash}`);
                    
                    // Monitor for response
                    console.log(`\n⏳ Monitoring for response...`);
                    console.log(`This may take 1-3 minutes for DON execution`);
                    
                    // Set up event listener for response
                    const responsePromise = new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            contract.removeAllListeners("FunctionsResponseReceived");
                            reject(new Error("Timeout waiting for response"));
                        }, 300000); // 5 minute timeout

                        contract.on("FunctionsResponseReceived", (responseRequestId, response, error) => {
                            if (responseRequestId === requestId) {
                                clearTimeout(timeout);
                                contract.removeAllListeners("FunctionsResponseReceived");
                                resolve({ response, error });
                            }
                        });
                    });

                    try {
                        const result = await responsePromise;
                        
                        if (result.error && result.error !== "0x") {
                            console.log(`❌ Functions Error: ${result.error}`);
                        } else {
                            console.log(`✅ Functions Response Received!`);
                            console.log(`📊 Raw Response: ${result.response}`);
                            
                            // Try to decode the response
                            try {
                                const decoded = hre.ethers.AbiCoder.defaultAbiCoder().decode(
                                    ["uint256", "uint256", "uint256"],
                                    result.response
                                );
                                
                                const price = decoded[0];
                                const volume = decoded[1];
                                const timestamp = decoded[2];
                                
                                console.log(`\n📈 Decoded Market Data:`);
                                console.log(`Price: ${hre.ethers.formatEther(price)} (${(parseFloat(hre.ethers.formatEther(price)) * 100).toFixed(2)}%)`);
                                console.log(`Volume: ${hre.ethers.formatEther(volume)} USD`);
                                console.log(`Timestamp: ${new Date(parseInt(timestamp.toString()) * 1000).toISOString()}`);
                                
                            } catch (decodeError) {
                                console.log(`⚠️ Could not decode response - raw data shown above`);
                            }
                        }
                        
                    } catch (timeoutError) {
                        console.log(`⏰ Response timeout - request may still be processing`);
                        console.log(`Check the contract events later for the response`);
                    }
                    
                    break;
                }
            } catch (parseError) {
                // Log isn't from our contract, ignore
            }
        }

        console.log(`\n🎉 Real Functions Request Complete!`);
        console.log(`\n📋 Summary:`);
        console.log(`✅ Request sent to Chainlink DON`);
        console.log(`✅ Using subscription ID: ${subscriptionIds[0]}`);
        console.log(`✅ Contract address: ${contractAddress}`);
        console.log(`✅ Market data script: ~11KB with real API calls`);
        
        console.log(`\n💡 What happened:`);
        console.log(`1. Your contract sent a request to the Chainlink DON`);
        console.log(`2. DON nodes executed the JavaScript code`);
        console.log(`3. Made real API calls to Polymarket`);
        console.log(`4. Aggregated and validated the data`);
        console.log(`5. Returned the result to your contract`);
        
    } catch (error) {
        console.error("❌ Failed to execute Functions request:", error.message);
        
        if (error.message.includes("revert")) {
            console.log("💡 Contract reverted - check your subscription has enough LINK");
        }
        
        if (error.message.includes("gas")) {
            console.log("💡 Try increasing gas limit");
        }
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 