"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import NavBar from "./NavBar"; // Import the NavBar component


interface CartItem {
  id: number;
  productName: string;
  description?: string;
  price: number;
  quantity: number;
  imageURL: string;
}

interface CartProps {
  cartProducts: CartItem[];
  totalAmountUSD: number;
  totalAmountSOL: string | null;
  loading?: boolean;
  onIncrease: (productName: string) => void;
  onDecrease: (productName: string) => void;
  onRemove: (id: number) => void;
  onPurchase: (productName: string, quantity: number) => void;
}

const DisplayCartItems: React.FC<CartProps> = ({
  cartProducts,
  totalAmountUSD,
  totalAmountSOL,

  onRemove,

}) => {
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  if (!cartProducts.length) {
    return (
      <div className={`max-w-4xl mx-auto p-6 ${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
        <NavBar darkMode={darkMode} setDarkMode={toggleDarkMode} userId={null} />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-semibold">Your Cart</h2>
        </div>
        <p className="text-center text-lg text-gray-500">Your cart is empty.</p>
      </div>
    );
  }

  const handleBuyNow = (productName: string, imageURL: string,  price: number, quantity: number,description?: string) => {
    // const totalPriceSOL = totalAmountSOL;
    console.log(price * quantity)
    // Open the purchase link in a new tab
    const productUrl = `http://localhost:3000/api/actions/escrow?title=${encodeURIComponent(productName)}&imageUrl=${encodeURIComponent(imageURL)}&description=${encodeURIComponent(description || "")}&price=${price * quantity}`;
    const purchaseLink = `https://dial.to/developer?url=${encodeURIComponent(productUrl)}&cluster=devnet`;
    window.open(purchaseLink, "_blank");
  };

  const handleCheckout = () => {
    const totalPriceSOL = totalAmountSOL ? parseFloat(totalAmountSOL) : 0;

    // Open the checkout link in a new tab
    const checkoutUrl = `http://localhost:3000/api/actions/escrow?title=${encodeURIComponent("Checkout for all products")}&imageUrl=https://images.pexels.com/photos/2533311/pexels-photo-2533311.jpeg?cs=srgb&dl=pexels-suzyhazelwood-2533311.jpg&fm=jpg&description=${encodeURIComponent("Checkout for all products")}&price=${totalPriceSOL}`;
    const purchaseLink = `https://dial.to/developer?url=${encodeURIComponent(checkoutUrl)}&cluster=devnet`;
    window.open(purchaseLink, "_blank");
  };

  return (
    <div className={`${darkMode ? "bg-gray-900 text-white" : "bg-white text-gray-800"}`}>
      <NavBar darkMode={darkMode} setDarkMode={toggleDarkMode} userId={null} />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-semibold">Your Cart</h2>
        </div>

        {cartProducts.map((item) => (
          <div key={item.id} className={`flex items-center justify-between ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md rounded-lg p-4`}>
            <div className="flex items-center space-x-4">
              <img
                src={item.imageURL}
                alt={item.productName}
                className="w-36 h-24 object-cover rounded-lg"
              />
              <div className="flex flex-col">
                <p className="text-lg font-medium">{item.productName}</p>
                {item.description && <p className="text-sm text-gray-500">{item.description}</p>}
                <p className="text-md font-semibold">Price: ${item.price}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-lg font-medium">{item.quantity}</span>
              <button
                className={`px-3 py-1 ${darkMode ? "bg-red-600" : "bg-red-200"} rounded-full text-sm ${darkMode ? "text-white" : "text-red-600"} hover:${darkMode ? "bg-red-700" : "bg-red-300"}`}
                onClick={() => onRemove(item.id)}
              >
                Remove
              </button>
              <button
                className={`px-3 py-1 ${darkMode ? "bg-green-600" : "bg-green-200"} rounded-full text-sm ${darkMode ? "text-white" : "text-green-600"} hover:${darkMode ? "bg-green-700" : "bg-green-300"}`}
                onClick={() => handleBuyNow(item.productName, item.imageURL,item.quantity, item.price,item.description)}
              >
                Buy Now
              </button>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center mt-6">
          <div className="text-lg font-semibold">
            Total: ${totalAmountUSD.toFixed(2)}
            {totalAmountSOL && (
              <span className="text-sm text-gray-500 ml-2">
                (≈ {totalAmountSOL} SOL)
              </span>
            )}
          </div>
          <Button className="px-6 py-2 text-white text-lg font-semibold rounded-lg" onClick={handleCheckout}>Checkout</Button>
        </div>
      </div>
    </div>
  );
};

export default DisplayCartItems;