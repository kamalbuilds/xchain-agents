// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title ArbitrageCoordinatorUpgradeable
 * @dev Upgradeable version of the central coordinator for cross-chain AI prediction market arbitrage
 * @notice This contract uses OpenZeppelin's upgradeable pattern to overcome the 24KB contract size limit
 * Core functionality is separated into modules that can be upgraded independently
 */
contract ArbitrageCoordinatorUpgradeable is
    Initializable,
    OwnableUpgradeable,
    UUPSUpgradeable
{
    using SafeERC20 for IERC20;

    // ============ CONSTANTS ============
    uint32 private constant GAS_LIMIT = 300000;
    uint256 private constant MIN_ARBITRAGE_PROFIT = 1e16; // 0.01 ETH minimum profit
    uint256 private constant MAX_POSITION_SIZE = 10 ether;
    uint256 private constant SLIPPAGE_TOLERANCE = 300; // 3%

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
    string private marketDataScript;
    string private predictionScript;
    bytes private encryptedSecrets;
    mapping(bytes32 => AgentRequest) private pendingRequests;

    // CCIP
    mapping(uint64 => bool) public whitelistedDestinationChains;
    mapping(address => bool) public whitelistedSenders;
    IERC20 public linkToken;

    // VRF
    address public vrfCoordinator;
    uint64 public vrfSubscriptionId;
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

    // Chainlink service addresses
    address public functionsOracle;
    address public ccipRouter;

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
    event ScriptsUpdated(string scriptType);

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

    // ============ CONSTRUCTOR & INITIALIZER ============
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the upgradeable contract
     */
    function initialize(
        address router,
        address _linkToken,
        address _functionsOracle,
        bytes32 _donId,
        uint64 _subscriptionId,
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _vrfSubscriptionId
    ) public initializer {
        __Ownable_init();
        __UUPSUpgradeable_init();
        
        // Store addresses
        ccipRouter = router;
        functionsOracle = _functionsOracle;
        linkToken = IERC20(_linkToken);
        donId = _donId;
        subscriptionId = _subscriptionId;
        vrfCoordinator = _vrfCoordinator;
        keyHash = _keyHash;
        vrfSubscriptionId = _vrfSubscriptionId;
        maxTotalExposure = 100 ether; // Default max exposure
    }

    // ============ UPGRADE AUTHORIZATION ============
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

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
    function updateVRFSubscriptionId(uint64 _vrfSubscriptionId) external onlyOwner {
        vrfSubscriptionId = _vrfSubscriptionId;
    }

    /**
     * @dev Get current subscription IDs
     */
    function getSubscriptionIds() external view returns (uint64 functionsSubId, uint64 vrfSubId) {
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

    // ============ FUNCTIONS SCRIPT MANAGEMENT ============
    
    /**
     * @dev Set the market data fetcher JavaScript source code
     */
    function setMarketDataScript(string memory _marketDataScript) external onlyOwner {
        marketDataScript = _marketDataScript;
        emit ScriptsUpdated("marketData");
    }

    /**
     * @dev Set the AI prediction JavaScript source code
     */
    function setPredictionScript(string memory _predictionScript) external onlyOwner {
        predictionScript = _predictionScript;
        emit ScriptsUpdated("prediction");
    }

    /**
     * @dev Set encrypted secrets for API keys
     */
    function setEncryptedSecrets(bytes memory _encryptedSecrets) external onlyOwner {
        encryptedSecrets = _encryptedSecrets;
    }
    
    /**
     * @dev Get current JavaScript source codes (view only)
     */
    function getScripts() external view onlyOwner returns (string memory marketData, string memory prediction) {
        return (marketDataScript, predictionScript);
    }

    // ============ MARKET DATA FUNCTIONS ============

    /**
     * @dev Request market data update using Chainlink Functions
     */
    function requestMarketData(
        string memory marketId,
        uint256 chainId
    ) external onlyAuthorizedAgent returns (bytes32 requestId) {
        require(bytes(marketDataScript).length > 0, "Market data script not set");
        
        // Generate unique request ID
        requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender, marketId, chainId));
        
        pendingRequests[requestId] = AgentRequest({
            requestId: requestId,
            agent: msg.sender,
            requestType: "market_data",
            requestData: abi.encode(marketId, chainId),
            timestamp: block.timestamp
        });

        emit AgentRequestCreated(requestId, msg.sender, "market_data");
        
        // TODO: In production, this would call the actual Chainlink Functions oracle
        // For now, we emit the event to indicate the request was created
    }

    /**
     * @dev Request AI prediction using Chainlink Functions
     */
    function requestPrediction(
        string memory marketId,
        uint256 timeHorizon
    ) external onlyAuthorizedAgent returns (bytes32 requestId) {
        require(bytes(predictionScript).length > 0, "Prediction script not set");
        
        // Generate unique request ID
        requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender, marketId, timeHorizon));
        
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
     * @dev Manually fulfill request (for testing or external integration)
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external onlyOwner {
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
     * @dev Process market data response
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
     * @dev Process prediction response
     */
    function _processPredictionResponse(AgentRequest memory request, bytes memory response) internal {
        // Process AI prediction results
        (string memory marketId,) = abi.decode(request.requestData, (string, uint256));
        (uint256 predictedPrice, uint256 confidence, uint256 timeHorizon) = abi.decode(response, (uint256, uint256, uint256));
        
        // Store prediction data and trigger strategy adjustments
        // Implementation depends on specific prediction model outputs
        // For now, we just emit an event
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
} 