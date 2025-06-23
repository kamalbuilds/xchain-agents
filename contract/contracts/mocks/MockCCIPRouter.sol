// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IRouterClient} from "@chainlink/contracts-ccip/contracts/interfaces/IRouterClient.sol";
import {Client} from "@chainlink/contracts-ccip/contracts/libraries/Client.sol";

/**
 * @title MockCCIPRouter
 * @dev Mock CCIP Router for testing cross-chain functionality
 */
contract MockCCIPRouter is IRouterClient {
    struct SentMessage {
        uint64 destinationChainSelector;
        bytes receiver;
        bytes data;
        uint256 fee;
        bytes32 messageId;
        address feeToken;
    }

    mapping(bytes32 => SentMessage) public sentMessages;
    bytes32[] public messageIds;
    uint256 private messageCounter;

    // Events
    event MessageSent(
        bytes32 indexed messageId,
        uint64 indexed destinationChainSelector,
        address indexed receiver
    );

    /**
     * @dev Mock implementation of CCIP send
     */
    function ccipSend(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage calldata message
    ) external payable override returns (bytes32) {
        // Generate mock message ID
        bytes32 messageId = keccak256(
            abi.encodePacked(block.timestamp, messageCounter++, msg.sender)
        );

        // Calculate mock fee
        uint256 fee = getFee(destinationChainSelector, message);
        require(msg.value >= fee, "Insufficient fee");

        // Store sent message (without the problematic array fields)
        sentMessages[messageId] = SentMessage({
            destinationChainSelector: destinationChainSelector,
            receiver: message.receiver,
            data: message.data,
            fee: fee,
            messageId: messageId,
            feeToken: message.feeToken
        });
        messageIds.push(messageId);

        emit MessageSent(messageId, destinationChainSelector, abi.decode(message.receiver, (address)));

        return messageId;
    }

    /**
     * @dev Mock fee calculation
     */
    function getFee(
        uint64 destinationChainSelector,
        Client.EVM2AnyMessage memory message
    ) public pure override returns (uint256) {
        // Simple mock fee calculation
        uint256 baseFee = 0.01 ether;
        uint256 dataFee = message.data.length * 1000; // 1000 wei per byte
        
        // Different fees for different chains
        if (destinationChainSelector == 4051577828743386545) { // Polygon
            baseFee = 0.005 ether;
        } else if (destinationChainSelector == 3734403246176062136) { // Optimism
            baseFee = 0.003 ether;
        }
        
        return baseFee + dataFee;
    }

    /**
     * @dev Check if chain is supported
     */
    function isChainSupported(uint64 destChainSelector) external pure override returns (bool) {
        // Mock supported chains
        return destChainSelector == 5009297550715157269 || // Ethereum
               destChainSelector == 4051577828743386545 || // Polygon
               destChainSelector == 3734403246176062136 || // Optimism
               destChainSelector == 4949039107694359620 || // Arbitrum
               destChainSelector == 6433500567565415381;   // Avalanche
    }

    /**
     * @dev Get supported tokens for testing
     */
    function getSupportedTokens(uint64 destChainSelector) external pure returns (address[] memory) {
        address[] memory tokens = new address[](1);
        tokens[0] = address(0); // Native token
        return tokens;
    }

    /**
     * @dev Simulate message delivery to destination chain
     */
    function simulateMessageDelivery(bytes32 messageId, address targetContract) external {
        SentMessage memory sentMsg = sentMessages[messageId];
        require(sentMsg.messageId != bytes32(0), "Message not found");

        // Create empty token amounts array
        Client.EVMTokenAmount[] memory emptyTokenAmounts = new Client.EVMTokenAmount[](0);

        // Create the received message
        Client.Any2EVMMessage memory receivedMessage = Client.Any2EVMMessage({
            messageId: messageId,
            sourceChainSelector: 5009297550715157269, // Mock source chain
            sender: abi.encode(msg.sender),
            data: sentMsg.data,
            destTokenAmounts: emptyTokenAmounts
        });

        // Call the target contract's ccipReceive function
        (bool success,) = targetContract.call(
            abi.encodeWithSignature(
                "ccipReceive((bytes32,uint64,bytes,bytes,(address,uint256)[]))",
                receivedMessage
            )
        );
        require(success, "Failed to deliver message");
    }

    /**
     * @dev Get message count for testing
     */
    function getMessageCount() external view returns (uint256) {
        return messageIds.length;
    }

    /**
     * @dev Get message by index
     */
    function getMessageByIndex(uint256 index) external view returns (SentMessage memory) {
        require(index < messageIds.length, "Index out of bounds");
        return sentMessages[messageIds[index]];
    }
} 