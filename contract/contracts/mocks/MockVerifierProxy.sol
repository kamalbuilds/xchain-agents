// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockVerifierProxy
 * @dev Mock Verifier Proxy for testing Data Streams functionality
 */
contract MockVerifierProxy {
    event ReportVerified(bytes report, address requester);

    /**
     * @dev Verify a single report (mock implementation)
     */
    function verify(
        bytes memory payload,
        bytes memory parameterPayload
    ) external payable returns (bytes memory verifierResponse) {
        // Mock verification - just return the payload as verified
        emit ReportVerified(payload, msg.sender);
        return payload;
    }

    /**
     * @dev Verify multiple reports (mock implementation)
     */
    function verifyBulk(
        bytes[] memory payloads,
        bytes memory parameterPayload
    ) external payable returns (bytes[] memory verifiedReports) {
        verifiedReports = new bytes[](payloads.length);
        for (uint i = 0; i < payloads.length; i++) {
            verifiedReports[i] = payloads[i];
            emit ReportVerified(payloads[i], msg.sender);
        }
        return verifiedReports;
    }
}

/**
 * @title MockFeeManager
 * @dev Mock Fee Manager for testing Data Streams functionality
 */
contract MockFeeManager {
    event FeeProcessed(address subscriber, uint256 amount, address feeToken);

    /**
     * @dev Get fee and reward (mock implementation)
     */
    function getFeeAndReward(
        address subscriber,
        bytes memory unverifiedReport,
        address quoteAddress
    ) external pure returns (address, uint256, uint256) {
        // Mock fee calculation
        subscriber; // Silence unused variable warning
        unverifiedReport; // Silence unused variable warning
        
        uint256 fee = 0.001 ether; // Mock fee
        uint256 reward = 0; // No reward in mock
        
        return (quoteAddress, fee, reward);
    }

    /**
     * @dev Process fee (mock implementation)
     */
    function processFee(
        bytes32 poolId,
        bytes memory payload,
        address subscriber,
        uint256 amount,
        address feeAddress
    ) external {
        // Mock fee processing
        poolId; // Silence unused variable warning
        payload; // Silence unused variable warning
        
        emit FeeProcessed(subscriber, amount, feeAddress);
    }

    /**
     * @dev Process fee bulk (mock implementation)
     */
    function processFeeBulk(
        bytes32[] memory poolIds,
        bytes[] memory payloads,
        address subscriber,
        uint256 amount,
        address feeAddress
    ) external {
        // Mock bulk fee processing
        poolIds; // Silence unused variable warning
        payloads; // Silence unused variable warning
        
        emit FeeProcessed(subscriber, amount, feeAddress);
    }
} 