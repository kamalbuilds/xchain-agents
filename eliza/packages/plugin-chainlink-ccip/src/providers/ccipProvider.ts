import { ethers, JsonRpcProvider, Wallet } from "ethers";
import { IAgentRuntime, Memory, Provider, State } from "@ai16z/eliza";

// CCIP Chain Selectors for supported networks
export const CCIP_CHAIN_SELECTORS = {
    ethereum: "5009297550715157269",
    polygon: "4051577828743386545", 
    optimism: "3734403246176062136",
    arbitrum: "4949039107694359620",
    avalanche: "6433500567565415381"
} as const;

// Network configurations with real RPC endpoints
export const NETWORK_CONFIGS = {
    ethereum: {
        chainId: 1,
        name: "Ethereum Mainnet",
        rpcUrl: "https://eth.llamarpc.com",
        ccipSelector: CCIP_CHAIN_SELECTORS.ethereum,
        routerAddress: "0x80226fc0Ee2b096224EeAc085Bb9a8cba1146f7D", // Real CCIP Router
        linkToken: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        nativeToken: "0x0000000000000000000000000000000000000000"
    },
    polygon: {
        chainId: 137,
        name: "Polygon Mainnet",
        rpcUrl: "https://polygon.llamarpc.com",
        ccipSelector: CCIP_CHAIN_SELECTORS.polygon,
        routerAddress: "0x849c5ED5a80F5B408Dd4969b78c2C8fdf0565Bfe", // Real CCIP Router
        linkToken: "0x53E0bca35eC356BD5ddDFebbD1Fc0fD03FaBad39",
        nativeToken: "0x0000000000000000000000000000000000000000"
    },
    optimism: {
        chainId: 10,
        name: "Optimism Mainnet", 
        rpcUrl: "https://optimism.llamarpc.com",
        ccipSelector: CCIP_CHAIN_SELECTORS.optimism,
        routerAddress: "0x114A20A10b43D4115e5aeef7345a1A71d2a60C57", // Real CCIP Router
        linkToken: "0x350a791Bfc2C21F9Ed5d10980Dad2e2638ffa7f6",
        nativeToken: "0x0000000000000000000000000000000000000000"
    },
    arbitrum: {
        chainId: 42161,
        name: "Arbitrum One",
        rpcUrl: "https://arbitrum.llamarpc.com", 
        ccipSelector: CCIP_CHAIN_SELECTORS.arbitrum,
        routerAddress: "0x141fa059441E0ca23ce184B6A78bafD2A517DdE8", // Real CCIP Router
        linkToken: "0xf97f4df75117a78c1A5a0DBb814Af92458539FB4",
        nativeToken: "0x0000000000000000000000000000000000000000"
    },
    avalanche: {
        chainId: 43114,
        name: "Avalanche C-Chain",
        rpcUrl: "https://avalanche.llamarpc.com",
        ccipSelector: CCIP_CHAIN_SELECTORS.avalanche,
        routerAddress: "0xF4c7E640EdA248ef95972845a62bdC74237805dB", // Real CCIP Router
        linkToken: "0x5947BB275c521040051D82396192181b413227A3",
        nativeToken: "0x0000000000000000000000000000000000000000"
    }
} as const;

export interface ArbitrageOpportunity {
    marketId: string;
    sourceChain: keyof typeof NETWORK_CONFIGS;
    targetChain: keyof typeof NETWORK_CONFIGS;
    sourcePriceParsed: bigint;
    targetPriceParsed: bigint;
    profitPercent: bigint;
    volume: bigint;
    timestamp: number;
    confidence: number;
}

export interface CCIPMessage {
    receiver: string;
    data: string; 
    tokenAmounts: Array<{token: string; amount: bigint}>;
    extraArgs: string;
    feeToken: string;
}

export interface ArbitrageExecutionPlan {
    opportunity: ArbitrageOpportunity;
    positionSize: bigint;
    estimatedFee: bigint;
    estimatedProfit: bigint;
    executionSteps: Array<{
        chain: string;
        action: "buy" | "sell";
        amount: bigint;
        price: bigint;
    }>;
}

export class CCIPProvider implements Provider {
    private providers: Map<string, JsonRpcProvider> = new Map();
    private wallet: Wallet | null = null;

    constructor() {
        this.initializeProviders();
    }

    private initializeProviders(): void {
        for (const [network, config] of Object.entries(NETWORK_CONFIGS)) {
            try {
                const provider = new JsonRpcProvider(config.rpcUrl);
                this.providers.set(network, provider);
            } catch (error) {
                console.error(`Failed to initialize provider for ${network}:`, error);
            }
        }
    }

