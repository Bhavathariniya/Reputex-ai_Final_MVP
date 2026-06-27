/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ETHERSCAN_API_KEY: string;
  readonly VITE_MORALIS_API_KEY: string;
  readonly VITE_LUNARCRUSH_API_KEY: string;
  readonly VITE_BITQUERY_API_KEY: string;
  readonly VITE_ALCHEMY_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_COINGECKO_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
