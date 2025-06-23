import { ethers } from "hardhat";
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { Contract } from "ethers";
import dotenv from "dotenv";

dotenv.config();


// OpenAI API Key for testing AI predictions
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Test constants
export const TEST_CONSTANTS = {
  // Chainlink Functions
  DON_ID: "0x66756e2d657468657265756d2d7365706f6c69612d3100000000000000000000",
  SUBSCRIPTION_ID: 1,
  GAS_LIMIT: 300000,
  
  // VRF
  VRF_KEY_HASH: "0x474e34a077df58807dbe9c96d3c009b23b3c6d0cce433e59bbf5b34f823bc56c",
  VRF_SUBSCRIPTION_ID: 1,
  
  // CCIP Chain Selectors
  ETHEREUM_CHAIN_SELECTOR: "5009297550715157269",
  POLYGON_CHAIN_SELECTOR: "4051577828743386545",
  OPTIMISM_CHAIN_SELECTOR: "3734403246176062136",
  ARBITRUM_CHAIN_SELECTOR: "4949039107694359620",
  AVALANCHE_CHAIN_SELECTOR: "6433500567565415381",
  
  // Test market data
  TEST_MARKET_ID: "test-market-123",
  TEST_PRICE: ethers.parseEther("0.65"), // 65% probability
  TEST_VOLUME: ethers.parseEther("1000"),
  MIN_ARBITRAGE_PROFIT: ethers.parseEther("0.01"),
  
  // Fee tokens
  NATIVE_TOKEN: ethers.ZeroAddress,
};

// Mock contract addresses (will be replaced with actual deployments in tests)
export const MOCK_ADDRESSES = {
  ROUTER: "0x0000000000000000000000000000000000000001",
  LINK_TOKEN: "0x0000000000000000000000000000000000000002",
  FUNCTIONS_ORACLE: "0x0000000000000000000000000000000000000003",
  VRF_COORDINATOR: "0x0000000000000000000000000000000000000004",
  VERIFIER_PROXY: "0x0000000000000000000000000000000000000005",
  FEE_MANAGER: "0x0000000000000000000000000000000000000006",
};

export interface TestContracts {
  arbitrageCoordinator: Contract;
  dataStreams: Contract;
  linkToken: Contract;
  router: Contract;
  vrfCoordinator: Contract;
  functionsOracle: Contract;
}

export interface TestAccounts {
  owner: SignerWithAddress;
  agent1: SignerWithAddress;
  agent2: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
}

/**
 * Deploy mock LINK token for testing
 */
export async function deployMockLinkToken(): Promise<Contract> {
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const linkToken = await MockERC20.deploy("Chainlink Token", "LINK");
  await linkToken.waitForDeployment();
  
  // Mint test tokens to deployer
  const deployer = await ethers.provider.getSigner(0);
  await linkToken.mint(await deployer.getAddress(), ethers.parseEther("1000000"));
  
  return linkToken;
}

/**
 * Deploy mock CCIP Router for testing
 */
export async function deployMockCCIPRouter(): Promise<Contract> {
  const MockCCIPRouter = await ethers.getContractFactory("MockCCIPRouter");
  const router = await MockCCIPRouter.deploy();
  await router.waitForDeployment();
  return router;
}

/**
 * Deploy mock VRF Coordinator for testing
 */
export async function deployMockVRFCoordinator(): Promise<Contract> {
  const MockVRFCoordinator = await ethers.getContractFactory("MockVRFCoordinator");
  const vrfCoordinator = await MockVRFCoordinator.deploy();
  await vrfCoordinator.waitForDeployment();
  return vrfCoordinator;
}

/**
 * Deploy mock Functions Oracle for testing
 */
export async function deployMockFunctionsOracle(): Promise<Contract> {
  const MockFunctionsOracle = await ethers.getContractFactory("MockFunctionsOracle");
  const functionsOracle = await MockFunctionsOracle.deploy();
  await functionsOracle.waitForDeployment();
  return functionsOracle;
}

/**
 * Deploy all test contracts
 */
export async function deployTestContracts(): Promise<TestContracts> {
  // Deploy mock dependencies
  const linkToken = await deployMockLinkToken();
  const router = await deployMockCCIPRouter();
  const vrfCoordinator = await deployMockVRFCoordinator();
  const functionsOracle = await deployMockFunctionsOracle();
  
  // Deploy mock verifier and fee manager for Data Streams
  const MockVerifierProxy = await ethers.getContractFactory("MockVerifierProxy");
  const verifierProxy = await MockVerifierProxy.deploy();
  await verifierProxy.waitForDeployment();
  
  const MockFeeManager = await ethers.getContractFactory("MockFeeManager");
  const feeManager = await MockFeeManager.deploy();
  await feeManager.waitForDeployment();
  
  // Deploy ArbitrageCoordinator
  const ArbitrageCoordinatorFactory = await ethers.getContractFactory("ArbitrageCoordinator");
  const arbitrageCoordinator = await ArbitrageCoordinatorFactory.deploy(
    await router.getAddress(),
    await linkToken.getAddress(),
    await functionsOracle.getAddress(),
    TEST_CONSTANTS.DON_ID,
    TEST_CONSTANTS.SUBSCRIPTION_ID,
    await vrfCoordinator.getAddress(),
    TEST_CONSTANTS.VRF_KEY_HASH,
    TEST_CONSTANTS.VRF_SUBSCRIPTION_ID
  );
  await arbitrageCoordinator.waitForDeployment();
  
  // Deploy PredictionMarketDataStreams
  const DataStreamsFactory = await ethers.getContractFactory("PredictionMarketDataStreams");
  const dataStreams = await DataStreamsFactory.deploy(
    await verifierProxy.getAddress(),
    await feeManager.getAddress(),
    await linkToken.getAddress(),
    ethers.ZeroAddress, // native token
    ["0x1111", "0x2222"] // test feed IDs
  );
  await dataStreams.waitForDeployment();
  
  return {
    arbitrageCoordinator,
    dataStreams,
    linkToken,
    router,
    vrfCoordinator,
    functionsOracle,
  };
}

