"use client";
import React, { useState, useEffect, useRef, JSX } from "react";
import { Send, Bot, User } from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image"; // Added Next.js Image component
import axios from "axios";
import { FaOpencart } from "react-icons/fa";

interface Message {
  text: string | JSX.Element;
  isBot: boolean;
}

interface Response {
  Price: number;
  ProductName: string;
  Description: string;
  ImageURL: string;
}

interface ChatResponse {
  description: string;
  imageURL: string;
  price: number;
  productName: string;
}

const BotUI = () => {
  const [typing, setTyping] = useState<boolean>(false);
  const [input, setInput] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const { data: session } = useSession();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isBot: true,
    },
  ]);

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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createChat = async (query: string, responses: ChatResponse[] = []) => {
    try {
      if (!userId) return null;
      const response = await axios.post("/api/prisma/chats", {
        query: query,
        userId: userId,
        responses: responses,
      });
      return response.data.chat.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
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

    const userQuery = input;
    setInput("");

    try {
      const chatId = await createChat(userQuery);
      const response = await axios.post<{ response: Response[] }>("http://127.0.0.1:5000/generate", {
        prompt: userQuery,
      });

      if (response.data && Array.isArray(response.data.response)) {
        const productSuggestions = response.data.response.map((item, index) => (
          <div key={index} className="mb-4">
            <strong className="text-lg">
              {index + 1}. {item.ProductName}
            </strong>
            <div className="relative w-full h-64 my-2">
              <Image
                src={item.ImageURL || '/placeholder-product.png'}
                alt={item.ProductName}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <p className="my-2">
              {item.Description} under price <strong>${item.Price.toFixed(2)}</strong>
            </p>
            <button
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Add to cart <FaOpencart size={20} />
            </button>
          </div>
        ));

        const botMessage: Message = {
          text: <div className="space-y-4">{productSuggestions}</div>,
          isBot: true,
        };

        setMessages((prev) => [...prev, botMessage]);

        if (chatId) {
          const chatResponses = response.data.response.map((item) => ({
            description: item.Description,
            imageURL: item.ImageURL,
            price: item.Price,
            productName: item.ProductName,
          }));

          try {
            await axios.post("/api/prisma/responses", {
              chatId,
              responses: chatResponses,
            });
          } catch (responseError) {
            console.error("Error saving responses:", responseError);
          }
        }
      }
    } catch (error) {
      console.error("Error sending request to backend:", error);
      setMessages((prev) => [
        ...prev,
        { text: "Sorry, there was an error processing your request.", isBot: true },
      ]);
    } finally {
      setTyping(false);
    }
  };

  return (
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
  );
};

export default BotUI;