    async get(
        runtime: IAgentRuntime,
        message: Memory,
        state?: State
    ): Promise<string | null> {
        try {
            const content = message.content?.text || "";
            
            if (content.includes("ccip") || content.includes("cross-chain")) {
                return await this.handleCCIPQuery(content, runtime, state);
            }
            
            if (content.includes("arbitrage")) {
                return await this.handleArbitrageQuery(content, runtime, state);
            }
            
            if (content.includes("fees") || content.includes("estimate")) {
                return await this.handleFeeEstimation(content, runtime, state);
            }
            
            return null;
        } catch (error) {
            console.error("CCIPProvider error:", error);
            return `Error: ${error.message}`;
        }
    }

    private async handleCCIPQuery(
        content: string,
        runtime: IAgentRuntime,
        state?: State
    ): Promise<string> {
        const supportedChains = Object.keys(NETWORK_CONFIGS);
        const chainStatuses = await this.checkChainHealth();
        
        return `🔗 CCIP Cross-Chain Status:
        
Supported Networks: ${supportedChains.join(", ")}
        
Chain Health:
${Object.entries(chainStatuses)
    .map(([chain, status]) => `  ${chain}: ${status ? "✅ Online" : "❌ Offline"}`)
    .join("\n")}
        
Available Features:
• Cross-chain arbitrage execution
• Multi-chain market monitoring  
• CCIP fee estimation
• Real-time opportunity detection`;
    }

    private async handleArbitrageQuery(
        content: string, 
        runtime: IAgentRuntime,
        state?: State
    ): Promise<string> {
        // Mock arbitrage opportunities for demonstration
        const opportunities = await this.detectArbitrageOpportunities();
        
        if (opportunities.length === 0) {
            return "🔍 No profitable arbitrage opportunities detected across supported chains.";
        }
        
        const topOpportunity = opportunities[0];
        
        return `🎯 Arbitrage Opportunity Detected!
        
Market: ${topOpportunity.marketId}
Source Chain: ${topOpportunity.sourceChain} (${this.formatPrice(topOpportunity.sourcePriceParsed)})
Target Chain: ${topOpportunity.targetChain} (${this.formatPrice(topOpportunity.targetPriceParsed)})
Profit Potential: ${topOpportunity.profitPercent / 100n}%
Volume Available: ${this.formatEther(topOpportunity.volume)}
Confidence: ${topOpportunity.confidence}%

💡 Execute with CCIP cross-chain transaction to capture this opportunity!`;
    }

    private async handleFeeEstimation(
        content: string,
        runtime: IAgentRuntime,
        state?: State
    ): Promise<string> {
        // Extract chains from content or use defaults
        const sourceChain = this.extractChainFromContent(content, "from") || "ethereum";
        const targetChain = this.extractChainFromContent(content, "to") || "polygon";
        
        const feeEstimate = await this.estimateCCIPFee(
            sourceChain as keyof typeof NETWORK_CONFIGS,
            targetChain as keyof typeof NETWORK_CONFIGS,
            ethers.parseEther("100") // Default 100 token amount
        );
        
        return `💰 CCIP Fee Estimation:
        
Route: ${sourceChain} → ${targetChain}
Base Fee: ${this.formatEther(feeEstimate.baseFee)}
Data Fee: ${this.formatEther(feeEstimate.dataFee)}
Gas Fee: ${this.formatEther(feeEstimate.gasFee)}
Total Estimated Fee: ${this.formatEther(feeEstimate.totalFee)}
        
⚡ Use LINK token for 10% discount on CCIP fees!`;
    }

    async detectArbitrageOpportunities(): Promise<ArbitrageOpportunity[]> {
        // Mock implementation - in production this would fetch real market data
        const mockOpportunities: ArbitrageOpportunity[] = [
            {
                marketId: "us-election-2024-trump-wins",
                sourceChain: "ethereum",
                targetChain: "polygon", 
                sourcePriceParsed: ethers.parseEther("0.62"), // 62%
                targetPriceParsed: ethers.parseEther("0.68"), // 68%
                profitPercent: 967n, // ~9.67%
                volume: ethers.parseEther("5000"),
                timestamp: Math.floor(Date.now() / 1000),
                confidence: 85
            },
            {
                marketId: "crypto-btc-100k-2024",
                sourceChain: "arbitrum",
                targetChain: "optimism",
                sourcePriceParsed: ethers.parseEther("0.45"), // 45%
                targetPriceParsed: ethers.parseEther("0.51"), // 51%  
                profitPercent: 1333n, // ~13.33%
                volume: ethers.parseEther("2000"),
                timestamp: Math.floor(Date.now() / 1000),
                confidence: 92
            }
        ];
        
        // Filter only profitable opportunities (>3% profit margin)
        return mockOpportunities.filter(opp => opp.profitPercent > 300n);
    }