/**
 * Setup test accounts with proper roles
 */
export async function setupTestAccounts(): Promise<TestAccounts> {
  const [owner, agent1, agent2, user1, user2] = await ethers.getSigners();
  
  return {
    owner,
    agent1,
    agent2,
    user1,
    user2,
  };
}

/**
 * Setup agents with roles in contracts
 */
export async function setupAgents(
  contracts: TestContracts,
  accounts: TestAccounts
): Promise<void> {
  // Register agents in ArbitrageCoordinator
  await contracts.arbitrageCoordinator.registerAgent(
    accounts.agent1.address,
    "arbitrage-coordinator"
  );
  await contracts.arbitrageCoordinator.registerAgent(
    accounts.agent2.address,
    "market-intelligence"
  );
  
  // Authorize agents in DataStreams
  await contracts.dataStreams.authorizeAgent(
    accounts.agent1.address,
    "price-updater"
  );
  await contracts.dataStreams.authorizeAgent(
    accounts.agent2.address,
    "arbitrage-detector"
  );
}

/**
 * Fund contracts with LINK tokens for testing
 */
export async function fundContractsWithLink(
  contracts: TestContracts,
  amount: bigint = ethers.parseEther("100")
): Promise<void> {
  const linkAmount = amount;
  
  // Transfer LINK to contracts
  await contracts.linkToken.transfer(
    await contracts.arbitrageCoordinator.getAddress(),
    linkAmount
  );
  await contracts.linkToken.transfer(
    await contracts.dataStreams.getAddress(),
    linkAmount
  );
}

/**
 * Create mock Functions response for market data
 */
export function createMockMarketDataResponse(
  price: bigint = TEST_CONSTANTS.TEST_PRICE,
  volume: bigint = TEST_CONSTANTS.TEST_VOLUME,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  // Encode as (uint256 price, uint256 volume, uint256 timestamp)
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256"],
    [price, volume, timestamp]
  );
}

/**
 * Create mock Functions response for AI prediction
 */
export function createMockPredictionResponse(
  predictedPrice: bigint = ethers.parseEther("0.7"),
  confidence: bigint = ethers.parseEther("0.8"),
  timeHorizon: number = 24
): string {
  // Encode as (uint256 predictedPrice, uint256 confidence, uint256 timeHorizon)
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["uint256", "uint256", "uint256"],
    [predictedPrice, confidence, timeHorizon]
  );
}

/**
 * Create mock Data Streams report
 */
export function createMockDataStreamsReport(
  feedId: string = "0x1111",
  price: bigint = TEST_CONSTANTS.TEST_PRICE,
  volume: bigint = TEST_CONSTANTS.TEST_VOLUME,
  timestamp: number = Math.floor(Date.now() / 1000)
): string {
  // Mock report structure for Data Streams
  return ethers.AbiCoder.defaultAbiCoder().encode(
    ["bytes32", "uint32", "uint32", "uint192", "uint192", "uint32", "int192", "uint64"],
    [
      ethers.keccak256(ethers.toUtf8Bytes(feedId)), // feedId
      timestamp - 60, // validFromTimestamp
      timestamp, // observationsTimestamp
      0, // nativeFee
      0, // linkFee
      timestamp + 3600, // expiresAt
      price, // price
      volume, // volume
    ]
  );
}

/**
 * Advance time for testing time-dependent functionality
 */
export async function advanceTime(seconds: number): Promise<void> {
  await ethers.provider.send("evm_increaseTime", [seconds]);
  await ethers.provider.send("evm_mine", []);
}

/**
 * Expect events to be emitted with specific parameters
 */
export function expectEvent(
  tx: any,
  eventName: string,
  expectedArgs: any[] = []
): void {
  expect(tx).to.emit(tx.target, eventName);
  if (expectedArgs.length > 0) {
    expect(tx).to.emit(tx.target, eventName).withArgs(...expectedArgs);
  }
}

/**
 * Calculate arbitrage profit based on price difference
 */
export function calculateArbitrageProfit(
  buyPrice: bigint,
  sellPrice: bigint,
  volume: bigint
): bigint {
  if (sellPrice <= buyPrice) return 0n;
  
  const priceDiff = sellPrice - buyPrice;
  return (priceDiff * volume) / ethers.parseEther("1");
}

/**
 * Generate random market ID for testing
 */
export function generateRandomMarketId(): string {
  return `test-market-${Math.random().toString(36).substring(7)}`;
}

/**
 * Mock HTTP response for Functions testing
 */
export class MockHTTPResponse {
  constructor(
    public status: number,
    public data: any,
    public headers: Record<string, string> = {}
  ) {}
}

/**
 * Mock Functions.makeHttpRequest for testing
 */
export function mockFunctionsHttpRequest(
  url: string,
  response: MockHTTPResponse
): void {
  // This would be used in actual Functions script testing
  // For now, it's a placeholder for the testing infrastructure
}

export default {
  TEST_CONSTANTS,
  MOCK_ADDRESSES,
  OPENAI_API_KEY,
  deployTestContracts,
  setupTestAccounts,
  setupAgents,
  fundContractsWithLink,
  createMockMarketDataResponse,
  createMockPredictionResponse,
  createMockDataStreamsReport,
  advanceTime,
  expectEvent,
  calculateArbitrageProfit,
  generateRandomMarketId,
}; 