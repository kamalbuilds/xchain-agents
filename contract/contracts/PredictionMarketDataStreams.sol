// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ILogAutomation, Log} from "@chainlink/contracts/src/v0.8/automation/interfaces/ILogAutomation.sol";
import {IRewardManager} from "@chainlink/contracts/src/v0.8/llo-feeds/v0.5.0/interfaces/IRewardManager.sol";
import {IVerifierFeeManager} from "@chainlink/contracts/src/v0.8/llo-feeds/v0.5.0/interfaces/IVerifierFeeManager.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// Interfaces for Data Streams
interface IFeeManager {
    function getFeeAndReward(
        address subscriber,
        bytes memory unverifiedReport,
        address quoteAddress
    ) external returns (address, uint256, uint256);

    function processFee(
        bytes32 poolId,
        bytes memory payload,
        address subscriber,
        uint256 amount,
        address feeAddress
    ) external;

    function processFeeBulk(
        bytes32[] memory poolIds,
        bytes[] memory payloads,
        address subscriber,
        uint256 amount,
        address feeAddress
    ) external;
}

interface IVerifierProxy {
    function verify(
        bytes memory payload,
        bytes memory parameterPayload
    ) external payable returns (bytes memory verifierResponse);

    function verifyBulk(
        bytes[] memory payloads,
        bytes memory parameterPayload
    ) external payable returns (bytes[] memory verifiedReports);
}

/**
 * @title PredictionMarketDataStreams
 * @dev Consumes Chainlink Data Streams for real-time prediction market price feeds
 * @notice Based on patterns from DataStreamsConsumer.sol in datastreams-demo
 * Integrates with prediction market data for arbitrage opportunities
 */
