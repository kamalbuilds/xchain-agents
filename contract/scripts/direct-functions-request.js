const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Sending Direct Functions Request to DON...\n");

    // Configuration
    const subscriptionId = 15643;
    const routerAddress = "0xA9d587a00A31A52Ed70D6026794a8FC5E2F5dCb0"; // Avalanche Fuji
    const donIdString = "fun-avalanche-fuji-1";
    const donId = ethers.id(donIdString);
    const gasLimit = 300000;

    const [signer] = await ethers.getSigners();
    console.log(`Signer: ${signer.address}`);
    
    const balance = await signer.provider.getBalance(signer.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ETH\n`);

    try {
        // Read the market data fetcher script
        const scriptPath = path.join(__dirname, "functions", "marketDataFetcher.js");
        const source = fs.readFileSync(scriptPath, "utf8");
        
        console.log(`📋 Script Info:`);
        console.log(`File: ${scriptPath}`);
        console.log(`Size: ${source.length} characters (~${(source.length/1024).toFixed(1)}KB)`);
        console.log(`DON ID: ${donIdString}`);
        console.log(`Subscription ID: ${subscriptionId}\n`);

        // Manual CBOR encoding for the request
        const request = {
            codeLocation: 0, // Inline
            language: 0, // JavaScript  
            source: source,
            secrets: [],
            args: ["0x01d306ff2b8ec4b21dd39e6bd6b8e82bd1b5d63b1dc5b6f8c0b78fdfe790ca95"]
        };

        // Simple CBOR-like encoding (basic implementation)
        function encodeFunctionsRequest(req) {
            // This is a simplified encoding - in production you'd use proper CBOR
            const encoder = new TextEncoder();
            const sourceBytes = encoder.encode(req.source);
            const argsBytes = encoder.encode(JSON.stringify(req.args));
            
            // Create a simple data structure
            const data = ethers.concat([
                ethers.zeroPadValue(ethers.toBeHex(req.codeLocation), 1),
                ethers.zeroPadValue(ethers.toBeHex(req.language), 1),
                ethers.zeroPadValue(ethers.toBeHex(sourceBytes.length), 4),
                sourceBytes,
                ethers.zeroPadValue(ethers.toBeHex(argsBytes.length), 4),
                argsBytes
            ]);
            
            return data;
        }

        console.log("🎯 Encoding Functions request...");
        const encodedRequest = encodeFunctionsRequest(request);
        console.log(`Encoded size: ${encodedRequest.length} bytes`);

        // Connect to Functions Router
        const functionsRouter = await ethers.getContractAt(
            "@chainlink/contracts/src/v0.8/functions/v1_0_0/interfaces/IFunctionsRouter.sol:IFunctionsRouter",
            routerAddress
        );

        console.log("⏳ Sending request to DON...");
        console.log(`Market ID: ${request.args[0]}`);
        
        const requestTx = await functionsRouter.sendRequest(
            subscriptionId,
            encodedRequest,
            gasLimit,
            donId
        );

        console.log(`✅ Transaction sent: ${requestTx.hash}`);
        console.log("⏳ Waiting for confirmation...");

        const receipt = await requestTx.wait();
        console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);
        console.log(`Gas used: ${receipt.gasUsed.toString()}`);

        // Parse events to get request ID
        let requestId = null;
        for (const log of receipt.logs) {
            try {
                const parsed = functionsRouter.interface.parseLog(log);
                if (parsed && parsed.name === "RequestStart") {
                    requestId = parsed.args.requestId;
                    console.log(`\n🆔 Request ID: ${requestId}`);
                    console.log(`📊 Subscription ID: ${parsed.args.subscriptionId}`);
                    console.log(`🔗 Explorer: https://testnet.snowtrace.io/tx/${requestTx.hash}`);
                    break;
                }
            } catch (e) {
                // Not our log
            }
        }

        if (requestId) {
            console.log(`\n⏳ Monitoring for DON response...`);
            console.log(`This may take 1-3 minutes for execution\n`);

            // Set up event listener for response
            const responsePromise = new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    functionsRouter.removeAllListeners("ResponseReceived");
                    reject(new Error("Timeout waiting for response"));
                }, 300000); // 5 minute timeout

                functionsRouter.on("ResponseReceived", (responseRequestId, transmitter, errorCode, response, rawError) => {
                    if (responseRequestId === requestId) {
                        clearTimeout(timeout);
                        functionsRouter.removeAllListeners("ResponseReceived");
                        resolve({ errorCode, response, rawError, transmitter });
                    }
                });
            });

            try {
                console.log("🔄 Waiting for DON to execute your JavaScript...");
                console.log("📡 Multiple nodes will run the code and reach consensus...");
                
                const result = await responsePromise;
                
                console.log(`\n✅ Response Received from DON!`);
                console.log(`Transmitter: ${result.transmitter}`);
                console.log(`Error Code: ${result.errorCode}`);
                
                if (result.errorCode !== 0) {
                    console.log(`❌ DON Error Code: ${result.errorCode}`);
                    if (result.rawError !== "0x") {
                        try {
                            const errorMsg = ethers.toUtf8String(result.rawError);
                            console.log(`Error Details: ${errorMsg}`);
                        } catch {
                            console.log(`Raw Error: ${result.rawError}`);
                        }
                    }
                } else {
                    console.log(`📊 Raw Response: ${result.response}`);
                    
                    // Try to decode the response
                    try {
                        const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
                            ["uint256", "uint256", "uint256"],
                            result.response
                        );
                        
                        const price = decoded[0];
                        const volume = decoded[1];
                        const timestamp = decoded[2];
                        
                        console.log(`\n📈 Decoded Market Data:`);
                        console.log(`Price: ${ethers.formatEther(price)} (${(parseFloat(ethers.formatEther(price)) * 100).toFixed(2)}%)`);
                        console.log(`Volume: ${ethers.formatEther(volume)} USD`);
                        console.log(`Timestamp: ${new Date(parseInt(timestamp.toString()) * 1000).toISOString()}`);
                        
                        console.log(`\n🎉 SUCCESS! Your Functions request executed perfectly!`);
                        console.log(`\n💡 What just happened:`);
                        console.log(`✅ Your JavaScript code was sent to multiple DON nodes`);
                        console.log(`✅ Each node executed real API calls to Polymarket`);
                        console.log(`✅ Nodes reached consensus on the data`);
                        console.log(`✅ Aggregated result returned to blockchain`);
                        console.log(`✅ All paid for with your LINK subscription`);
                        
                    } catch (decodeError) {
                        console.log(`⚠️ Could not decode response as expected format`);
                        console.log(`Raw response: ${result.response}`);
                        console.log(`This might be a different data format or error response`);
                    }
                }
                
            } catch (timeoutError) {
                console.log(`⏰ Response timeout after 5 minutes`);
                console.log(`The request may still be processing. Check your Functions dashboard:`);
                console.log(`https://functions.chain.link/avalanche-fuji/15643`);
            }

        } else {
            console.log("⚠️ Could not extract request ID from transaction logs");
            console.log("The request may have been sent but we can't track the response");
        }

        console.log(`\n🎉 Direct Functions Request Complete!`);

    } catch (error) {
        console.error("❌ Failed to send Functions request:", error.message);
        
        if (error.message.includes("subscription")) {
            console.log("💡 Check your subscription has enough LINK balance");
        }
        
        if (error.message.includes("consumer")) {
            console.log("💡 Ensure your address is added as a consumer");
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