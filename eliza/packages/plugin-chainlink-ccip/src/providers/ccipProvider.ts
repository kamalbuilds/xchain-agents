import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import { createClient, http, PublicClient, WalletClient, createWalletClient, publicActions } from 'viem';
import { mainnet, polygon, arbitrum, avalanche, base, optimism, sepolia } from 'viem/chains';
import winston from 'winston';
import {
  CCIPProvider,
  CCIPSendRequest,
  CCIPMessage,
  CCIPMessageStatus,
  CCIPFeeEstimate,
  ChainConfig,
  CCIPReceiveEvent,
  CCIPConfiguration,
  CCIPError,
  InsufficientFundsError,
  UnsupportedChainError,
  MessageTimeoutError,
  CHAIN_SELECTORS,
  CCIP_ROUTER_ADDRESSES,
  CCIPMetrics,
  CCIPEventSubscription
} from '../types/ccip.js';

// CCIP Router ABI (simplified for essential functions)
const CCIP_ROUTER_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "destinationChainSelector",
        "type": "uint64"
      },
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "receiver",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "token",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
              }
            ],
            "internalType": "struct Client.EVMTokenAmount[]",
            "name": "tokenAmounts",
            "type": "tuple[]"
          },
          {
            "internalType": "address",
            "name": "feeToken",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "extraArgs",
            "type": "bytes"
          }
        ],
        "internalType": "struct Client.EVM2AnyMessage",
        "name": "message",
        "type": "tuple"
      }
    ],
    "name": "getFee",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "fee",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint64",
        "name": "destinationChainSelector",
        "type": "uint64"
      },
      {
        "components": [
          {
            "internalType": "bytes",
            "name": "receiver",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "data",
            "type": "bytes"
          },
          {
            "components": [
              {
                "internalType": "address",
                "name": "token",
                "type": "address"
              },
              {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
              }
            ],
            "internalType": "struct Client.EVMTokenAmount[]",
            "name": "tokenAmounts",
            "type": "tuple[]"
          },
          {
            "internalType": "address",
            "name": "feeToken",
            "type": "address"
          },
          {
            "internalType": "bytes",
            "name": "extraArgs",
            "type": "bytes"
          }
        ],
        "internalType": "struct Client.EVM2AnyMessage",
        "name": "message",
        "type": "tuple"
      }
    ],
    "name": "ccipSend",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "messageId",
        "type": "bytes32"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "messageId",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "destinationChainSelector",
        "type": "uint64"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "receiver",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "bytes",
        "name": "data",
        "type": "bytes"
      },
      {
        "components": [
          {
            "internalType": "address",
            "name": "token",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "amount",
            "type": "uint256"
          }
        ],
        "indexed": false,
        "internalType": "struct Client.EVMTokenAmount[]",
        "name": "tokenAmounts",
        "type": "tuple[]"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "feeToken",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "fees",
        "type": "uint256"
      }
    ],
    "name": "CCIPSendRequested",
    "type": "event"
  }
];

export class ChainlinkCCIPProvider implements CCIPProvider {
  private readonly logger: winston.Logger;
  private readonly config: CCIPConfiguration;
  private readonly providers: Map<string, JsonRpcProvider> = new Map();
  private readonly wallets: Map<string, Wallet> = new Map();
  private readonly contracts: Map<string, Contract> = new Map();
  private readonly eventSubscriptions: Map<string, CCIPEventSubscription> = new Map();
  private metrics: CCIPMetrics;

