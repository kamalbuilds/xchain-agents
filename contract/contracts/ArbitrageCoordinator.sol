// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";
import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {OwnerIsCreator} from "@chainlink/contracts/src/v0.8/shared/access/OwnerIsCreator.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";
import {CCIPReceiver} from "@chainlink/contracts-ccip/contracts/applications/CCIPReceiver.sol";
import {AutomationCompatibleInterface} from "@chainlink/contracts/src/v0.8/automation/interfaces/AutomationCompatibleInterface.sol";
import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";
import {VRFConsumerBaseV2} from "@chainlink/contracts/src/v0.8/vrf/VRFConsumerBaseV2.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {FunctionsManager} from "./libraries/FunctionsManager.sol";

/**
 * @title ArbitrageCoordinator
 * @dev Central coordinator for cross-chain AI prediction market arbitrage
 * @notice Integrates multiple Chainlink services: Functions, CCIP, Automation, VRF
 * Based on patterns from Chainlink prediction-game and datastreams-demo
 */
contract ArbitrageCoordinator is
    FunctionsClient,
    CCIPReceiver,
    AutomationCompatibleInterface,
    VRFConsumerBaseV2,
    OwnerIsCreator
{
    using FunctionsRequest for FunctionsRequest.Request;
    using SafeERC20 for IERC20;
    using FunctionsManager for FunctionsManager.FunctionsStorage;

    // ============ CONSTANTS ============
    uint32 private constant GAS_LIMIT = 300000;
    uint256 private constant MIN_ARBITRAGE_PROFIT = 1e16; // 0.01 ETH minimum profit
    uint256 private constant MAX_POSITION_SIZE = 10 ether;
    uint256 private constant SLIPPAGE_TOLERANCE = 300; // 3%
    uint32 private constant VRF_CALLBACK_GAS_LIMIT = 100000;
    uint16 private constant VRF_REQUEST_CONFIRMATIONS = 3;
    uint32 private constant VRF_NUM_WORDS = 1;

    // ============ STRUCTS ============
    struct MarketData {
        string marketId;
        uint256 price;
        uint256 volume;
        uint256 timestamp;
        uint256 chainId;
        bool isActive;
    }

    struct ArbitrageOpportunity {
        string marketIdBuy;
        string marketIdSell;
        uint256 buyPrice;
        uint256 sellPrice;
        uint256 expectedProfit;
        uint256 positionSize;
        uint64 buyChainSelector;
        uint64 sellChainSelector;
        uint256 timestamp;
        bool executed;
    }

    struct CrossChainMessage {
        address sender;
        uint256 amount;
        string action;
        bytes data;
    }

    struct AgentRequest {
        bytes32 requestId;
        address agent;
        string requestType;
        bytes requestData;
        uint256 timestamp;
    }

    // ============ STATE VARIABLES ============
    
    // Chainlink Functions
    bytes32 public donId;
    uint64 public subscriptionId;
    FunctionsManager.FunctionsStorage private functionsStorage;
    mapping(bytes32 => AgentRequest) private pendingRequests;

    // CCIP
    mapping(uint64 => bool) public whitelistedDestinationChains;
    mapping(address => bool) public whitelistedSenders;
    IERC20 public linkToken;

    // VRF
    VRFCoordinatorV2Interface public vrfCoordinator;
    uint256 public vrfSubscriptionId;
    bytes32 public keyHash;
    mapping(uint256 => address) private vrfRequests;

    // Market Data
    mapping(string => MarketData) public markets;
    string[] public activeMarkets;
    mapping(string => ArbitrageOpportunity[]) public opportunities;
    
    // Agent Management
    mapping(address => bool) public authorizedAgents;
    mapping(address => string) public agentRoles;
    
    // Risk Management
    uint256 public totalAllocatedFunds;
    uint256 public maxTotalExposure;
    mapping(string => uint256) public marketExposure;
    
    // Performance Tracking
    uint256 public totalTrades;
    uint256 public totalProfit;
    uint256 public totalLoss;

    // ============ EVENTS ============
    event MarketDataUpdated(string indexed marketId, uint256 price, uint256 volume, uint256 chainId);
    event ArbitrageOpportunityDetected(string indexed marketIdBuy, string indexed marketIdSell, uint256 expectedProfit);
    event ArbitrageExecuted(string indexed opportunityId, uint256 profit, bool success);
    event CrossChainMessageSent(uint64 indexed destinationChain, address indexed recipient, bytes32 messageId);
    event CrossChainMessageReceived(uint64 indexed sourceChain, address indexed sender, bytes data);
    event AgentRequestCreated(bytes32 indexed requestId, address indexed agent, string requestType);
    event AgentRequestFulfilled(bytes32 indexed requestId, bool success);
    event RandomnessRequested(uint256 indexed requestId, address indexed agent);
    event RandomnessFulfilled(uint256 indexed requestId, uint256 randomValue);

    // ============ ERRORS ============
    error UnauthorizedAgent(address agent);
    error InvalidMarket(string marketId);
    error InsufficientFunds(uint256 required, uint256 available);
    error ExposureLimitExceeded(string marketId, uint256 exposure);
    error InvalidChainSelector(uint64 chainSelector);
    error ArbitrageThresholdNotMet(uint256 profit, uint256 threshold);
    error RequestNotFound(bytes32 requestId);

    // ============ MODIFIERS ============
    modifier onlyAuthorizedAgent() {
        if (!authorizedAgents[msg.sender]) revert UnauthorizedAgent(msg.sender);
        _;
    }

    modifier validMarket(string memory marketId) {
        if (!markets[marketId].isActive) revert InvalidMarket(marketId);
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address router,
        address _linkToken,
        address functionsOracle,
        bytes32 _donId,
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint256 _vrfSubscriptionId
    ) 
        FunctionsClient(functionsOracle)
        CCIPReceiver(router)
        VRFConsumerBaseV2(_vrfCoordinator)
    {
        linkToken = IERC20(_linkToken);
        donId = _donId;
        subscriptionId = _subscriptionId;
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        keyHash = _keyHash;
        vrfSubscriptionId = _vrfSubscriptionId;
        maxTotalExposure = 100 ether; // Default max exposure
    }

    // ============ SUBSCRIPTION MANAGEMENT ============
    
    /**
     * @dev Update Functions subscription ID
     */
    function updateFunctionsSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    /**
     * @dev Update VRF subscription ID
     */
    function updateVRFSubscriptionId(uint256 _vrfSubscriptionId) external onlyOwner {
        vrfSubscriptionId = _vrfSubscriptionId;
    }

    /**
     * @dev Get current subscription IDs
     */
    function getSubscriptionIds() external view returns (uint64 functionsSubId, uint256 vrfSubId) {
        return (subscriptionId, vrfSubscriptionId);
    }

    // ============ AGENT MANAGEMENT ============
    
    /**
     * @dev Register an authorized agent with specific role
     */
    function registerAgent(address agent, string memory role) external onlyOwner {
        authorizedAgents[agent] = true;
        agentRoles[agent] = role;
    }

    /**
     * @dev Remove agent authorization
     */
    function removeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        delete agentRoles[agent];
    }

    // ============ MARKET DATA FUNCTIONS ============

    /**
     * @dev Request market data update using Chainlink Functions
     */
    function requestMarketData(
        string memory marketId,
        uint256 chainId
    ) external onlyAuthorizedAgent returns (bytes32 requestId) {
        string[] memory args = new string[](2);
        args[0] = marketId;
        args[1] = uint2str(chainId);

        FunctionsRequest.Request memory req;
        req.initializeRequest(FunctionsRequest.Location.Inline, FunctionsRequest.CodeLanguage.JavaScript, functionsStorage.marketDataScript);
        if (functionsStorage.encryptedSecrets.length > 0) {
            req.addSecretsReference(functionsStorage.encryptedSecrets);
        }
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, GAS_LIMIT, donId);
        
        pendingRequests[requestId] = AgentRequest({
            requestId: requestId,
            agent: msg.sender,
            requestType: "market_data",
            requestData: abi.encode(marketId, chainId),
            timestamp: block.timestamp
        });

        emit AgentRequestCreated(requestId, msg.sender, "market_data");
    }

    /**
     * @dev Request AI prediction using Chainlink Functions
     */
    function requestPrediction(
        string memory marketId,
        uint256 timeHorizon
    ) external onlyAuthorizedAgent returns (bytes32 requestId) {
        string[] memory args = new string[](2);
        args[0] = marketId;
        args[1] = uint2str(timeHorizon);

        FunctionsRequest.Request memory req;
        req.initializeRequest(FunctionsRequest.Location.Inline, FunctionsRequest.CodeLanguage.JavaScript, functionsStorage.predictionScript);
        if (functionsStorage.encryptedSecrets.length > 0) {
            req.addSecretsReference(functionsStorage.encryptedSecrets);
        }
        req.setArgs(args);

        requestId = _sendRequest(req.encodeCBOR(), subscriptionId, GAS_LIMIT, donId);
        
        pendingRequests[requestId] = AgentRequest({
            requestId: requestId,
            agent: msg.sender,
            requestType: "prediction",
            requestData: abi.encode(marketId, timeHorizon),
            timestamp: block.timestamp
        });

        emit AgentRequestCreated(requestId, msg.sender, "prediction");
    }

    /**
     * @dev Fulfill Chainlink Functions request
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) internal override {
        AgentRequest memory request = pendingRequests[requestId];
        if (request.requestId == bytes32(0)) revert RequestNotFound(requestId);
        
        delete pendingRequests[requestId];

        if (err.length > 0) {
            emit AgentRequestFulfilled(requestId, false);
            return;
        }

        if (keccak256(bytes(request.requestType)) == keccak256(bytes("market_data"))) {
            _processMarketDataResponse(request, response);
        } else if (keccak256(bytes(request.requestType)) == keccak256(bytes("prediction"))) {
            _processPredictionResponse(request, response);
        }

        emit AgentRequestFulfilled(requestId, true);
    }

    /**
     * @dev Process market data response from Chainlink Functions
     */
    function _processMarketDataResponse(AgentRequest memory request, bytes memory response) internal {
        (string memory marketId, uint256 chainId) = abi.decode(request.requestData, (string, uint256));
        (uint256 price, uint256 volume, uint256 timestamp) = abi.decode(response, (uint256, uint256, uint256));
        
        markets[marketId] = MarketData({
            marketId: marketId,
            price: price,
            volume: volume,
            timestamp: timestamp,
            chainId: chainId,
            isActive: true
        });

        // Add to active markets if not already present
        bool exists = false;
        for (uint i = 0; i < activeMarkets.length; i++) {
            if (keccak256(bytes(activeMarkets[i])) == keccak256(bytes(marketId))) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            activeMarkets.push(marketId);
        }

        emit MarketDataUpdated(marketId, price, volume, chainId);
        
        // Check for arbitrage opportunities
        _checkArbitrageOpportunities(marketId);
    }

    /**
     * @dev Process prediction response from Chainlink Functions
     */
    function _processPredictionResponse(AgentRequest memory request, bytes memory response) internal {
        // Process AI prediction results
        // This could include price predictions, volatility forecasts, etc.
        (string memory marketId,) = abi.decode(request.requestData, (string, uint256));
        (uint256 predictedPrice, uint256 confidence, uint256 timeHorizon) = abi.decode(response, (uint256, uint256, uint256));
        
        // Store prediction data and trigger strategy adjustments
        // Implementation depends on specific prediction model outputs
    }

    // ============ ARBITRAGE FUNCTIONS ============

    /**
     * @dev Check for arbitrage opportunities across chains
     */
    function _checkArbitrageOpportunities(string memory updatedMarketId) internal {
        MarketData memory updatedMarket = markets[updatedMarketId];
        
        for (uint i = 0; i < activeMarkets.length; i++) {
            string memory compareMarketId = activeMarkets[i];
            if (keccak256(bytes(compareMarketId)) == keccak256(bytes(updatedMarketId))) continue;
            
            MarketData memory compareMarket = markets[compareMarketId];
            if (!compareMarket.isActive) continue;
            
            // Calculate potential arbitrage
            if (updatedMarket.price < compareMarket.price) {
                uint256 priceDiff = compareMarket.price - updatedMarket.price;
                uint256 profitPercentage = (priceDiff * 10000) / updatedMarket.price;
                
                if (profitPercentage > SLIPPAGE_TOLERANCE) {
                    uint256 positionSize = _calculateOptimalPositionSize(updatedMarketId, compareMarketId);
                    uint256 expectedProfit = (priceDiff * positionSize) / 1e18;
                    
                    if (expectedProfit > MIN_ARBITRAGE_PROFIT) {
                        ArbitrageOpportunity memory opportunity = ArbitrageOpportunity({
                            marketIdBuy: updatedMarketId,
                            marketIdSell: compareMarketId,
                            buyPrice: updatedMarket.price,
                            sellPrice: compareMarket.price,
                            expectedProfit: expectedProfit,
                            positionSize: positionSize,
                            buyChainSelector: uint64(updatedMarket.chainId),
                            sellChainSelector: uint64(compareMarket.chainId),
                            timestamp: block.timestamp,
                            executed: false
                        });
                        
                        opportunities[updatedMarketId].push(opportunity);
                        emit ArbitrageOpportunityDetected(updatedMarketId, compareMarketId, expectedProfit);
                    }
                }
            }
        }
    }

    /**
     * @dev Execute arbitrage opportunity
     */
    function executeArbitrage(
        string memory marketIdBuy,
        uint256 opportunityIndex
    ) external onlyAuthorizedAgent validMarket(marketIdBuy) {
        ArbitrageOpportunity storage opportunity = opportunities[marketIdBuy][opportunityIndex];
        require(!opportunity.executed, "Opportunity already executed");
        require(opportunity.timestamp + 300 > block.timestamp, "Opportunity expired"); // 5 min expiry
        
        // Check risk limits
        uint256 newExposure = marketExposure[marketIdBuy] + opportunity.positionSize;
        if (newExposure > maxTotalExposure / 10) revert ExposureLimitExceeded(marketIdBuy, newExposure);
        
        // Execute cross-chain arbitrage
        opportunity.executed = true;
        marketExposure[marketIdBuy] += opportunity.positionSize;
        totalAllocatedFunds += opportunity.positionSize;
        
        if (opportunity.buyChainSelector != opportunity.sellChainSelector) {
            _sendCrossChainArbitrageOrder(opportunity);
        } else {
            _executeSameChainArbitrage(opportunity);
        }
        
        totalTrades++;
        emit ArbitrageExecuted(marketIdBuy, opportunity.expectedProfit, true);
    }

    /**
     * @dev Calculate optimal position size for arbitrage
     */
    function _calculateOptimalPositionSize(
        string memory marketIdBuy,
        string memory marketIdSell
    ) internal view returns (uint256) {
        MarketData memory buyMarket = markets[marketIdBuy];
        MarketData memory sellMarket = markets[marketIdSell];
        
        // Use minimum of volumes and respect position limits
        uint256 maxByVolume = buyMarket.volume < sellMarket.volume ? buyMarket.volume : sellMarket.volume;
        uint256 maxByLimit = MAX_POSITION_SIZE;
        uint256 maxByExposure = maxTotalExposure / 10 - marketExposure[marketIdBuy];
        
        uint256 optimalSize = maxByVolume;
        if (optimalSize > maxByLimit) optimalSize = maxByLimit;
        if (optimalSize > maxByExposure) optimalSize = maxByExposure;
        
        return optimalSize;
    }

    // ============ CROSS-CHAIN FUNCTIONS ============

    /**
     * @dev Send cross-chain arbitrage order via CCIP
     */
    function _sendCrossChainArbitrageOrder(ArbitrageOpportunity memory opportunity) internal {
        if (!whitelistedDestinationChains[opportunity.sellChainSelector]) {
            revert InvalidChainSelector(opportunity.sellChainSelector);
        }
        
        CrossChainMessage memory message = CrossChainMessage({
            sender: address(this),
            amount: opportunity.positionSize,
            action: "arbitrage_sell",
            data: abi.encode(opportunity.marketIdSell, opportunity.sellPrice)
        });
        
        Client.EVM2AnyMessage memory evm2AnyMessage = Client.EVM2AnyMessage({
            receiver: abi.encode(address(this)), // Assuming same contract on destination
            data: abi.encode(message),
            tokenAmounts: new Client.EVMTokenAmount[](0),
            extraArgs: Client._argsToBytes(Client.EVMExtraArgsV1({gasLimit: 200_000})),
            feeToken: address(linkToken)
        });
        
        IRouterClient router = IRouterClient(this.getRouter());
        uint256 fees = router.getFee(opportunity.sellChainSelector, evm2AnyMessage);
        
        if (fees > linkToken.balanceOf(address(this))) {
            revert InsufficientFunds(fees, linkToken.balanceOf(address(this)));
        }
        
        linkToken.approve(address(router), fees);
        bytes32 messageId = router.ccipSend(opportunity.sellChainSelector, evm2AnyMessage);
        
        emit CrossChainMessageSent(opportunity.sellChainSelector, address(this), messageId);
    }

    /**
     * @dev Handle incoming cross-chain messages
     */
    function _ccipReceive(Client.Any2EVMMessage memory any2EvmMessage) internal override {
        CrossChainMessage memory message = abi.decode(any2EvmMessage.data, (CrossChainMessage));
        
        emit CrossChainMessageReceived(
            any2EvmMessage.sourceChainSelector,
            abi.decode(any2EvmMessage.sender, (address)),
            any2EvmMessage.data
        );
        
        // Process cross-chain arbitrage orders
        if (keccak256(bytes(message.action)) == keccak256(bytes("arbitrage_sell"))) {
            _processRemoteArbitrageOrder(message);
        }
    }

    /**
     * @dev Process arbitrage order from another chain
     */
    function _processRemoteArbitrageOrder(CrossChainMessage memory message) internal {
        // (string memory marketId, uint256 sellPrice) = abi.decode(message.data, (string, uint256));
        
        // Execute sell order on this chain
        // Implementation would integrate with specific DEX/prediction market
        // For now, we'll emit an event for the relevant agent to handle
        
        // Update exposure tracking
        if (marketExposure[""] >= message.amount) {
            marketExposure[""] -= message.amount;
            totalAllocatedFunds -= message.amount;
        }
    }

    /**
     * @dev Execute arbitrage on same chain
     */
    function _executeSameChainArbitrage(ArbitrageOpportunity memory opportunity) internal {
        // Implementation would integrate with DEX aggregators or prediction markets
        // This is a placeholder for the actual trading logic
    }

    // ============ VRF FUNCTIONS ============

    /**
     * @dev Request random number for strategy diversification
     */
    function requestRandomness() external onlyAuthorizedAgent returns (uint256 requestId) {
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            uint64(vrfSubscriptionId),
            VRF_REQUEST_CONFIRMATIONS,
            VRF_CALLBACK_GAS_LIMIT,
            VRF_NUM_WORDS
        );
        
        vrfRequests[requestId] = msg.sender;
        emit RandomnessRequested(requestId, msg.sender);
    }

    /**
     * @dev Fulfill VRF request
     */
    function fulfillRandomWords(uint256 requestId, uint256[] memory randomWords) internal override {
        // address requester = vrfRequests[requestId];
        delete vrfRequests[requestId];
        
        // Use randomness for strategy decisions (e.g., portfolio rebalancing, timing)
        uint256 randomValue = randomWords[0];
        
        emit RandomnessFulfilled(requestId, randomValue);
    }

    // ============ AUTOMATION FUNCTIONS ============

    /**
     * @dev Chainlink Automation check for maintenance tasks
     */
    function checkUpkeep(bytes memory) public view override returns (bool upkeepNeeded, bytes memory performData) {
        // Check for expired opportunities
        for (uint i = 0; i < activeMarkets.length; i++) {
            string memory marketId = activeMarkets[i];
            ArbitrageOpportunity[] memory marketOpportunities = opportunities[marketId];
            
            for (uint j = 0; j < marketOpportunities.length; j++) {
                if (!marketOpportunities[j].executed && 
                    marketOpportunities[j].timestamp + 300 < block.timestamp) {
                    upkeepNeeded = true;
                    performData = abi.encode("cleanup_expired", marketId, j);
                    return (upkeepNeeded, performData);
                }
            }
        }
        
        // Check for stale market data
        for (uint i = 0; i < activeMarkets.length; i++) {
            string memory marketId = activeMarkets[i];
            if (markets[marketId].timestamp + 3600 < block.timestamp) { // 1 hour stale
                upkeepNeeded = true;
                performData = abi.encode("refresh_market", marketId);
                return (upkeepNeeded, performData);
            }
        }
        
        return (false, "");
    }

    /**
     * @dev Perform upkeep tasks
     */
    function performUpkeep(bytes calldata performData) external override {
        (string memory action) = abi.decode(performData, (string));
        
        if (keccak256(bytes(action)) == keccak256(bytes("cleanup_expired"))) {
            (, string memory marketId, uint256 index) = abi.decode(performData, (string, string, uint256));
            _cleanupExpiredOpportunity(marketId, index);
        } else if (keccak256(bytes(action)) == keccak256(bytes("refresh_market"))) {
            (, string memory marketId) = abi.decode(performData, (string, string));
            _requestMarketRefresh(marketId);
        }
    }

    /**
     * @dev Cleanup expired arbitrage opportunity
     */
    function _cleanupExpiredOpportunity(string memory marketId, uint256 index) internal {
        ArbitrageOpportunity[] storage marketOpportunities = opportunities[marketId];
        if (index < marketOpportunities.length) {
            // Move last element to deleted spot and remove last element
            marketOpportunities[index] = marketOpportunities[marketOpportunities.length - 1];
            marketOpportunities.pop();
        }
    }

    /**
     * @dev Request market data refresh for stale markets
     */
    function _requestMarketRefresh(string memory marketId) internal {
        // MarketData memory market = markets[marketId];
        // This would trigger a new market data request
        // For now, we mark it as needing refresh
        markets[marketId].timestamp = block.timestamp - 3000; // Reset to slightly stale
    }

    // ============ CONFIGURATION FUNCTIONS ============

    /**
     * @dev Update Chainlink Functions scripts
     */
    function updateScripts(
        string memory _predictionScript,
        string memory _marketDataScript
    ) external onlyOwner {
        functionsStorage.predictionScript = _predictionScript;
        functionsStorage.marketDataScript = _marketDataScript;
    }

    /**
     * @dev Update encrypted secrets for Functions
     */
    function updateSecrets(bytes memory _encryptedSecrets) external onlyOwner {
        functionsStorage.encryptedSecrets = _encryptedSecrets;
    }

    /**
     * @dev Add whitelisted destination chain for CCIP
     */
    function allowlistDestinationChain(uint64 _destinationChainSelector, bool allowed) external onlyOwner {
        whitelistedDestinationChains[_destinationChainSelector] = allowed;
    }

    /**
     * @dev Update risk parameters
     */
    function updateRiskParameters(
        uint256 _maxTotalExposure
        // uint256 _minArbitrageProfit
    ) external onlyOwner {
        maxTotalExposure = _maxTotalExposure;
        // Update MIN_ARBITRAGE_PROFIT would require contract upgrade
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get active arbitrage opportunities for a market
     */
    function getArbitrageOpportunities(string memory marketId) 
        external 
        view 
        returns (ArbitrageOpportunity[] memory) 
    {
        return opportunities[marketId];
    }

    /**
     * @dev Get all active markets
     */
    function getActiveMarkets() external view returns (string[] memory) {
        return activeMarkets;
    }

    /**
     * @dev Get market data
     */
    function getMarketData(string memory marketId) external view returns (MarketData memory) {
        return markets[marketId];
    }

    /**
     * @dev Get contract performance metrics
     */
    function getPerformanceMetrics() external view returns (
        uint256 _totalTrades,
        uint256 _totalProfit,
        uint256 _totalLoss,
        uint256 _totalAllocatedFunds
    ) {
        return (totalTrades, totalProfit, totalLoss, totalAllocatedFunds);
    }

    // ============ UTILITY FUNCTIONS ============

    /**
     * @dev Convert uint to string
     */
    function uint2str(uint256 _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint256 j = _i;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }

    /**
     * @dev Emergency withdraw function
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    /**
     * @dev Receive function to accept ETH
     */
    receive() external payable {}

    // ============ FUNCTIONS SCRIPT MANAGEMENT ============
    
    /**
     * @dev Set the market data fetcher JavaScript source code
     */
    function setMarketDataScript(string memory _marketDataScript) external onlyOwner {
        functionsStorage.setMarketDataScript(_marketDataScript);
    }

    /**
     * @dev Set the AI prediction JavaScript source code
     */
    function setPredictionScript(string memory _predictionScript) external onlyOwner {
        functionsStorage.setPredictionScript(_predictionScript);
    }

    /**
     * @dev Set encrypted secrets for API keys
     */
    function setEncryptedSecrets(bytes memory _encryptedSecrets) external onlyOwner {
        functionsStorage.setEncryptedSecrets(_encryptedSecrets);
    }
    
    /**
     * @dev Get current JavaScript source codes (view only)
     */
    function getScripts() external view onlyOwner returns (string memory marketData, string memory prediction) {
        return functionsStorage.getScripts();
    }
} 