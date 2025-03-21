// File: /api/actions/escrow.ts
import { Program } from "@project-serum/anchor";
import {
  ActionPostResponse,
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
  Keypair,
} from "@solana/web3.js";


const IDL = require('@/../anchor/target/idl/test_blink.json')
// const endpoint = "https://orbital-powerful-slug.solana-devnet.quiknode.pro/5f829c00d61ba0f278b779fabd801414b22bf994/";
// const solanaConnection = new Connection(endpoint);




// const getTransaction = async (address:PublicKey, numTx: number ) => {
//   let txList = await solanaConnection.getSignaturesForAddress(address, {limit:numTx});

//   return txList;
// }

// Constants
const SOL_PRICE_IN_USD: number = 129.350;
const SELLER_ADDRESS = new PublicKey("BmQuXK4wJdLEULMvzwyiNE9p7Rj3Pg4pgFfoB1SY53pj");

// Create headers for Solana devnet
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
    throw new Error(`Invalid ${fieldName}: ${key}`);
  }
}


function logTransactionDetails(details: Record<string, any>) {
  console.log("Transaction Details:", JSON.stringify(details, null, 2));
}

// In-memory storage for escrow status (replace with a database in production)
const escrowStatusMap: Record<string, "pending" | "completed"> = {};

// GET endpoint (unchanged)
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
          "label": "Create Escrow", 
          "href": `/api/actions/escrow?method=create&amount=${convertUsdToSol(price)}&title=${title}&imageUrl=${imageUrl}&description=${description}&price=${price}`,
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
  const url = new URL(req.url);
  const method = url.searchParams.get("method") || "create";
  
  switch (method) {
    case "create":
      return handleCreateEscrow(req);
    case "confirm":
      return handleConfirmDelivery(req);
    default:
      return Response.json({
        error: "Invalid method specified"
      }, { headers });
  }

  
}

// Create Escrow handler
async function handleCreateEscrow(req: Request): Promise<Response> {
  try {
    const body: ActionPostRequest = await req.json();
    const buyerKey = body.account;
    
    const url = new URL(req.url);
    const amount = Number(url.searchParams.get("amount") || "0");
    const title = url.searchParams.get("title") || "";
    
    const amountLamports = Math.floor(amount * LAMPORTS_PER_SOL);
    const buyer = validatePublicKey(buyerKey, "buyer public key");
    const seller = SELLER_ADDRESS;

    const connection = new Connection('https://api.devnet.solana.com', "confirmed");
    
    // const programId = new PublicKey(IDL.metadata.address)
    // const program : Program<TestBlink> = new Program(IDL,programId, {connection});
   

 
    const escrowAccountHolder = Keypair.generate();

    console.log(escrowAccountHolder.publicKey)
    const transaction = new Transaction();
    
  
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: buyer,
        toPubkey: escrowAccountHolder.publicKey,
        lamports: amountLamports,
      })
    );
    
   
    transaction.feePayer = buyer;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    
  
    const serialTX = transaction.serialize({ requireAllSignatures: false }).toString("base64");
    

    logTransactionDetails({
      escrowAccountHolder: escrowAccountHolder.publicKey.toString(),
      buyer: buyer.toString(),
      amount: amountLamports,
    });
    
 
    escrowStatusMap[escrowAccountHolder.publicKey.toString()] = "pending";
    
    
    return Response.json({
      transaction: serialTX,
      message: `Creating escrow for ${amount} SOL (${amountLamports} lamports). Funds will be held securely until you confirm delivery.`,
      escrowAccountHolder: escrowAccountHolder.publicKey.toString(),
    }, { headers });
  } catch (error) {
    console.error("Error creating escrow:", error);
    
    return Response.json({
      error: "Failed to create escrow transaction",
      details: error instanceof Error ? error.message : String(error)
    }, { headers });
  }
}

// Confirm Delivery handler
async function handleConfirmDelivery(req: Request): Promise<Response> {
  try {
    const body = await req.json();
    const buyerKey = body.account;
    
    const url = new URL(req.url);
    const escrowAccountHolderKey = url.searchParams.get("escrowAccountHolder");
    
    if (!escrowAccountHolderKey) {
      throw new Error("Escrow account holder address is required");
    }
    
    const buyer = validatePublicKey(buyerKey, "buyer public key");
    const seller = SELLER_ADDRESS;
    const escrowAccountHolder = validatePublicKey(escrowAccountHolderKey, "escrow account holder public key");
    const connection = new Connection(clusterApiUrl('devnet'));
    
    // // Check if the escrow status is pending
    // if (escrowStatusMap[escrowAccountHolder.toString()] !== "pending") {
    //   throw new Error("Escrow is not in a pending state");
    // }
    

    const transaction = new Transaction();
    
 
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowAccountHolder,
        toPubkey: seller,
        lamports: await connection.getBalance(escrowAccountHolder),
      })
    );
    
 
    transaction.feePayer = buyer;
    transaction.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
    

    const serialTX = transaction.serialize({ requireAllSignatures: false }).toString("base64");
    
 
    logTransactionDetails({
      escrowAccountHolder: escrowAccountHolder.toString(),
      buyer: buyer.toString(),
      seller: seller.toString(),
    });
    
    
    escrowStatusMap[escrowAccountHolder.toString()] = "completed";
    
   
    return Response.json({
      transaction: serialTX,
      message: "Delivery confirmed. Funds have been released to the seller.",
    }, { headers });
  } catch (error) {
    console.error("Error confirming delivery:", error);
    
    return Response.json({
      error: "Failed to confirm delivery",
      details: error instanceof Error ? error.message : String(error)
    }, { headers });
  }
}