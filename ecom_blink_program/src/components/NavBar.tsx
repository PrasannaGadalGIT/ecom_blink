"use client";
import React from "react";
import { Sun, Moon, Bot } from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { FaOpencart } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { decreaseQuantity, increaseQuantity } from "@/lib/features/cart/cartSlice";
import Image from "next/image";

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
  userId: number | null;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode, userId }) => {
  const cartItems = useAppSelector((state) => state.cart.items);
  const router = useRouter();
  const dispatch = useAppDispatch();

  return (
    <div className="flex justify-between items-center mb-8 w-full p-4">
      <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
        <Bot className="w-8 h-8" /> AI E-commerce Assistant
      </h1>
      <div className="flex items-center gap-8">
        <Popover>
          <PopoverTrigger className="relative">
            <FaOpencart size={30} />
            {cartItems.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                {cartItems.length}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-[20rem] mt-3">
            <h3 className="text-lg font-bold mb-2">Cart</h3>
            {cartItems.length === 0 ? (
              <p className="text-sm text-gray-500">Your cart is empty.</p>
            ) : (
              <div className="max-h-[250px] overflow-y-auto">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center border-b py-2">
                    {/* Product Image with Next.js Image component */}
                    <div className="relative w-16 h-12">
                      <Image
                        src={item.image_url}
                        alt={item.productName}
                        fill
                        sizes="64px"
                        className="object-cover rounded-md"
                        priority={index < 2} // Prioritize loading for the first two items
                      />
                    </div>
                    <div className="flex-1 px-2">
                      {/* Product Name */}
                      <p className="text-sm font-medium">{item.productName}</p>
                      {/* Price & Quantity */}
                      <p className="text-xs text-gray-500">${item.price} x {item.quantity}</p>
                    </div>
                    {/* Quantity Controls */}
                    <div className="flex items-center">
                      <button
                        onClick={() => dispatch(decreaseQuantity(item.productName))}
                        className="px-2 bg-gray-200 rounded">
                        -
                      </button>
                      <span className="mx-2">{item.quantity}</span>
                      <button
                        onClick={() => dispatch(increaseQuantity(item.productName))}
                        className="px-2 bg-gray-200 rounded">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Checkout Button */}
            {cartItems.length > 0 && (
              <div className="flex justify-center w-full mt-4">
                <Button onClick={() => router.push(`/cart/${userId}`)}>Checkout</Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
        <Button onClick={() => signOut()}>Log Out</Button>
        <button onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun /> : <Moon />}</button>
      </div>
    </div>
  );
};

export default Navbar;