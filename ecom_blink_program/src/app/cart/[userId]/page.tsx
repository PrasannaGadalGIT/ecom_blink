"use client";
import React, { useEffect, useState } from "react";
import DisplayCartItems from "@/components/DisplayCartItems";

interface CartProp {
  params: {
    userId: string;
  };
}

interface CartItem {
    id: number;
    productName: string;
    description: string;
    price: number;
    quantity: number;
    image_url: string;
   
    
  }

const Cart = ({ params }: CartProp) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [solanaRate, setSolanaRate] = useState<number | null>(null);

  
  useEffect(() => {
    const fetchCartItems = async () => {
        const {userId} =await params;
     
      try {
        const response = await fetch(`/api/prisma/cart/getCart/${userId}`);
        const data = await response.json();
        console.log(data)
        setCartItems(data);
      } catch (err) {
        setError("Failed to fetch cart items");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, []);

  // Fetch Solana price from CryptoCompare API
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

  const totalAmountUSD = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalAmountSOL = solanaRate ? (totalAmountUSD / solanaRate).toFixed(4) : null;

  const handleIncrease = async (productName: string) => {
    try {
      const response = await fetch('/api/cart/increase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          productName
        })
      });
      const updatedItem = await response.json();
      setCartItems(cartItems.map(item => 
        item.productName === productName ? updatedItem : item
      ));
    } catch (err) {
      console.error("Failed to increase quantity:", err);
    }
  };

  const handleDecrease = async (productName: string) => {
    try {
      const response = await fetch('/api/cart/decrease', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          productName
        })
      });
      const updatedItem = await response.json();
      setCartItems(cartItems.map(item => 
        item.productName === productName ? updatedItem : item
      ));
    } catch (err) {
      console.error("Failed to decrease quantity:", err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      await fetch('/api/cart/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          productId: id
        })
      });
      setCartItems(cartItems.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: params.userId,
          solanaRate
        })
      });
      setCartItems([]);
    } catch (err) {
      console.error("Checkout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !cartItems.length) return <p className="text-center text-lg">Loading cart...</p>;
  if (error) return <p className="text-center text-lg text-red-500">{error}</p>;
  if (!cartItems.length) return <p className="text-center text-lg text-gray-500">Your cart is empty.</p>;
  console.log(cartItems)
  return (
   
    <DisplayCartItems
      cartProducts={cartItems}
      totalAmountUSD={totalAmountUSD}
      totalAmountSOL={totalAmountSOL}
      onIncrease={handleIncrease}
      onDecrease={handleDecrease}
      onRemove={handleRemove}
      onPurchase={handlePurchase}
      loading={loading}
    />
  );
};

export default Cart;