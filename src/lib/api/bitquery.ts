
// BitQuery API Integration for smart contract events
const BITQUERY_API_KEY = "ory_at_pYLlbzzzX-li4N751xL1l9WakOBDzQEH5RKhh32y7lE.8lOEYjlX5RQGvSf8x4rC4MqfZ4O29NDnOq3rhh2x8ys";
const BITQUERY_API_URL = "https://graphql.bitquery.io/";

interface BitQueryResponse {
  data: {
    ethereum: {
      smartContractEvents: Array<{
        transaction: {
          hash: string;
          from: {
            address: string;
          };
          date: {
            date: string;
          };
          block: {
            timestamp: {
              unixtime: number;
            };
          };
        };
      }>;
    };
  };
}

/**
 * Fetches contract creation information from BitQuery
 */
export const getContractCreationInfoBitQuery = async (address: string, network: string = "ethereum"): Promise<{
  creationDate?: string;
  creatorAddress?: string;
  transactionHash?: string;
} | null> => {
  try {
    // GraphQL query to get the earliest interaction with this contract address
    const query = `
      {
        ethereum(network: ${network}) {
          smartContractEvents(
            smartContractAddress: {is: "${address}"}
            options: {asc: "block.timestamp.unixtime", limit: 1}
          ) {
            transaction {
              hash
              from {
                address
              }
              date {
                date
              }
              block {
                timestamp {
                  unixtime
                }
              }
            }
          }
        }
      }
    `;
    
    const response = await fetch(BITQUERY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": BITQUERY_API_KEY
      },
      body: JSON.stringify({ query })
    });
    
    if (!response.ok) {
      throw new Error(`BitQuery API error: ${response.statusText}`);
    }
    
    const data: BitQueryResponse = await response.json();
    
    if (data.data?.ethereum?.smartContractEvents?.length > 0) {
      const firstEvent = data.data.ethereum.smartContractEvents[0];
      return {
        creationDate: firstEvent.transaction.date.date,
        creatorAddress: firstEvent.transaction.from.address,
        transactionHash: firstEvent.transaction.hash
      };
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching contract creation from BitQuery:", error);
    return null;
  }
};
