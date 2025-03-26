// File: /api/actions/escrow.ts

import {
  
  createActionHeaders,
  ActionGetResponse,
  ActionPostRequest,

} from "@solana/actions";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  Connection,
  clusterApiUrl,
  SystemProgram,

} from "@solana/web3.js";
// interface TransactionDetails {
//   buyer: PublicKey;
//   seller: PublicKey;
//   amount: number;
// }

// const endpoint = "https://orbital-powerful-slug.solana-devnet.quiknode.pro/5f829c00d61ba0f278b779fabd801414b22bf994/";
// const solanaConnection = new Connection(endpoint);




// const getTransaction = async (address:PublicKey, numTx: number ) => {
//   let txList = await solanaConnection.getSignaturesForAddress(address, {limit:numTx});

//   return txList;
// }

// Constants
const SOL_PRICE_IN_USD: number = 129.350;
const SELLER_ADDRESS = new PublicKey("47EiJZWwj917wKwhzEYRmQSVkbfLTcsPTPsiMC9BPWjy");


const headers = createActionHeaders({
  chainId: "devnet",
});


function convertUsdToSol(usdAmount: number): number {
  if (usdAmount <= 0) throw new Error("USD amount must be greater than 0");
  return usdAmount / SOL_PRICE_IN_USD;
}


function validatePublicKey(key: string, fieldName: string): PublicKey {
  try {
    return new PublicKey(key);
  } catch (error) {
    throw new Error(`Invalid ${fieldName}: ${key} , ${error}`);
  }
}





export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  const title = url.searchParams.get("title") || "Product";
  const imageUrl = url.searchParams.get("imageUrl") || "/api/placeholder/200/200";
  const description = url.searchParams.get("description") || "Product Description";
  const price = Number(url.searchParams.get("price") || "10");
  
  const payload: ActionGetResponse = {
    type: "action",
    title: title,
    icon: imageUrl,
    label: 'Secure Purchase',
    description: `Purchase ${title} with Solana escrow protection`,
    links: {
      "actions": [
        {
          "label": "Buy Now", 
          "href": `/api/actions/escrow?&amount=${convertUsdToSol(price)}&title=${title}&imageUrl=${imageUrl}&description=${description}&price=${price}`,
          type: "message"
        }
      ]
    }
  };
  
  return Response.json(payload, { headers });
}

export const OPTIONS = GET;

// POST endpoint (unchanged)
export async function POST(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const method = url.searchParams.get("method") || "transfer";

    if (method !== "transfer") {
      return Response.json({ error: "Invalid method specified" }, { headers });
    }

    const body: ActionPostRequest = await req.json();
    const buyerKey = body.account;

    const amount = Number(url.searchParams.get("amount"));
    console.log(amount)
    if (amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const amountLamports = Math.floor(amount * LAMPORTS_PER_SOL);
    const buyer = validatePublicKey(buyerKey, "buyer public key");
    const seller = SELLER_ADDRESS;

    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

   
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: seller,
        lamports: amountLamports,
      })
    );

    // Set the fee payer and recent blockhash
    transaction.feePayer = buyer;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

    // Serialize the transaction (for signing by the buyer)
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
    }).toString("base64");

    
    return Response.json(
      {
        transaction: serializedTransaction,
        message: `Transfer of ${amount} SOL (${amountLamports} lamports) to the seller initiated.`,
      },
      { headers }
    );
  } catch (error) {
    console.error("Error initiating direct transfer:", error);
    return Response.json(
      {
        error: "Failed to initiate direct transfer",
        details: error instanceof Error ? error.message : String(error),
      },
      { headers }
    );
  }
}
