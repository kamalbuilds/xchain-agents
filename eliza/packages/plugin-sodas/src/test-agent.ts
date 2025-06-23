import { SolanaAgentKit } from 'solana-agent-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

// Load environment variables from the root .env file
dotenv.config({ path: resolve(__dirname, '../../../.env') });

const PRIVATE_KEY = process.env.PAYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error('PAYER_PRIVATE_KEY not found in environment variables');
}

async function main() {
  try {
    console.log('Initializing Solana Agent Kit...');
    const agent = new SolanaAgentKit(
      PRIVATE_KEY as string,
      'https://api.mainnet-beta.solana.com'
    );

    // Test 1: Check SOL balance
    console.log('\nTest 1: Checking SOL balance...');
    const balance = await agent.get_balance();
    console.log(`SOL Balance: ${balance}`);

    // Test 2: Get price of Jupiter token
    console.log('\nTest 2: Fetching Jupiter token price...');
    const jupPrice = await agent.fetchPrice(
      'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' // Jupiter token mint
    );
    console.log(`Jupiter Price: $${jupPrice}`);

  } catch (error) {
    console.error('Error:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
  }
}

main();
