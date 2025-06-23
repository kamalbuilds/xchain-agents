import { SolanaAgentKit } from 'solana-agent-kit';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envPath = resolve(__dirname, '../../../.env');
console.log('Loading .env file from:', envPath);

// Load environment variables from the root .env file
const result = dotenv.config({ path: envPath });

// Get the private key, removing any newlines that might be present
const PRIVATE_KEY = (process.env.SOLANA_PRIVATE_KEY || process.env.WALLET_PRIVATE_KEY || '').replace(/\\n/g, '');
if (!PRIVATE_KEY) {
  throw new Error('No private key found in environment variables');
}

// Get the RPC URL
const RPC_URL = process.env.SOLANA_RPC_URL || process.env.RPC_URL || 'https://api.mainnet-beta.solana.com';

console.log('Environment variables loaded:');
console.log('Private Key length:', PRIVATE_KEY.length);
console.log('RPC URL:', RPC_URL);

async function main() {
  try {
    console.log('\nInitializing Solana Agent Kit...');
    const agent = new SolanaAgentKit(
      PRIVATE_KEY,
      RPC_URL
    );

    // Test 1: Check SOL balance
    console.log('\nTest 1: Checking SOL balance...');
    const balance = await agent.getBalance();
    console.log(`SOL Balance: ${balance}`);

    // Test 2: Get token balance for Jupiter
    console.log('\nTest 2: Fetching Jupiter token balance...');
    const jupiterMint = 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN';
    const jupiterBalance = await agent.getTokenBalance(jupiterMint);
    console.log('Jupiter Token Balance:', jupiterBalance);

    // Test 3: Get token balance for BONK
    console.log('\nTest 3: Fetching BONK token balance...');
    const bonkMint = 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263';
    const bonkBalance = await agent.getTokenBalance(bonkMint);
    console.log('BONK Token Balance:', bonkBalance);

  } catch (error) {
    console.error('\nError occurred:');
    console.error('Error message:', error.message);
    if (error.stack) {
      console.error('Error stack:', error.stack);
    }
    if (error.cause) {
      console.error('Error cause:', error.cause);
    }
  }
}

main();
