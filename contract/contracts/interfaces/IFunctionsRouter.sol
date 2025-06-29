// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFunctionsRouter {
    function sendRequest(
        uint64 subscriptionId,
        bytes calldata data,
        uint32 gasLimit,
        bytes32 donId
    ) external returns (bytes32);

    function estimateCost(
        uint64 subscriptionId,
        bytes calldata data,
        uint32 gasLimit,
        uint256 gasPrice
    ) external view returns (uint256);

    event RequestStart(
        bytes32 indexed requestId,
        bytes32 indexed donId,
        uint64 indexed subscriptionId,
        address subscriptionOwner,
        address requestingContract,
        address requestInitiator,
        bytes data,
        uint16 dataVersion,
        uint32 gasLimit,
        uint256 gasPrice
    );

    event ResponseReceived(
        bytes32 indexed requestId,
        address transmitter,
        uint8 errorCode,
        bytes response,
        bytes rawError
    );
} 