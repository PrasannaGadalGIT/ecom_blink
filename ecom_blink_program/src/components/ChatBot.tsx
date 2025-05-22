"use client";
import React, { useState, useEffect, useRef, JSX } from "react";
import { Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";
import axios from "axios";
import { FaOpencart } from "react-icons/fa";
import { useAppDispatch } from "@/lib/hooks";
import { addToCart } from "@/lib/features/cart/cartSlice";
import Navbar from "./NavBar";
import Image from "next/image";

interface Message {
  text: string | JSX.Element;
  isBot: boolean;
}

interface Product {
  description: string;
  image_url: string;
  price: number;
  title: string;
  rating: number;
  url: string;
  similarity_score?: number;
}

interface ChatResponse {
  answer: string;
  products: Product[];
  model?: string;
}

const ChatBot = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [typing, setTyping] = useState<boolean>(false);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      text: (
        <div>
          <p>Hello! I&apos;m your AI shopping assistant.</p>
          <p>I can:</p>
          <ul className="list-disc pl-5">
            <li>Help you find products</li>
            <li>Answer general questions</li>
            <li>Provide shopping advice</li>
          </ul>
          <p>How can I help you today?</p>
        </div>
      ),
      isBot: true,
    },
  ]);
  
  const dispatch = useAppDispatch();

  const getPurchaseLink = (product: Product) => {
    const productUrl = `http://localhost:3000/api/actions/escrow?title=${encodeURIComponent(product.title)}&imageUrl=${encodeURIComponent(product.image_url)}&description=${encodeURIComponent(product.description || "")}&price=${product.price}`;
    return `https://dial.to/developer?url=${encodeURIComponent(productUrl)}&cluster=devnet`;
  };

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        if (session?.user?.email) {
          const response = await axios.get(`/api/prisma/users?email=${session.user.email}`);
          if (response.data && response.data.length > 0) {
            setUserId(response.data[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    };

    fetchUserDetails();
  }, [session]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createChat = async (query: string, products: Product[]) => {
    try {
      if (!userId) return null;
      await axios.post("/api/prisma/chats", {
        query,
        userId,
        responses: products,
      });
    } catch (error) {
      console.error("Error creating chat:", error);
    }
  };

  const handleAddToCart = async (product: Product) => {
    if (!userId) return;
    try {
      await axios.post("/api/prisma/cart/add", {
        userId,
        title: product.title,
        image_url: product.image_url,
        description: product.description,
        price: product.price,
        quantity: 1,
      });
    
      dispatch(
        addToCart({
          productName: product.title,
          image_url: product.image_url,
          description: product.description,
          price: product.price,
          rating: product.rating,
          quantity: 1,
        })
      );
    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;
  
    const userMessage: Message = {
      text: input,
      isBot: false,
    };
  
    setMessages((prev) => [...prev, userMessage]);
    setTyping(true);
    setInput("");
  
    try {
      const response = await axios.post<ChatResponse>("http://127.0.0.1:8000/ask", {
        query: input,
      });
      
      await createChat(input, response.data.products);
        
      const botMessage: Message = {
        text: (
          <div className="space-y-4">
            <div className="prose dark:prose-invert">
              {response.data.answer}
            </div>
            
            {response.data.products.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Recommended Products:</h3>
                {response.data.products.map((item, index) => (
                  <div key={index} className="mb-8 p-4 border rounded-lg dark:border-gray-700">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/3 relative h-48">
                        <Image
                          src={item.image_url}
                          alt={item.title}
                          fill
                          className="rounded-lg object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-product.png';
                          }}
                        />
                      </div>
                      <div className="md:w-2/3">
                        <h4 className="text-lg font-medium">{item.title}</h4>
                        <p className="text-gray-600 dark:text-gray-300 mt-1">
                          ${item.price.toFixed(2)} | Rating: {item.rating}/5
                        </p>
                        <p className="mt-2 text-sm">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm"
                          >
                            <FaOpencart size={16} /> Add to Cart
                          </button>
                          <a
                            href={getPurchaseLink(item)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm"
                          >
                            Buy Now
                          </a>
                          {item.url && (
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-md text-sm"
                            >
                              View Product
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ),
        isBot: true,
      };
      
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, there was an error processing your request.", isBot: true },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${darkMode ? "dark:bg-black" : "bg-gray-50"}`}>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} userId={userId} />

      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-black rounded-lg shadow-lg h-[600px] flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex items-start gap-2 ${message.isBot ? "" : "flex-row-reverse"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center`}>
                  {message.isBot ? <Bot size={30} /> : <User size={30} />}
                </div>
                <div
                  className={`rounded-lg p-4 max-w-[80%] ${
                    message.isBot
                      ? "bg-blue-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                      : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {typing && (
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center">
                  <Bot size={30} />
                </div>
                <div className="bg-blue-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-lg p-4 max-w-[80%]">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"></span>
                    <span className="h-2 w-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce delay-150"></span>
                    <span className="h-2 w-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce delay-300"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t dark:border-gray-800">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 rounded-lg border dark:border-b-gray-900 p-4 focus:outline-white focus:ring-2 focus:ring-blue-500 dark:bg-black dark:text-white"
              />
              <button
                type="submit"
                className="bg-white text-black rounded-lg px-4 py-2 transition-colors flex items-center gap-2 dark:bg-black dark:text-white"
                disabled={!userId || typing}
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBot;