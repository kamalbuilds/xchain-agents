// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {VRFCoordinatorV2Interface} from "@chainlink/contracts/src/v0.8/vrf/interfaces/VRFCoordinatorV2Interface.sol";

/**
 * @title MockVRFCoordinator
 * @dev Mock VRF Coordinator for testing randomness functionality
 */
contract MockVRFCoordinator is VRFCoordinatorV2Interface {
    struct VRFRequest {
        bytes32 keyHash;
        uint64 subId;
        uint16 requestConfirmations;
        uint32 callbackGasLimit;
        uint32 numWords;
        address requester;
    }

    mapping(uint256 => VRFRequest) public requests;
    uint256 private requestCounter;

    event RandomWordsRequested(
        bytes32 indexed keyHash,
        uint256 requestId,
        uint256 preSeed,
        uint64 indexed subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords,
        address indexed sender
    );

    event RandomWordsFulfilled(uint256 indexed requestId, uint256 outputSeed, uint96 payment, bool success);

    /**
     * @dev Request random words
     */
    function requestRandomWords(
        bytes32 keyHash,
        uint64 subId,
        uint16 minimumRequestConfirmations,
        uint32 callbackGasLimit,
        uint32 numWords
    ) external override returns (uint256 requestId) {
        requestId = ++requestCounter;
        
        requests[requestId] = VRFRequest({
            keyHash: keyHash,
            subId: subId,
            requestConfirmations: minimumRequestConfirmations,
            callbackGasLimit: callbackGasLimit,
            numWords: numWords,
            requester: msg.sender
        });

        emit RandomWordsRequested(
            keyHash,
            requestId,
            uint256(keccak256(abi.encode(keyHash, requestId))),
            subId,
            minimumRequestConfirmations,
            callbackGasLimit,
            numWords,
            msg.sender
        );

        return requestId;
    }

    /**
     * @dev Fulfill random words request (for testing)
     */
    function fulfillRandomWords(uint256 requestId) external {
        VRFRequest memory request = requests[requestId];
        require(request.requester != address(0), "Request not found");

        // Generate mock random words
        uint256[] memory randomWords = new uint256[](request.numWords);
        for (uint32 i = 0; i < request.numWords; i++) {
            randomWords[i] = uint256(keccak256(abi.encode(requestId, i, block.timestamp)));
        }

        // Call the requester's fulfillRandomWords function
        (bool success,) = request.requester.call(
            abi.encodeWithSignature("fulfillRandomWords(uint256,uint256[])", requestId, randomWords)
        );

        emit RandomWordsFulfilled(requestId, randomWords[0], 0, success);
    }

    /**
     * @dev Create subscription (mock implementation)
     */
    function createSubscription() external override returns (uint64 subId) {
        return 1; // Mock subscription ID
    }

    /**
     * @dev Get subscription (mock implementation)
     */
    function getSubscription(uint64 subId) external pure override returns (
        uint96 balance,
        uint64 reqCount,
        address owner,
        address[] memory consumers
    ) {
        subId; // Silence unused variable warning
        balance = 1 ether;
        reqCount = 0;
        owner = address(0);
        consumers = new address[](0);
    }

    /**
     * @dev Request subscription owner transfer (mock implementation)
     */
    function requestSubscriptionOwnerTransfer(uint64 subId, address newOwner) external override {
        // Mock implementation - do nothing
        subId;
        newOwner;
    }

    /**
     * @dev Accept subscription owner transfer (mock implementation)
     */
    function acceptSubscriptionOwnerTransfer(uint64 subId) external override {
        // Mock implementation - do nothing
        subId;
    }

    /**
     * @dev Add consumer (mock implementation)
     */
    function addConsumer(uint64 subId, address consumer) external override {
        // Mock implementation - do nothing
        subId;
        consumer;
    }

    /**
     * @dev Remove consumer (mock implementation)
     */
    function removeConsumer(uint64 subId, address consumer) external override {
        // Mock implementation - do nothing
        subId;
        consumer;
    }

    /**
     * @dev Cancel subscription (mock implementation)
     */
    function cancelSubscription(uint64 subId, address to) external override {
        // Mock implementation - do nothing
        subId;
        to;
    }

    /**
     * @dev Pending request exists (mock implementation)
     */
    function pendingRequestExists(uint64 subId) external pure override returns (bool) {
        subId; // Silence unused variable warning
        return false;
    }

    /**
     * @dev Get request config (mock implementation)
     */
    function getRequestConfig() external pure override returns (uint16, uint32, bytes32[] memory) {
        bytes32[] memory keyHashes = new bytes32[](1);
        keyHashes[0] = 0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c;
        return (3, 100000, keyHashes);
    }
} 