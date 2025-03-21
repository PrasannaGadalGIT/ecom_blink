"use client"
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import {
  WalletModalProvider,
  WalletDisconnectButton,
  WalletMultiButton
} from '@solana/wallet-adapter-react-ui';
import '@solana/wallet-adapter-react-ui/styles.css';

import LoginComp from "../../components/LoginComp"
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import OrderConfirmation from '@/components/OrderConfirmation';
const ReleaseFunds = () => {

  

  return (
    <>

      <div className=' bg-black min-h-screen text-gray-50 flex justify-center items-center'>
        <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
          <WalletProvider wallets={[]} autoConnect>
            <WalletModalProvider>
              <WalletMultiButton />
                <OrderConfirmation />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </div>

    </>


  )
}

export default ReleaseFunds