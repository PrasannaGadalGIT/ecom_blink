"use client";
import React, { useState, useEffect, useRef, JSX } from "react";
import {  Send, Bot, User } from "lucide-react";
import {  useSession } from "next-auth/react";
import axios from "axios";
import { FaOpencart } from "react-icons/fa";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";

import { useRouter } from "next/navigation";

import { addToCartAsync } from "@/lib/features/cart/cartSlice";
import Navbar from "./NavBar";
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
  imageURL: string;
  price: number;
  productName: string;
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
  const cartItems = useAppSelector((state) => state.cart.items);
  const router = useRouter();
  


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


  const getChats = async (userId: number) => {
    try {
      const response = await axios.get(`/api/prisma/chats?userId=${userId}`);
      
      if (response.data && Array.isArray(response.data)) {
        const chatHistory: Message[] = [];
  
        response.data.forEach((chat: any) => {
          
          chatHistory.push({
            text: chat.query,
            isBot: false,
          });
        
         
          if (chat.responses && Array.isArray(chat.responses)) {
            const botMessage: Message = {
              text: (
                <div>
                  {chat.responses.map((item: any, index: number) => (
                    <div key={index}>
                      <br />
                      <strong>{index + 1}. {item.productName}</strong>
                      <br /><br />
                      <img src={item.imageURL} alt={item.productName} width={400} className="mb-4 rounded-lg" />
                      <p>
                        <strong>Description: </strong>{item.description} <br /><br /> under price <strong>$ {item.price}</strong>
                      </p>
                      <br />
                      <button
                        onClick={() =>
                          handleAddToCart({
                            productName: item.productName,
                            imageUrl: item.imageURL,
                            description: item.description,
                            price: item.price,
                            userId: userId,
                          })
                        }
                        style={{
                          display: "flex",
                          backgroundColor: "black",
                          color: "white",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          textDecoration: "none",
                          maxWidth: "100%",
                          wordBreak: "break-word",
                        }}
                      >
                        Add to cart <FaOpencart size={25} className=" ml-2" />
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
  };
  
 
  useEffect(() => {
    if (userId) {
      getChats(userId);
    }
  }, [userId]);
  



  // Create a new chat in the database
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
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const handleAddToCart =async (cartDetail: {
    productName: string;
    imageUrl: string;
    description: string;
    price: number;
    userId: number
  }) => {
    dispatch(addToCartAsync({
      productName: cartDetail.productName,
      price: cartDetail.price,
      description: cartDetail.description,
      imageUrl: cartDetail.imageUrl,
      userId: cartDetail.userId,
      quantity: 1
    }));
    setLoading(true);
    try {
      await axios.post("/api/prisma/cart/add", {
        userId,
        productName: cartDetail.productName,
        imageURL: cartDetail.imageUrl,
        description: cartDetail.description,
        price: cartDetail.price,
        quantity: 1,
      });
    
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add item to cart.");
    }
    setLoading(false);
  };


  const [generated_responses, setGeneratedResponse] = useState("")
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
   
  
   
      const response = await axios.post<Response>("http://127.0.0.1:8000/search", {
        query: userQuery,
      });
      
   
      console.log(response)
    
      if (response.data ) {
        
        const productSuggestions = response.data.products.map((item, index) => (
          <div key={index}>
            <br />
            
            <strong>
              {index + 1}. {item.title}
            </strong>
            <br />
            <br />
            <img
              src={item.image_url}
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
            <button
              onClick={() =>
                handleAddToCart({
                  productName: item.title,
                  imageUrl: item.image_url,
                  description: item.description,
                  price: item.price,
                  userId: userId,
                })
              }
              style={{
                display: "flex",
                backgroundColor: "black",
                color: "white",
                padding: "8px 12px",
                borderRadius: "6px",
                textDecoration: "none",
                maxWidth: "100%",
                wordBreak: "break-word",
              }}
            >
              Add to cart <FaOpencart size={25} className=" ml-2" />
            </button>
            <br />
            <br />
          </div>
        ));
     
        console.log(response.data.generated_response)
        const botMessage: Message = {
          text: <div>{response.data.generated_response}<br/>{productSuggestions}</div>,
          isBot: true,
        };
  
        setMessages((prev) => [...prev, botMessage]);
  
        // Save the responses to the database
        if (chatId) {
          const chatResponses = response.data.products.map((item) => ({
            description: item.description,
            imageURL: item.image_url,
            price: item.price,
            productName: item.title,
            rating: item.rating
          }));
  
          console.log("Chat Responses:", chatResponses);
  
          try {
            await axios.post("/api/prisma/responses", {
              chatId, // Include chatId here
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