
// Moralis API Integration for token metadata
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjQ0NDZhODQzLTJjZjctNDM2Mi1hY2Y5LWY4ZWFjMzMzMjIwNyIsIm9yZ0lkIjoiNDQ0NDIxIiwidXNlcklkIjoiNDU3MjUxIiwidHlwZUlkIjoiZGFjMzE1YjUtMGNjMC00NzYyLWFlNjktZjRlYjE1YjQzNDIwIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDU5MTk5MzAsImV4cCI6NDkwMTY3OTkzMH0.LKObO9kRWfaavjZ5mXynPIQfJTdETfyOE65SdSRFxag";
const MORALIS_API_BASE = "https://deep-index.moralis.io/api/v2.2";
import axios from 'axios';

export interface MoralisTokenData {
  address: string;
  name: string;
  symbol: string;
  decimals: string;
  logo?: string;
  logo_hash?: string;
  thumbnail?: string;
  block_number?: string;
  validated?: boolean;
  created_at?: string;
  total_supply?: string;
  block_timestamp?: string;
  creator_address?: string;
}

interface MoralisTransferEvent {
  transaction_hash: string;
  address: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  from_address: string;
  to_address: string;
  value: string;
}

/**
 * Fetches token metadata from Moralis API
 */
export const getTokenMetadata = async (address: string, chainId: string = "0x1"): Promise<MoralisTokenData | null> => {
  try {
    const url = `${MORALIS_API_BASE}/erc20/${address}/metadata?chain=${chainId}`;
    
    const response = await fetch(url, {
      headers: {
        "accept": "application/json",
        "X-API-Key": MORALIS_API_KEY
      }
    });
    
    if (!response.ok) {
      throw new Error(`Moralis API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching token metadata from Moralis:", error);
    return null;
  }
};

/**
 * Fetches token statistics including total supply and decimals
 * Using the exact implementation from your working Node.js script
 */
export const getTokenStats = async (contractAddress: string): Promise<{
  totalSupply: string;
  decimals: string;
}> => {
  try {
    const headers = {
      'X-API-Key': MORALIS_API_KEY,
      'Content-Type': 'application/json',
    };

    console.log("Making Moralis API request for:", contractAddress);
    
    // Use the exact same URL format as your working script
    const metadataRes = await axios.get(
      `${MORALIS_API_BASE}/erc20/metadata?chain=eth&addresses%5B0%5D=${contractAddress}`,
      { headers }
    );

    console.log("Moralis API response:", metadataRes.data);

    if (!metadataRes.data || metadataRes.data.length === 0) {
      throw new Error("No token data returned from Moralis API");
    }

    // Use the exact same approach as your working script
    const tokenMeta = metadataRes.data[0];
    const totalSupply = tokenMeta.total_supply || 'N/A';
    const decimals = tokenMeta.decimals || 'N/A';

    console.log("Extracted token data:", { totalSupply, decimals });

    return { totalSupply, decimals };
  } catch (error: any) {
    console.error('Error fetching token stats:', error.response?.data || error.message);
    return {
      totalSupply: 'N/A',
      decimals: 'N/A'
    };
  }
};

/**
 * Get contract creation info using Moralis - improved implementation
 * Uses token transfer events to determine earliest activity
 */
export const getContractCreationInfo = async (address: string, chainId: string = "0x1"): Promise<{
  block_timestamp?: string;
  creator_address?: string;
  transaction_hash?: string;
} | null> => {
  try {
    // First try token metadata which might include creation info
    const tokenData = await getTokenMetadata(address, chainId);
    
    if (tokenData && (tokenData.block_timestamp || tokenData.created_at)) {
      return {
        block_timestamp: tokenData.block_timestamp || tokenData.created_at,
        creator_address: tokenData.creator_address
      };
    }
    
    // If metadata doesn't have creation info, look for earliest transfer events
    const transfersUrl = `${MORALIS_API_BASE}/${address}/events?chain=${chainId}&from_block=0&to_block=latest&order=ASC&limit=1`;
    
    const transfersResponse = await fetch(transfersUrl, {
      headers: {
        "accept": "application/json",
        "X-API-Key": MORALIS_API_KEY
      }
    });
    
    if (!transfersResponse.ok) {
      throw new Error(`Moralis API error: ${transfersResponse.statusText}`);
    }
    
    const transfersData = await transfersResponse.json();
    
    if (transfersData && transfersData.result && transfersData.result.length > 0) {
      const firstEvent = transfersData.result[0] as MoralisTransferEvent;
      
      return {
        block_timestamp: firstEvent.block_timestamp,
        creator_address: firstEvent.from_address,
        transaction_hash: firstEvent.transaction_hash
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching contract creation from Moralis:", error);
    return null;
  }
};

