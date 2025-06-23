// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockFunctionsOracle
 * @dev Mock Functions Oracle for testing Chainlink Functions functionality
 */
contract MockFunctionsOracle {
    struct FunctionsRequest {
        bytes32 requestId;
        address requester;
        uint64 subscriptionId;
        bytes data;
        uint32 gasLimit;
        bytes32 donId;
        uint256 timestamp;
    }

    mapping(bytes32 => FunctionsRequest) public requests;
    bytes32[] public requestIds;
    uint256 private requestCounter;

    event OracleRequest(
        bytes32 indexed requestId,
        address indexed requester,
        uint64 subscriptionId,
        bytes32 donId,
        bytes data
    );

    event OracleResponse(
        bytes32 indexed requestId,
        address indexed requester,
        bytes response,
        bytes err
    );

    /**
     * @dev Send request to the oracle (mock implementation)
     */
    function sendRequest(
        bytes32 donId,
        bytes calldata data,
        uint64 subscriptionId,
        uint32 gasLimit,
        address requester
    ) external returns (bytes32 requestId) {
        requestId = keccak256(abi.encodePacked(block.timestamp, requestCounter++, requester));
        
        requests[requestId] = FunctionsRequest({
            requestId: requestId,
            requester: requester,
            subscriptionId: subscriptionId,
            data: data,
            gasLimit: gasLimit,
            donId: donId,
            timestamp: block.timestamp
        });
        requestIds.push(requestId);

        emit OracleRequest(requestId, requester, subscriptionId, donId, data);
        
        return requestId;
    }

    /**
     * @dev Fulfill request with response (for testing)
     */
    function fulfillRequest(
        bytes32 requestId,
        bytes memory response,
        bytes memory err
    ) external {
        FunctionsRequest memory request = requests[requestId];
        require(request.requestId != bytes32(0), "Request not found");

        // Call the requester's fulfillRequest function
        (bool success,) = request.requester.call(
            abi.encodeWithSignature("fulfillRequest(bytes32,bytes,bytes)", requestId, response, err)
        );
        require(success, "Failed to fulfill request");

        emit OracleResponse(requestId, request.requester, response, err);
    }

    /**
     * @dev Get request by ID
     */
    function getRequest(bytes32 requestId) external view returns (FunctionsRequest memory) {
        return requests[requestId];
    }

    /**
     * @dev Get all request IDs
     */
    function getAllRequestIds() external view returns (bytes32[] memory) {
        return requestIds;
    }

    /**
     * @dev Get request count
     */
    function getRequestCount() external view returns (uint256) {
        return requestIds.length;
    }
} 