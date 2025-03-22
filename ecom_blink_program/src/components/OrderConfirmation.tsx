import { useWallet } from "@solana/wallet-adapter-react";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface CartItem {
  id: string;
  productName: string;
  price: number; // Price in SOL
  quantity: number;
  escrowStatus: "pending" ;
}

const OrderConfirmation = () => {
  const { userId } = useParams(); // Get userId from the route
  const { publicKey } = useWallet();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const buyerPubkey = publicKey?.toBase58();

  // Fetch cart data
  useEffect(() => {
    const fetchCartData = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`/api/prisma/cart/getCart/${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch cart data");
        }
        const data = await response.json();
        setCart(data);
      } catch (err) {
        console.error("Error fetching cart data:", err);
        setError("Failed to load cart data");
      }
    };

    fetchCartData();
  }, [userId]);

  const handleConfirmation = async (itemId: string, amount: number) => {
    if (!buyerPubkey) {
      setError("Wallet not connected");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(
        `/api/actions/escrow?method=create&amount=${amount}&itemId=${itemId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account: buyerPubkey }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to confirm order");
      }

      const data = await res.json();
      console.log("Order Confirmation Response:", data);

      // Update the cart state to reflect the confirmed order
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === itemId ? { ...item } : item
        )
      );

      setSuccess(true);
    } catch (err) {
      console.error("Error confirming order:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Your Cart</h2>
      {cart.length === 0 ? (
        <p className="text-gray-400">Your cart is empty.</p>
      ) : (
        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 p-4 rounded-lg shadow-md"
            >
              <h3 className="text-lg font-semibold">{item.productName}</h3>
              <p className="text-gray-400">Quantity: {item.quantity}</p>
              <p className="text-gray-400">Price: {item.price} SOL</p>
              <p
                className={
                  item.escrowStatus === "pending"
                    ? "text-yellow-400"
                    : "text-green-400"
                }
              >
                Status: {item.escrowStatus}
              </p>
              {item.escrowStatus === "pending" && (
                <button
                  onClick={() =>
                    handleConfirmation(item.id, item.price * item.quantity)
                  }
                  
                >
                  {loading ? "Processing..." : "Confirm Order"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">Order confirmed successfully!</p>}
    </div>
  );
};

export default OrderConfirmation;