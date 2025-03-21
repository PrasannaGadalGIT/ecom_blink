import { useWallet } from '@solana/wallet-adapter-react';
import React from 'react'
import { Connection, Transaction, SystemProgram, PublicKey } from "@solana/web3.js";



const OrderConfirmation = () => {
    const { publicKey, wallet } = useWallet();
  
    const buyerPubkey = publicKey?.toBase58()

const handleConfirmation = async() => {
    const res = await fetch(`/api/actions/escrow?method=create&amount=10`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: buyerPubkey }),
    })
    console.log(await res.json())
  }


  return (
    <div>
          <button onClick={handleConfirmation}>
          Order Confirm
        </button>
    </div>
  )
}

export default OrderConfirmation