contract PredictionMarketDataStreams is ILogAutomation, Ownable {
    using SafeERC20 for IERC20;

    // ============ CONSTANTS ============
    string public constant STRING_DATASTREAMS_FEEDLABEL = "feedIDs";
    string public constant STRING_DATASTREAMS_QUERYLABEL = "timestamp";
    uint256 private constant MAX_INT = 2**256 - 1;

    // ============ STATE VARIABLES ============
    
    // Data Streams configuration
    IVerifierProxy public immutable i_verifier;
    IFeeManager public immutable i_feeManager;
    address public immutable i_link;
    address public immutable i_native;

    // Feed configuration
    string[] public s_feedsHex;
    mapping(bytes32 => bool) public s_validFeedIds;
    
    // Market data storage
    struct MarketPrice {
        int256 price;
        uint256 timestamp;
        uint256 blocknumberOfUpdate;
        bytes32 feedId;
        uint256 volume;
        bool isActive;
    }
    
    mapping(bytes32 => MarketPrice) public s_marketPrices;
    bytes32[] public s_activeFeedIds;
    
    // Automation configuration
    bytes32 public s_lastUpkeepTimeStamp;
    uint256 public s_upkeepInterval = 60; // 1 minute default
    uint256 public s_counter;
    
    // Agent authorization
    mapping(address => bool) public authorizedAgents;
    mapping(address => string) public agentRoles;
    
    // Arbitrage tracking
    struct ArbitrageAlert {
        bytes32 feedId1;
        bytes32 feedId2;
        int256 priceDiff;
        uint256 timestamp;
        uint256 profitPotential;
        bool processed;
    }
    
    ArbitrageAlert[] public arbitrageAlerts;
    uint256 public arbitrageThreshold = 300; // 3% price difference threshold

    // ============ EVENTS ============
    event MarketPriceUpdated(
        bytes32 indexed feedId,
        int256 price,
        uint256 timestamp,
        uint256 volume
    );
    event ArbitrageOpportunityDetected(
        bytes32 indexed feedId1,
        bytes32 indexed feedId2,
        int256 priceDiff,
        uint256 profitPotential
    );
    event UpkeepPerformed(uint256 counter, uint256 timestamp);
    event AgentAuthorized(address indexed agent, string role);
    event FeedAdded(bytes32 indexed feedId);
    event FeedRemoved(bytes32 indexed feedId);

    // ============ ERRORS ============
    error UnauthorizedAgent(address agent);
    error InvalidFeedId(bytes32 feedId);
    error InsufficientFunds(uint256 required, uint256 available);
    error VerificationFailed();
    error StreamsLookupError(string feedParamKey, string[] feeds, string timeParamKey, uint256 time, bytes extraData);

    // ============ MODIFIERS ============
    modifier onlyAuthorizedAgent() {
        if (!authorizedAgents[msg.sender] && msg.sender != owner()) {
            revert UnauthorizedAgent(msg.sender);
        }
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address _verifier,
        address _feeManager,
        address _link,
        address _native,
        string[] memory _feedsHex
    ) {
        i_verifier = IVerifierProxy(_verifier);
        i_feeManager = IFeeManager(_feeManager);
        i_link = _link;
        i_native = _native;
        
        // Set up initial feeds
        _setFeeds(_feedsHex);
        
        // Approve max tokens for fee manager
        IERC20(i_link).approve(address(i_feeManager), MAX_INT);
    }

    // ============ FEED MANAGEMENT ============

    /**
     * @dev Set the feeds for data streams
     */
    function setFeeds(string[] memory _feedsHex) external onlyOwner {
        _setFeeds(_feedsHex);
    }

    /**
     * @dev Internal function to set feeds
     */
    function _setFeeds(string[] memory _feedsHex) internal {
        // Clear existing feeds
        for (uint i = 0; i < s_activeFeedIds.length; i++) {
            s_validFeedIds[s_activeFeedIds[i]] = false;
        }
        delete s_activeFeedIds;
        s_feedsHex = _feedsHex;
        
        // Add new feeds
        for (uint i = 0; i < _feedsHex.length; i++) {
            bytes32 feedId = bytes32(abi.encodePacked(_feedsHex[i]));
            s_validFeedIds[feedId] = true;
            s_activeFeedIds.push(feedId);
            emit FeedAdded(feedId);
        }
    }

    /**
     * @dev Add a single feed
     */
    function addFeed(string memory _feedHex) external onlyAuthorizedAgent {
        bytes32 feedId = bytes32(abi.encodePacked(_feedHex));
        require(!s_validFeedIds[feedId], "Feed already exists");
        
        s_feedsHex.push(_feedHex);
        s_validFeedIds[feedId] = true;
        s_activeFeedIds.push(feedId);
        
        emit FeedAdded(feedId);
    }

    // ============ AUTOMATION FUNCTIONS ============

    /**
     * @dev Check if upkeep is needed (Chainlink Automation)
     */
    function checkUpkeep(
        bytes calldata /* checkData */
    ) external view returns (bool upkeepNeeded, bytes memory performData) {
        upkeepNeeded = 
            (block.timestamp - uint256(s_lastUpkeepTimeStamp)) > s_upkeepInterval;
        performData = abi.encode(block.timestamp);
    }

    /**
     * @dev Perform upkeep (Chainlink Automation)
     */
    function performUpkeep(bytes calldata performData) external {
        uint256 timestamp = abi.decode(performData, (uint256));
        
        // Update the counter and timestamp
        s_counter++;
        s_lastUpkeepTimeStamp = bytes32(timestamp);
        
        emit UpkeepPerformed(s_counter, timestamp);
        
        // Trigger StreamsLookup for price updates
        revert StreamsLookupError(
            STRING_DATASTREAMS_FEEDLABEL,
            s_feedsHex,
            STRING_DATASTREAMS_QUERYLABEL,
            timestamp,
            abi.encode(timestamp)
        );
    }

    /**
     * @dev Check log for specific events that trigger data updates
     */
    function checkLog(
        Log calldata log,
        bytes memory /* checkData */
    ) external pure returns (bool upkeepNeeded, bytes memory performData) {
        // Check for relevant events that should trigger price updates
        upkeepNeeded = true;
        performData = abi.encode(log.timestamp);
    }

    /**
     * @dev Perform log-triggered upkeep
     */
    function performUpkeep(Log calldata log, bytes calldata performData) external {
        uint256 timestamp = abi.decode(performData, (uint256));
        
        // Update counter and use timestamp
        s_counter++;
        s_lastUpkeepTimeStamp = bytes32(timestamp);
        
        // Trigger StreamsLookup for the specific log event
        revert StreamsLookupError(
            STRING_DATASTREAMS_FEEDLABEL,
            s_feedsHex,
            STRING_DATASTREAMS_QUERYLABEL,
            log.timestamp,
            log.data
        );
    }

    // ============ DATA STREAMS FUNCTIONS ============

    /**
     * @dev Callback function for Data Streams lookup
     */
    function checkCallback(
        bytes[] memory values,
        bytes memory extraData
    ) external pure returns (bool, bytes memory) {
        // Process the returned data streams values
        return (true, abi.encode(values, extraData));
    }

    /**
     * @dev Update market prices using verified reports
     */
    function updatePricesWithVerifiedReports(
        bytes[] memory reports
    ) external onlyAuthorizedAgent {
        for (uint i = 0; i < reports.length; i++) {
            _updatePrice(reports[i]);
        }
        
        // Check for arbitrage opportunities after price updates
        _checkArbitrageOpportunities();
    }

    /**
     * @dev Manual price update with native token fee
     */
    function updatePriceNative(
        bytes memory unverifiedReport
    ) external payable onlyAuthorizedAgent {
        // Get fee and reward info
        (address feeTokenAddress, uint256 amount, ) = i_feeManager.getFeeAndReward(
            address(this),
            unverifiedReport,
            i_native
        );
        
        // Check if fee is paid
        if (feeTokenAddress == i_native && amount > 0) {
            require(msg.value >= amount, "Insufficient native token fee");
        }
        
        // Verify and process report
        bytes memory verifiedReport = i_verifier.verify{value: amount}(
            unverifiedReport,
            abi.encode(i_native)
        );
        
        _updatePrice(verifiedReport);
        _checkArbitrageOpportunities();
    }

    /**
     * @dev Internal function to update price from verified report
     */
    function _updatePrice(bytes memory verifiedReport) internal {
        // Decode the verified report
        // This follows the Data Streams report format
        (
            bytes32 feedId,
            uint32 _validFromTimestamp,
            uint32 observationsTimestamp,
            uint192 _nativeFee,
            uint192 _linkFee,
            uint32 _expiresAt,
            int192 price,
            uint64 volume // Custom field for prediction markets
        ) = abi.decode(
            verifiedReport,
            (bytes32, uint32, uint32, uint192, uint192, uint32, int192, uint64)
        );
        
        // Validate feed ID
        if (!s_validFeedIds[feedId]) {
            revert InvalidFeedId(feedId);
        }
        
        // Update price data
        s_marketPrices[feedId] = MarketPrice({
            price: int256(price),
            timestamp: observationsTimestamp,
            blocknumberOfUpdate: block.number,
            feedId: feedId,
            volume: uint256(volume),
            isActive: true
        });
        
        emit MarketPriceUpdated(feedId, int256(price), observationsTimestamp, uint256(volume));
    }

    // ============ ARBITRAGE DETECTION ============

    /**
     * @dev Check for arbitrage opportunities across feeds
     */
    function _checkArbitrageOpportunities() internal {
        for (uint i = 0; i < s_activeFeedIds.length; i++) {
            for (uint j = i + 1; j < s_activeFeedIds.length; j++) {
                bytes32 feedId1 = s_activeFeedIds[i];
                bytes32 feedId2 = s_activeFeedIds[j];
                
                MarketPrice memory price1 = s_marketPrices[feedId1];
                MarketPrice memory price2 = s_marketPrices[feedId2];
                
                if (!price1.isActive || !price2.isActive) continue;
                
                // Calculate price difference percentage
                int256 priceDiff = price1.price > price2.price 
                    ? price1.price - price2.price 
                    : price2.price - price1.price;
                
                uint256 priceDiffPercentage = uint256(priceDiff * 10000) / 
                    uint256(price1.price < price2.price ? price1.price : price2.price);
                
                if (priceDiffPercentage > arbitrageThreshold) {
                    // Calculate profit potential based on volume
                    uint256 profitPotential = (priceDiffPercentage * 
                        (price1.volume < price2.volume ? price1.volume : price2.volume)) / 10000;
                    
                    // Create arbitrage alert
                    arbitrageAlerts.push(ArbitrageAlert({
                        feedId1: feedId1,
                        feedId2: feedId2,
                        priceDiff: priceDiff,
                        timestamp: block.timestamp,
                        profitPotential: profitPotential,
                        processed: false
                    }));
                    
                    emit ArbitrageOpportunityDetected(feedId1, feedId2, priceDiff, profitPotential);
                }
            }
        }
    }

    /**
     * @dev Get unprocessed arbitrage opportunities
     */
    function getUnprocessedArbitrageAlerts() external view returns (ArbitrageAlert[] memory) {
        uint256 unprocessedCount = 0;
        
        // Count unprocessed alerts
        for (uint i = 0; i < arbitrageAlerts.length; i++) {
            if (!arbitrageAlerts[i].processed) {
                unprocessedCount++;
            }
        }
        
        // Create array of unprocessed alerts
        ArbitrageAlert[] memory unprocessed = new ArbitrageAlert[](unprocessedCount);
        uint256 index = 0;
        
        for (uint i = 0; i < arbitrageAlerts.length; i++) {
            if (!arbitrageAlerts[i].processed) {
                unprocessed[index] = arbitrageAlerts[i];
                index++;
            }
        }
        
        return unprocessed;
    }

    /**
     * @dev Mark arbitrage alert as processed
     */
    function markArbitrageProcessed(uint256 alertIndex) external onlyAuthorizedAgent {
        require(alertIndex < arbitrageAlerts.length, "Invalid alert index");
        arbitrageAlerts[alertIndex].processed = true;
    }

    // ============ AGENT MANAGEMENT ============

    /**
     * @dev Authorize an agent with specific role
     */
    function authorizeAgent(address agent, string memory role) external onlyOwner {
        authorizedAgents[agent] = true;
        agentRoles[agent] = role;
        emit AgentAuthorized(agent, role);
    }

    /**
     * @dev Remove agent authorization
     */
    function removeAgent(address agent) external onlyOwner {
        authorizedAgents[agent] = false;
        delete agentRoles[agent];
    }

    // ============ CONFIGURATION ============

    /**
     * @dev Set upkeep interval
     */
    function setUpkeepInterval(uint256 _interval) external onlyOwner {
        s_upkeepInterval = _interval;
    }

    /**
     * @dev Set arbitrage threshold
     */
    function setArbitrageThreshold(uint256 _threshold) external onlyOwner {
        arbitrageThreshold = _threshold;
    }

    // ============ VIEW FUNCTIONS ============

    /**
     * @dev Get latest price for a feed
     */
    function getLatestPrice(bytes32 feedId) external view returns (MarketPrice memory) {
        return s_marketPrices[feedId];
    }

    /**
     * @dev Get all active feed IDs
     */
    function getActiveFeedIds() external view returns (bytes32[] memory) {
        return s_activeFeedIds;
    }

    /**
     * @dev Get feed configuration
     */
    function getFeeds() external view returns (string[] memory) {
        return s_feedsHex;
    }

    /**
     * @dev Get arbitrage alert count
     */
    function getArbitrageAlertCount() external view returns (uint256) {
        return arbitrageAlerts.length;
    }

    // ============ WITHDRAWAL ============

    /**
     * @dev Withdraw LINK tokens
     */
    function withdrawLink(uint256 amount) external onlyOwner {
        IERC20(i_link).safeTransfer(owner(), amount);
    }

    /**
     * @dev Withdraw native tokens
     */
    function withdrawNative(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner()).transfer(amount);
    }

    /**
     * @dev Emergency withdrawal of any ERC20 token
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Receive function to accept native tokens
     */
    receive() external payable {}
} 