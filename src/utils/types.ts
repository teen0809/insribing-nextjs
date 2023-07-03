declare global {
  interface Window {
    unisat: {
      signPsbt: (psbtHex: string) => Promise<string>;
      getAccounts: () => Promise<[string]>;
      switchNetwork: (network: string) => Promise<void>;
      requestAccounts: () => Promise<string[]>;
      getPublicKey: () => Promise<string>;
      sendBitcoin: (address: string, amount: number) => Promise<string>;
    };
  }
}

export {};
