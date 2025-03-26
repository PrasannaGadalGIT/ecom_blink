"use client";
import React, { useState, useEffect, useRef, JSX, useCallback } from "react";
import {  Send, Bot, User } from "lucide-react";
import {  useSession } from "next-auth/react";
import axios from "axios";
import { FaOpencart } from "react-icons/fa";
import { useAppDispatch } from "@/lib/hooks";



import { addToCartAsync } from "@/lib/features/cart/cartSlice";
import Navbar from "./NavBar";
import { title } from "process";
interface Message {
  text: string | JSX.Element; // Allow JSX elements
  isBot: boolean;
}

interface Response {
  generated_response: string;
  products: Products[]
}

interface Products{
  description: string;
  image_url: string;
  price: number;
  title: string;
  rating: number
}

interface ChatResponse {
  description: string;
  image_url: string;
  price: number;
  title: string;
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
      text: "Hello! I'm your AI assistant. How can I help you today?",
      isBot: true,
    },
  ]);
  // const cartItems = useAppSelector((state) => state.cart.items);
  // const router = useRouter();
  
  const getPurchaseLink = (product: Products) => {
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


  const getChats = useCallback(async (userId: number) => {
    try {
      const response = await axios.get(`/api/prisma/chats?userId=${userId}`);
      console.log(response)
      if (response.data && Array.isArray(response.data)) {
        const chatHistory: Message[] = [];
  
        response.data.forEach((chat) => {
          chatHistory.push({
            text: chat.query,
            isBot: false,
          });

          console.log(response)
        
          if (chat.responses && Array.isArray(chat.responses)) {
            const botMessage: Message = {
              text: (
                <div>
                  {chat.responses.map((item: Products, index: number) => (
                    <div key={index}>
                      <br />
                      <strong>{index + 1}. {item.title}</strong>
                      <br /><br />
                     
                      <div className="relative w-[400px] h-[300px] mb-4">
                        <img 
                          src={item?.image_url} 
                          alt={item.title} 
                       
                          className="rounded-lg object-contain"
                        />
                      </div>
                      <p>
                        <strong>Description: </strong>{item.description} <br /><br /> under price <strong>$ {item.price}</strong>
                      </p>
                      <br />
                      <button
                        onClick={() =>
                          handleAddToCart({
                            title: item.title,
                            image_url: item.image_url,
                            description: item.description,
                            price: item.price,
                            userId: userId,
                          })
                        }
                        className="flex bg-black text-white px-3 py-2 rounded-md no-underline max-w-full break-words"
                      >
                        Add to cart <FaOpencart size={25} className="ml-2" />
                      </button>
                      <br /><br />
                    </div>
                  ))}
                </div>
              ),
              isBot: true,
            };
            chatHistory.push(botMessage);
          }
        });
  
        setMessages(chatHistory);
      }
    } catch (error) {
      console.error("Error fetching chats:", error);
    }
  }, []);
  
 
  useEffect(() => {
    if (userId) {
      getChats(userId);
    }
  }, [userId, getChats]);
  



  // Create a new chat in the database
  const createChat = async (query: string, responses: Products[]) => {
    try {
      if (!userId) return null;

      const response = await axios.post("/api/prisma/chats", {
        query: query,
        userId: userId,
        responses: responses,
      });

      console.log(responses)

      return response.data.chat.id;
    } catch (error) {
      console.error("Error creating chat:", error);
      return null;
    }
  };
  const dispatch = useAppDispatch();
  // const [loading, setLoading] = useState(false);
  const handleAddToCart =async (cartDetail: {
    title: string;
    image_url: string;
    description: string;
    price: number;
    userId: number
  }) => {
    dispatch(addToCartAsync({
      productName: cartDetail.title,
      price: cartDetail.price,
      description: cartDetail.description,
      imageUrl: cartDetail.image_url,
      userId: cartDetail.userId,
      quantity: 1
    }));
  
    try {
      await axios.post("/api/prisma/cart/add", {
        userId,
        title: cartDetail.title,
        imageURL: cartDetail.image_url,
        description: cartDetail.description,
        price: cartDetail.price,
        quantity: 1,
      });
    
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart.");
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
      const response = await axios.post<Response>("http://127.0.0.1:8000/search", {
        query: userQuery,
      });
    
      const chatId = await createChat(userQuery, response.data.products);
    
      if (response.data) {
        const productSuggestions = response.data.products.map((item, index) => (
          <div key={index}>
            <br />
            <strong>{index + 1}. {item.title}</strong>
            <br />
            <br />
            <img
              src={item?.image_url}
              alt={item.title}
              width={300}
              className="mb-4 rounded-lg"
            />
            <p>
              <strong>Description: </strong>{item.description} <br/><br/> under price <strong>$ {item.price}</strong>
            </p>
            <p>
              <strong>Rating: </strong>{item.rating}
            </p>
            <br />
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleAddToCart({
                    title: item.title,
                    image_url: item.image_url,
                    description: item.description,
                    price: item.price,
                    userId: userId,
                  })
                }
                className="flex bg-black text-white px-3 py-2 rounded-md no-underline max-w-full break-words"
              >
                Add to cart <FaOpencart size={25} className="ml-2" />
              </button>
              <a
                href={getPurchaseLink(item)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex bg-blue-600 text-white px-3 py-2 rounded-md no-underline max-w-full break-words items-center"
              >
                Buy Now
              </a>
            </div>
            <br />
            <br />
          </div>
        ));
     
        const botMessage: Message = {
          text: <div>{productSuggestions}</div>,
          isBot: true,
        };
  
        setMessages((prev) => [...prev, botMessage]);
  
        if (chatId) {
          const chatResponses = response.data.products.map((item) => ({
            description: item.description,
            imageURL: item.image_url,
            price: item.price,
            title: item.title,
            rating: item.rating
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