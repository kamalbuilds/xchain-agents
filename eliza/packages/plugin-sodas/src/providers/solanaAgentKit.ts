import { SolanaAgentKit } from 'solana-agent-kit';
import * as dotenv from 'dotenv';
import { resolve } from 'node:path';

let agent: SolanaAgentKit | null = null;

export interface SolanaAgentKitProvider {
  getAgent(): SolanaAgentKit;
  initialize(privateKey: string, rpcUrl?: string, openAiKey?: string): void;
}

export function getAgent(): SolanaAgentKit {
  if (!agent) {
    throw new Error('SolanaAgentKit not initialized. Call initialize() first.');
  }
  return agent;
}

export function initialize(privateKey: string, rpcUrl?: string, openAiKey?: string): void {
  if (!privateKey) {
    throw new Error('Private key is required');
  }

  agent = new SolanaAgentKit(
    privateKey,
    rpcUrl || 'https://api.mainnet-beta.solana.com',
    openAiKey
  );
}