  constructor(config: CCIPConfiguration) {
    this.config = config;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'ccip-provider.log' })
      ]
    });

    this.metrics = {
      totalMessagesSent: 0,
      totalMessagesReceived: 0,
      successRate: 0,
      averageProcessingTime: 0,
      totalFeesSpent: '0',
      totalVolumeTransferred: '0',
      activeSubscriptions: 0,
      lastUpdated: Date.now()
    };

    this.initializeProviders();
  }

  private initializeProviders(): void {
    for (const [chainName, chainConfig] of Object.entries(this.config.chains)) {
      try {
        // Initialize provider
        const provider = new JsonRpcProvider(chainConfig.rpcUrl);
        this.providers.set(chainConfig.chainSelector, provider);

        // Initialize wallet if private key is available
        const privateKey = process.env[`${chainName.toUpperCase()}_PRIVATE_KEY`];
        if (privateKey) {
          const wallet = new Wallet(privateKey, provider);
          this.wallets.set(chainConfig.chainSelector, wallet);
        }

        // Initialize CCIP Router contract
        const routerContract = new Contract(
          chainConfig.routerAddress,
          CCIP_ROUTER_ABI,
          provider
        );
        this.contracts.set(chainConfig.chainSelector, routerContract);

        this.logger.info(`Initialized CCIP provider for ${chainName}`, {
          chainSelector: chainConfig.chainSelector,
          routerAddress: chainConfig.routerAddress
        });
      } catch (error) {
        this.logger.error(`Failed to initialize provider for ${chainName}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          chainConfig
        });
      }
    }
  }

  async sendMessage(request: CCIPSendRequest): Promise<string> {
    const startTime = Date.now();
    
    try {
      this.logger.info('Sending CCIP message', { request });

      // Validate request
      await this.validateSendRequest(request);

      // Get source chain configuration
      const sourceChain = this.getChainBySelector(request.message.feeToken);
      const wallet = this.wallets.get(sourceChain.chainSelector);
      if (!wallet) {
        throw new CCIPError('No wallet configured for source chain', 'NO_WALLET', sourceChain.chainSelector);
      }

      const routerContract = this.contracts.get(sourceChain.chainSelector);
      if (!routerContract) {
        throw new CCIPError('No router contract for source chain', 'NO_CONTRACT', sourceChain.chainSelector);
      }

      // Connect wallet to contract
      const contractWithSigner = routerContract.connect(wallet);

      // Estimate fees
      const feeEstimate = await this.estimateFees(request);
      
      // Check balance
      await this.checkBalance(wallet, request.message.feeToken, feeEstimate.linkFee);

      // Prepare message for contract call
      const ccipMessage = {
        receiver: ethers.getBytes(request.message.receiver),
        data: ethers.getBytes(request.message.data),
        tokenAmounts: request.message.tokenAmounts?.map(ta => ({
          token: ta.token,
          amount: ethers.parseUnits(ta.amount, 18)
        })) || [],
        feeToken: request.message.feeToken,
        extraArgs: request.message.gasLimit 
          ? ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [request.message.gasLimit])
          : '0x'
      };

      // Send transaction
      const tx = await contractWithSigner.ccipSend(
        request.destinationChainSelector,
        ccipMessage,
        {
          value: request.message.feeToken === ethers.ZeroAddress ? feeEstimate.nativeFee : 0
        }
      );

      const receipt = await tx.wait();
      const messageId = this.extractMessageIdFromReceipt(receipt);

      // Update metrics
      this.metrics.totalMessagesSent++;
      this.metrics.totalFeesSpent = (
        BigInt(this.metrics.totalFeesSpent) + BigInt(feeEstimate.linkFee)
      ).toString();
      this.metrics.averageProcessingTime = 
        (this.metrics.averageProcessingTime + (Date.now() - startTime)) / 2;
      this.metrics.lastUpdated = Date.now();

      this.logger.info('CCIP message sent successfully', {
        messageId,
        transactionHash: tx.hash,
        gasUsed: receipt?.gasUsed?.toString(),
        processingTime: Date.now() - startTime
      });

      return messageId;

    } catch (error) {
      this.logger.error('Failed to send CCIP message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request,
        processingTime: Date.now() - startTime
      });

      if (error instanceof CCIPError) {
        throw error;
      }

      throw new CCIPError(
        `Failed to send CCIP message: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SEND_FAILED'
      );
    }
  }

  async getMessageStatus(messageId: string): Promise<CCIPMessageStatus> {
    try {
      this.logger.info('Getting message status', { messageId });

      // This would typically involve querying the CCIP explorer API or monitoring contracts
      // For now, we'll implement a basic status check
      
      // In a real implementation, you would:
      // 1. Query the source chain for the send transaction
      // 2. Check CCIP explorer for message status
      // 3. Query destination chain for execution status

      return {
        messageId,
        status: 'pending',
        sourceTransactionHash: '', // Would be populated from actual query
        timestamp: Date.now()
      };

    } catch (error) {
      this.logger.error('Failed to get message status', {
        error: error instanceof Error ? error.message : 'Unknown error',
        messageId
      });

      throw new CCIPError(
        `Failed to get message status: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STATUS_FAILED',
        undefined,
        messageId
      );
    }
  }

  async estimateFees(request: CCIPSendRequest): Promise<CCIPFeeEstimate> {
    try {
      this.logger.info('Estimating CCIP fees', { request });

      const sourceChain = this.getChainBySelector(request.message.feeToken);
      const routerContract = this.contracts.get(sourceChain.chainSelector);
      
      if (!routerContract) {
        throw new CCIPError('No router contract for source chain', 'NO_CONTRACT', sourceChain.chainSelector);
      }

      const ccipMessage = {
        receiver: ethers.getBytes(request.message.receiver),
        data: ethers.getBytes(request.message.data),
        tokenAmounts: request.message.tokenAmounts?.map(ta => ({
          token: ta.token,
          amount: ethers.parseUnits(ta.amount, 18)
        })) || [],
        feeToken: request.message.feeToken,
        extraArgs: request.message.gasLimit 
          ? ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [request.message.gasLimit])
          : '0x'
      };

      const fee = await routerContract.getFee(
        request.destinationChainSelector,
        ccipMessage
      );

      const feeWithBuffer = (BigInt(fee) * BigInt(100 + this.config.feeBufferPercentage)) / BigInt(100);

      const estimate: CCIPFeeEstimate = {
        linkFee: request.message.feeToken !== ethers.ZeroAddress ? feeWithBuffer.toString() : '0',
        nativeFee: request.message.feeToken === ethers.ZeroAddress ? feeWithBuffer.toString() : '0',
        gasLimit: request.message.gasLimit || this.config.defaultGasLimit,
        gasPrice: '0', // Would be fetched from gas price oracle
        totalCostUSD: 0 // Would be calculated using price feeds
      };

      this.logger.info('Fee estimation completed', { estimate });
      return estimate;

    } catch (error) {
      this.logger.error('Failed to estimate fees', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request
      });

      throw new CCIPError(
        `Failed to estimate fees: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'FEE_ESTIMATION_FAILED'
      );
    }
  }

  async getSupportedChains(): Promise<ChainConfig[]> {
    return Object.values(this.config.chains);
  }

  subscribeToMessages(callback: (event: CCIPReceiveEvent) => void): void {
    const subscriptionId = `subscription_${Date.now()}_${Math.random()}`;
    
    this.logger.info('Setting up message subscription', { subscriptionId });

    for (const [chainSelector, provider] of this.providers.entries()) {
      const contract = this.contracts.get(chainSelector);
      if (!contract) continue;

      const eventFilter = contract.filters.CCIPSendRequested();
      
      const subscription: CCIPEventSubscription = {
        id: subscriptionId,
        chainSelector,
        eventType: 'CCIPSendRequested',
        callback: (event: any) => {
          const ccipEvent: CCIPReceiveEvent = {
            messageId: event.args.messageId,
            sourceChainSelector: chainSelector,
            sender: event.args.sender || '',
            data: event.args.data || '0x',
            tokenAmounts: event.args.tokenAmounts?.map((ta: any) => ({
              token: ta.token,
              amount: ta.amount.toString()
            })) || [],
            gasLimit: this.config.defaultGasLimit,
            blockNumber: event.blockNumber,
            transactionHash: event.transactionHash,
            timestamp: Date.now()
          };
          
          callback(ccipEvent);
        },
        isActive: true
      };

      this.eventSubscriptions.set(`${subscriptionId}_${chainSelector}`, subscription);

      contract.on(eventFilter, subscription.callback);
    }

    this.metrics.activeSubscriptions = this.eventSubscriptions.size;
    this.logger.info('Message subscription activated', { subscriptionId });
  }

  unsubscribeFromMessages(): void {
    this.logger.info('Unsubscribing from all message events');

    for (const [key, subscription] of this.eventSubscriptions.entries()) {
      if (subscription.isActive) {
        const contract = this.contracts.get(subscription.chainSelector);
        if (contract) {
          contract.removeAllListeners();
        }
        subscription.isActive = false;
      }
      this.eventSubscriptions.delete(key);
    }

    this.metrics.activeSubscriptions = 0;
    this.logger.info('All message subscriptions removed');
  }

  getMetrics(): CCIPMetrics {
    return { ...this.metrics };
  }

  private async validateSendRequest(request: CCIPSendRequest): Promise<void> {
    // Validate destination chain
    const destinationChain = this.getChainBySelector(request.destinationChainSelector);
    if (!destinationChain) {
      throw new UnsupportedChainError(request.destinationChainSelector);
    }

    // Validate receiver address
    if (!ethers.isAddress(request.message.receiver)) {
      throw new CCIPError('Invalid receiver address', 'INVALID_RECEIVER');
    }

    // Validate token amounts
    if (request.message.tokenAmounts) {
      for (const tokenAmount of request.message.tokenAmounts) {
        if (!ethers.isAddress(tokenAmount.token)) {
          throw new CCIPError('Invalid token address', 'INVALID_TOKEN');
        }
        if (BigInt(tokenAmount.amount) <= 0) {
          throw new CCIPError('Invalid token amount', 'INVALID_AMOUNT');
        }
      }
    }
  }

  private getChainBySelector(chainSelector: string): ChainConfig {
    const chain = Object.values(this.config.chains).find(c => c.chainSelector === chainSelector);
    if (!chain) {
      throw new UnsupportedChainError(chainSelector);
    }
    return chain;
  }

  private async checkBalance(wallet: Wallet, feeToken: string, requiredAmount: string): Promise<void> {
    if (feeToken === ethers.ZeroAddress) {
      // Check native token balance
      const balance = await wallet.provider.getBalance(wallet.address);
      if (balance < BigInt(requiredAmount)) {
        throw new InsufficientFundsError(requiredAmount, balance.toString(), 'ETH');
      }
    } else {
      // Check ERC20 token balance (simplified)
      // In a real implementation, you would use the ERC20 contract
      this.logger.warn('ERC20 balance check not implemented', { feeToken });
    }
  }

  private extractMessageIdFromReceipt(receipt: any): string {
    // Extract message ID from transaction receipt
    if (receipt?.logs) {
      for (const log of receipt.logs) {
        try {
          const parsed = this.contracts.get('default')?.interface.parseLog(log);
          if (parsed?.name === 'CCIPSendRequested') {
            return parsed.args.messageId;
          }
        } catch (error) {
          // Continue searching
        }
      }
    }
    
    // Fallback to transaction hash if message ID not found
    return receipt?.hash || `fallback_${Date.now()}`;
  }
} 