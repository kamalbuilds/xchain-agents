// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArbitrageCoordinatorNoVRF
 * @dev Simplified cross-chain arbitrage coordinator WITHOUT VRF
 * @notice Focuses on CCIP + Functions core functionality, avoiding uint64/uint256 VRF conflicts
 */
contract ArbitrageCoordinatorNoVRF is Ownable {
    using SafeERC20 for IERC20;

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
    
    // Chainlink Functions (ONLY Functions, NO VRF)
    bytes32 public donId;
    uint64 public subscriptionId;
    address public functionsOracle;
    mapping(bytes32 => AgentRequest) private pendingRequests;

    // CCIP Configuration
    address public ccipRouter;
    IERC20 public linkToken;
    mapping(uint64 => bool) public whitelistedDestinationChains;

    // Market & Agent Management
    mapping(string => MarketData) public markets;
    string[] public activeMarkets;
    mapping(address => bool) public authorizedAgents;
    mapping(string => ArbitrageOpportunity[]) public opportunities;

    // Scripts for Functions
    string private marketDataScript;
    string private predictionScript;

    // ============ EVENTS ============
    event MarketDataUpdated(string indexed marketId, uint256 price, uint256 volume);
    event ArbitrageOpportunityDetected(string indexed marketIdBuy, string indexed marketIdSell, uint256 expectedProfit);
    event AgentRequestCreated(bytes32 indexed requestId, address indexed agent, string requestType);
    event AgentRequestFulfilled(bytes32 indexed requestId, bool success);

    // ============ ERRORS ============
    error UnauthorizedAgent(address agent);
    error InvalidMarket(string marketId);
    error RequestNotFound(bytes32 requestId);

    // ============ MODIFIERS ============
    modifier onlyAuthorizedAgent() {
        if (!authorizedAgents[msg.sender]) revert UnauthorizedAgent(msg.sender);
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _ccipRouter,
        address _linkToken,
        address _functionsOracle,
        bytes32 _donId,
        uint64 _subscriptionId
    ) Ownable() {
        ccipRouter = _ccipRouter;
        linkToken = IERC20(_linkToken);
        functionsOracle = _functionsOracle;
        donId = _donId;
        subscriptionId = _subscriptionId;
    }

    // ============ FUNCTIONS SUBSCRIPTION MANAGEMENT ============
    
    /**
     * @dev Update Functions subscription ID (NO VRF subscription needed)
     */
    function updateFunctionsSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    /**
     * @dev Get current Functions subscription ID
     */
    function getFunctionsSubscriptionId() external view returns (uint64) {
        return subscriptionId;
    }

    // ============ AGENT MANAGEMENT ============
    
    function registerAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = true;
    }

    function removeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
    }

    // ============ SCRIPT MANAGEMENT ============
    
    function setMarketDataScript(string memory _script) external onlyOwner {
        marketDataScript = _script;
    }

    function setPredictionScript(string memory _script) external onlyOwner {
        predictionScript = _script;
    }

    // ============ CCIP MANAGEMENT ============
    
    function whitelistDestinationChain(uint64 chainSelector, bool allowed) external onlyOwner {
        whitelistedDestinationChains[chainSelector] = allowed;
    }

    // ============ CORE FUNCTIONS ============

    /**
     * @dev Request market data using Chainlink Functions
     */
    function requestMarketData(
        string memory marketId,
        uint256 chainId
    ) external onlyAuthorizedAgent returns (bytes32 requestId) {
        require(bytes(marketDataScript).length > 0, "Script not set");
        
        requestId = keccak256(abi.encodePacked(block.timestamp, msg.sender, marketId));
        
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
        require(bytes(predictionScript).length > 0, "Script not set");
        
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
     * @dev Fulfill request (for testing/external integration)
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

        emit MarketDataUpdated(marketId, price, volume);
        _checkArbitrageOpportunities(marketId);
    }

    /**
     * @dev Check for arbitrage opportunities
     */
    function _checkArbitrageOpportunities(string memory updatedMarketId) internal {
        MarketData memory updatedMarket = markets[updatedMarketId];
        
        for (uint i = 0; i < activeMarkets.length; i++) {
            string memory compareMarketId = activeMarkets[i];
            if (keccak256(bytes(compareMarketId)) == keccak256(bytes(updatedMarketId))) continue;
            
            MarketData memory compareMarket = markets[compareMarketId];
            if (!compareMarket.isActive || compareMarket.chainId == updatedMarket.chainId) continue;
            
            // Simple arbitrage detection
            if (updatedMarket.price < compareMarket.price) {
                uint256 priceDiff = compareMarket.price - updatedMarket.price;
                uint256 profitPercentage = (priceDiff * 10000) / updatedMarket.price;
                
                if (profitPercentage > 300) { // >3% profit threshold
                    ArbitrageOpportunity memory opportunity = ArbitrageOpportunity({
                        marketIdBuy: updatedMarketId,
                        marketIdSell: compareMarketId,
                        buyPrice: updatedMarket.price,
                        sellPrice: compareMarket.price,
                        expectedProfit: priceDiff,
                        positionSize: 1 ether, // Simplified position sizing
                        buyChainSelector: uint64(updatedMarket.chainId),
                        sellChainSelector: uint64(compareMarket.chainId),
                        timestamp: block.timestamp,
                        executed: false
                    });
                    
                    opportunities[updatedMarketId].push(opportunity);
                    emit ArbitrageOpportunityDetected(updatedMarketId, compareMarketId, priceDiff);
                }
            }
        }
    }

    // ============ VIEW FUNCTIONS ============

    function getMarketData(string memory marketId) external view returns (MarketData memory) {
        return markets[marketId];
    }

    function getActiveMarkets() external view returns (string[] memory) {
        return activeMarkets;
    }

    function getArbitrageOpportunities(string memory marketId) external view returns (ArbitrageOpportunity[] memory) {
        return opportunities[marketId];
    }

    function getScripts() external view onlyOwner returns (string memory, string memory) {
        return (marketDataScript, predictionScript);
    }

    // ============ EMERGENCY FUNCTIONS ============
    
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            IERC20(token).safeTransfer(owner(), amount);
        }
    }

    receive() external payable {}
} 