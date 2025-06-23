import { SolanaAgentKit } from 'solana-agent-kit';

export async function initialize(privateKey: string | undefined): Promise<SolanaAgentKit> {
  if (!privateKey) {
    throw new Error('SOLANA_PRIVATE_KEY is required');
  }

  const agent = new SolanaAgentKit(privateKey, process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com');
  return agent;
}
