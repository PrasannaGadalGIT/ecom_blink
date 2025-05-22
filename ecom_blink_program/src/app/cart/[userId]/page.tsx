"use client";
import React, { useEffect, useState } from "react";
import DisplayCartItems from "@/components/DisplayCartItems";

interface CartProp {
  params: Promise<{
    userId: string;
  }>;
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
  const [userId, setUserId] = useState<string>("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solanaRate, setSolanaRate] = useState<number | null>(null);

  // Extract userId from params
  useEffect(() => {
    const getParams = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.userId);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!userId) return; // Don't fetch until userId is available

    const fetchCartItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/prisma/cart/getCart/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cart items");
        }
        const data = await response.json();
        setCartItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch cart items");
      } finally {
        setLoading(false);
      }
    };

    fetchCartItems();
  }, [userId]);

  useEffect(() => {
    const fetchSolanaPrice = async () => {
      try {
        const response = await fetch(
          "https://min-api.cryptocompare.com/data/price?fsym=SOL&tsyms=USD"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch Solana price");
        }
        const data = await response.json();
        setSolanaRate(data.USD);
      } catch (error) {
        console.error("Failed to fetch Solana price:", error);
      }
    };
    fetchSolanaPrice();
  }, []);

  const totalAmountUSD = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const totalAmountSOL = solanaRate ? (totalAmountUSD / solanaRate).toFixed(4) : null;

  const handleIncrease = async (productName: string) => {
    try {
      const response = await fetch("/api/cart/increase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          productName,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to increase quantity");
      }
      const updatedItem = await response.json();
      setCartItems(
        cartItems.map((item) =>
          item.productName === productName ? updatedItem : item
        )
      );
    } catch (err) {
      console.error("Failed to increase quantity:", err);
    }
  };

  const handleDecrease = async (productName: string) => {
    try {
      const response = await fetch("/api/cart/decrease", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          productName,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to decrease quantity");
      }
      const updatedItem = await response.json();
      setCartItems(
        cartItems.map((item) =>
          item.productName === productName ? updatedItem : item
        )
      );
    } catch (err) {
      console.error("Failed to decrease quantity:", err);
    }
  };

  const handleRemove = async (id: number) => {
    try {
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          productId: id,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to remove item");
      }
      setCartItems(cartItems.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/cart/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          solanaRate,
        }),
      });
      if (!response.ok) {
        throw new Error("Checkout failed");
      }
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