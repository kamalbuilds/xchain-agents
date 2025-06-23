import { Provider } from '@ai16z/eliza';

export interface CrossmintProvider extends Provider {
  // Crossmint specific provider properties
  mintNFT: (metadata: any) => Promise<string>;
  listNFT: (nftId: string, price: number) => Promise<boolean>;
  transferNFT: (nftId: string, toAddress: string) => Promise<boolean>;
}

// Crossmint API Provider
export const crossmintProvider = {
  // Implementation for Crossmint API integration
};
