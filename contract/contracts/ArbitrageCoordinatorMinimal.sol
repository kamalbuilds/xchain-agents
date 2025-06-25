// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {FunctionsClient} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol";
import {FunctionsRequest} from "@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol";

/**
 * @title ArbitrageCoordinatorMinimal
 * @dev Gas-optimized version focusing only on Chainlink Functions integration
 */
contract ArbitrageCoordinatorMinimal is FunctionsClient {
    using FunctionsRequest for FunctionsRequest.Request;

    // ============ CONSTANTS ============
    uint32 private constant GAS_LIMIT = 300000;

    // ============ ENUMS ============
    enum RequestType { MarketData, Prediction }

    // ============ STRUCTS ============
    struct Agent {
        bool isActive;
        uint32 registeredAt; // Use uint32 for timestamps (sufficient until 2106)
    }

    // Simplified market data - removed struct, use events instead
    struct AgentRequest {
        RequestType requestType;
        address agent;
        bool fulfilled;
    }

    // ============ STATE VARIABLES ============
    address private owner;
    bytes32 private donId;
    uint64 private subscriptionId;
    
    // JavaScript source code for Functions
    string private marketDataScript;
    string private predictionScript;
    bytes private encryptedSecrets;

    // Agent management - simplified
    mapping(address => Agent) public authorizedAgents;
    
    // Request tracking - simplified
    mapping(bytes32 => AgentRequest) public requests;

    // ============ EVENTS ============
    event AgentRegistered(address indexed agent, string agentId);
    event AgentRequestCreated(string indexed requestId, RequestType requestType, address indexed agent);
    event AgentRequestFulfilled(string indexed requestId, bytes response);
    
    // Use events instead of storage for market data (much cheaper)
    event MarketDataUpdated(
        string indexed marketId, 
        uint256 price, 
        uint256 volume, 
        uint256 timestamp,
        uint256 chainId
    );
    
    event PredictionGenerated(
        string indexed marketId, 
        uint256 predictedPrice, 
        uint256 confidence,
        uint256 timeHorizon
    );
    
    event ScriptsUpdated(string scriptType);

    // ============ MODIFIERS ============
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyAuthorizedAgent() {
        require(authorizedAgents[msg.sender].isActive, "UnauthorizedAgent");
        _;
    }

    // ============ CONSTRUCTOR ============
    constructor(
        address functionsRouter,
        bytes32 _donId
    ) FunctionsClient(functionsRouter) {
        owner = msg.sender;
        donId = _donId;
        subscriptionId = 1; // Default, will be updated
    }

    // ============ ADMIN FUNCTIONS ============
    function setSubscriptionId(uint64 _subscriptionId) external onlyOwner {
        subscriptionId = _subscriptionId;
    }

    function getSubscriptionId() external view returns (uint64) {
        return subscriptionId;
    }

    function setMarketDataScript(string calldata _script) external onlyOwner {
        marketDataScript = _script;
        emit ScriptsUpdated("marketData");
    }

    function setPredictionScript(string calldata _script) external onlyOwner {
        predictionScript = _script;
        emit ScriptsUpdated("prediction");
    }

    function setEncryptedSecrets(bytes calldata _secrets) external onlyOwner {
        encryptedSecrets = _secrets;
    }

    function getScripts() external view returns (string memory, string memory) {
        return (marketDataScript, predictionScript);
    }

    // ============ AGENT MANAGEMENT ============
    function registerAgent(address agent, string calldata agentId) external onlyOwner {
        require(!authorizedAgents[agent].isActive, "Agent already registered");
        
        authorizedAgents[agent] = Agent({
            isActive: true,
            registeredAt: uint32(block.timestamp)
        });
        
        emit AgentRegistered(agent, agentId);
    }

    function deactivateAgent(address agent) external onlyOwner {
        authorizedAgents[agent].isActive = false;
    }

    // ============ FUNCTIONS REQUESTS ============
    function requestMarketData(string calldata marketId, uint256 chainId) external onlyAuthorizedAgent returns (string memory) {
        require(bytes(marketDataScript).length > 0, "Market data script not set");
        
        string memory requestId = _generateRequestId("market", marketId);
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(marketDataScript);
        
        string[] memory args = new string[](2);
        args[0] = marketId;
        args[1] = _uint256ToString(chainId);
        req.setArgs(args);
        
        if (encryptedSecrets.length > 0) {
            req.addSecretsReference(encryptedSecrets);
        }

        bytes32 functionsRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, GAS_LIMIT, donId);
        
        // Simplified request storage
        requests[functionsRequestId] = AgentRequest({
            requestType: RequestType.MarketData,
            agent: msg.sender,
            fulfilled: false
        });
        
        emit AgentRequestCreated(requestId, RequestType.MarketData, msg.sender);
        return requestId;
    }

    function requestPrediction(string calldata marketId, uint256 timeHorizon) external onlyAuthorizedAgent returns (string memory) {
        require(bytes(predictionScript).length > 0, "Prediction script not set");
        
        string memory requestId = _generateRequestId("prediction", marketId);
        
        FunctionsRequest.Request memory req;
        req.initializeRequestForInlineJavaScript(predictionScript);
        
        string[] memory args = new string[](2);
        args[0] = marketId;
        args[1] = _uint256ToString(timeHorizon);
        req.setArgs(args);
        
        if (encryptedSecrets.length > 0) {
            req.addSecretsReference(encryptedSecrets);
        }

        bytes32 functionsRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, GAS_LIMIT, donId);
        
        // Simplified request storage
        requests[functionsRequestId] = AgentRequest({
            requestType: RequestType.Prediction,
            agent: msg.sender,
            fulfilled: false
        });
        
        emit AgentRequestCreated(requestId, RequestType.Prediction, msg.sender);
        return requestId;
    }

    // ============ FUNCTIONS CALLBACK ============
    function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
        AgentRequest storage request = requests[requestId];
        require(!request.fulfilled, "Request already fulfilled");
        
        // Mark as fulfilled immediately to save gas
        request.fulfilled = true;
        
        if (err.length > 0) {
            return; // Exit early on error
        }
        
        // Generate request ID for event (simplified)
        string memory eventRequestId = _generateSimpleRequestId(requestId);
        
        if (request.requestType == RequestType.MarketData) {
            _processMarketDataResponse(eventRequestId, response);
        } else {
            _processPredictionResponse(eventRequestId, response);
        }
        
        emit AgentRequestFulfilled(eventRequestId, response);
    }

    function _processMarketDataResponse(string memory requestId, bytes memory response) internal {
        // Decode response directly without storing intermediate variables
        (uint256 price, uint256 volume, uint256 timestamp) = abi.decode(response, (uint256, uint256, uint256));
        
        // Use events instead of storage (much cheaper)
        emit MarketDataUpdated(requestId, price, volume, timestamp, block.chainid);
    }

    function _processPredictionResponse(string memory requestId, bytes memory response) internal {
        // Decode response directly
        (uint256 predictedPrice, uint256 confidence, uint256 timeHorizon) = abi.decode(response, (uint256, uint256, uint256));
        
        // Use events instead of storage (much cheaper)
        emit PredictionGenerated(requestId, predictedPrice, confidence, timeHorizon);
    }

    // ============ UTILITY FUNCTIONS ============
    function _generateRequestId(string memory prefix, string memory suffix) internal view returns (string memory) {
        return string(abi.encodePacked(prefix, "-", suffix, "-", _uint256ToString(block.timestamp)));
    }

    // Simplified request ID generation for events
    function _generateSimpleRequestId(bytes32 requestId) internal pure returns (string memory) {
        return _bytes32ToString(requestId);
    }

    function _uint256ToString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        
        return string(buffer);
    }

    function _bytes32ToString(bytes32 _bytes32) internal pure returns (string memory) {
        uint8 i = 0;
        bytes memory bytesArray = new bytes(64);
        for (i = 0; i < bytesArray.length; i++) {
            uint8 _f = uint8(_bytes32[i/2] & 0x0f);
            uint8 _l = uint8(_bytes32[i/2] >> 4);

            bytesArray[i] = _toBytes(_l);
            i = i + 1;
            bytesArray[i] = _toBytes(_f);
        }
        return string(bytesArray);
    }
    
    function _toBytes(uint8 _uint8) internal pure returns (bytes1) {
        if(_uint8 < 10) {
            return bytes1(_uint8 + 48);
        } else {
            return bytes1(_uint8 + 87);
        }
    }
} 