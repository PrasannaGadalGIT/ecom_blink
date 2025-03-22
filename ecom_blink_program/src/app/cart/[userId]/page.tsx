"use client";
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/lib/store";
import { increaseQuantity, decreaseQuantity, removeFromCart } from "@/lib/features/cart/cartSlice";
import { use } from 'react';
import DisplayCartItems from "@/components/DisplayCartItems";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";


const Cart = ({ params }: { params: Promise<{ userId: string }> }) => {
  const dispatch = useDispatch();
  const { items: cartItems, loading } = useSelector((state: RootState) => state.cart);
  const [solanaRate, setSolanaRate] = useState<number | null>(null);
  const [cartProducts, setCartProducts] = useState<any[]>([]);

  const {userId} = use(params);
  

  
 
  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch(`/api/prisma/cart/getCart/${userId}`);
        const data = await response.json();
        setCartProducts(data);
      } catch (error) {
        console.error('Failed to fetch cart items:', error);
      }
    };

    fetchCartItems();
  }, [dispatch, userId]);
  
  useEffect(() => {
    const fetchSolanaPrice = async () => {
      try {
        const response = await fetch("https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD");
        const data = await response.json();
        setSolanaRate(data.USD);
      } catch (error) {
        console.error("Failed to fetch Solana price:", error);
      }
    };

    fetchSolanaPrice();
  }, []);

  const totalAmountUSD = cartProducts.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalAmountSOL = solanaRate ? (totalAmountUSD / solanaRate).toFixed(4) : null;

  const handleIncrease = (productName: string) => {
    dispatch(increaseQuantity(productName));
  };

  const handleDecrease = (productName: string) => {
    dispatch(decreaseQuantity(productName));
  };

  const handleRemove = async (id: number) => {
    try {
      const response = await fetch(`/api/prisma/cart/remove/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Refresh cart items after deletion
        const updatedCart = cartProducts.filter(item => item.id !== id);
        setCartProducts(updatedCart);
      }
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handlePurchase = async (productName: string, quantity: number) => {
    try {
      const response = await fetch('/api/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId:userId, productName, quantity }),
      });
      if (response.ok) {
        alert('Purchase successful!');
      }
    } catch (error) {
      console.error('Failed to process purchase:', error);
    }
  };

  if (loading) {
    return (
      <div className="relative items-center block max-w-sm p-6 bg-white border border-gray-100 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-800 dark:hover:bg-gray-700">
        <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white opacity-20">Noteworthy technology acquisitions 2021</h5>
        <p className="font-normal text-gray-700 dark:text-gray-400 opacity-20">Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse chronological order.</p>
        <div role="status" className="absolute -translate-x-1/2 -translate-y-1/2 top-2/4 left-1/2">
          <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/><path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/></svg>
        </div>
      </div>
    );
  }

  return (
    <ConnectionProvider endpoint="https://api.devnet.solana.com">
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
   
          <DisplayCartItems
            cartProducts={cartProducts}
            totalAmountUSD={totalAmountUSD}
            totalAmountSOL={totalAmountSOL}
            loading={loading}
            onIncrease={handleIncrease}
            onDecrease={handleDecrease}
            onRemove={handleRemove}
            onPurchase={handlePurchase}
          />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default Cart;