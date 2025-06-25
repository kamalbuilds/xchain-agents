// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FunctionsManager
 * @dev Library to manage Chainlink Functions JavaScript source code
 */
library FunctionsManager {
    
    /**
     * @dev Storage struct for Functions scripts
     */
    struct FunctionsStorage {
        string marketDataScript;
        string predictionScript;
        bytes encryptedSecrets;
    }
    
    /**
     * @dev Set the market data fetcher JavaScript source code
     */
    function setMarketDataScript(
        FunctionsStorage storage self,
        string memory _marketDataScript
    ) external {
        self.marketDataScript = _marketDataScript;
    }

    /**
     * @dev Set the AI prediction JavaScript source code
     */
    function setPredictionScript(
        FunctionsStorage storage self,
        string memory _predictionScript
    ) external {
        self.predictionScript = _predictionScript;
    }

    /**
     * @dev Set encrypted secrets for API keys
     */
    function setEncryptedSecrets(
        FunctionsStorage storage self,
        bytes memory _encryptedSecrets
    ) external {
        self.encryptedSecrets = _encryptedSecrets;
    }

    /**
     * @dev Get current JavaScript source codes
     */
    function getScripts(
        FunctionsStorage storage self
    ) external view returns (string memory marketData, string memory prediction) {
        return (self.marketDataScript, self.predictionScript);
    }

    /**
     * @dev Get market data script
     */
    function getMarketDataScript(
        FunctionsStorage storage self
    ) external view returns (string memory) {
        return self.marketDataScript;
    }

    /**
     * @dev Get prediction script
     */
    function getPredictionScript(
        FunctionsStorage storage self
    ) external view returns (string memory) {
        return self.predictionScript;
    }

    /**
     * @dev Get encrypted secrets
     */
    function getEncryptedSecrets(
        FunctionsStorage storage self
    ) external view returns (bytes memory) {
        return self.encryptedSecrets;
    }
} 