    async estimateCCIPFee(
        sourceChain: keyof typeof NETWORK_CONFIGS,
        targetChain: keyof typeof NETWORK_CONFIGS,
        amount: bigint
    ): Promise<{
        baseFee: bigint;
        dataFee: bigint;
        gasFee: bigint;
        totalFee: bigint;
    }> {
        // Mock fee calculation - in production would call real CCIP router
        const sourceConfig = NETWORK_CONFIGS[sourceChain];
        const targetConfig = NETWORK_CONFIGS[targetChain];
        
        // Base fee varies by chain pair
        let baseFee = ethers.parseEther("0.01"); // Default 0.01 ETH
        
        // Cheaper fees for L2s
        if (targetChain === "polygon" || targetChain === "optimism" || targetChain === "arbitrum") {
            baseFee = ethers.parseEther("0.005");
        }
        
        // Data fee based on message size (estimated 200 bytes)
        const dataFee = ethers.parseEther("0.002"); // ~200 bytes * 0.00001 ETH/byte
        
        // Gas fee for execution on destination
        const gasFee = ethers.parseEther("0.003");
        
        const totalFee = baseFee + dataFee + gasFee;
        
        return {
            baseFee,
            dataFee, 
            gasFee,
            totalFee
        };
    }

    async checkChainHealth(): Promise<Record<string, boolean>> {
        const health: Record<string, boolean> = {};
        
        for (const [network, provider] of this.providers.entries()) {
            try {
                const blockNumber = await provider.getBlockNumber();
                health[network] = blockNumber > 0;
            } catch (error) {
                health[network] = false;
            }
        }
        
        return health;
    }

    createExecutionPlan(opportunity: ArbitrageOpportunity): ArbitrageExecutionPlan {
        // Calculate optimal position size (limited by volume and risk management)
        const maxPosition = ethers.parseEther("1000"); // Max 1000 tokens
        const volumeLimit = opportunity.volume / 10n; // Max 10% of available volume
        const positionSize = volumeLimit < maxPosition ? volumeLimit : maxPosition;
        
        // Estimate fees and profit
        const estimatedFee = ethers.parseEther("0.015"); // Mock fee
        const priceDiff = opportunity.targetPriceParsed - opportunity.sourcePriceParsed;
        const grossProfit = (priceDiff * positionSize) / ethers.parseEther("1");
        const estimatedProfit = grossProfit - estimatedFee;
        
        return {
            opportunity,
            positionSize,
            estimatedFee,
            estimatedProfit,
            executionSteps: [
                {
                    chain: opportunity.sourceChain,
                    action: "buy",
                    amount: positionSize,
                    price: opportunity.sourcePriceParsed
                },
                {
                    chain: opportunity.targetChain,
                    action: "sell", 
                    amount: positionSize,
                    price: opportunity.targetPriceParsed
                }
            ]
        };
    }

    encodeCCIPMessage(
        receiver: string,
        marketId: string,
        action: "buy" | "sell",
        amount: bigint,
        targetPrice: bigint
    ): CCIPMessage {
        const data = ethers.AbiCoder.defaultAbiCoder().encode(
            ["string", "string", "uint256", "uint256", "uint256"],
            [
                marketId,
                action,
                amount,
                targetPrice,
                Math.floor(Date.now() / 1000) + 300 // 5 minute deadline
            ]
        );
        
        return {
            receiver: ethers.AbiCoder.defaultAbiCoder().encode(["address"], [receiver]),
            data,
            tokenAmounts: [], // No token transfers in this example
            extraArgs: "0x", // Default extra args
            feeToken: "0x0000000000000000000000000000000000000000" // Pay in native token
        };
    }

    private extractChainFromContent(content: string, direction: "from" | "to"): string | null {
        const chains = Object.keys(NETWORK_CONFIGS);
        const pattern = new RegExp(`${direction}\\s+(${chains.join("|")})`, "i");
        const match = content.match(pattern);
        return match ? match[1].toLowerCase() : null;
    }

    private formatPrice(price: bigint): string {
        const formatted = ethers.formatEther(price);
        return `${(parseFloat(formatted) * 100).toFixed(1)}%`;
    }

    private formatEther(amount: bigint): string {
        return `${ethers.formatEther(amount)} ETH`;
    }
}

export const ccipProvider = new CCIPProvider(); 