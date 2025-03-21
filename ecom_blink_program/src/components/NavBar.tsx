import React, { useEffect, useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FaOpencart } from "react-icons/fa";
import { Sun, Moon, Send, Bot, User } from "lucide-react";
import { Button } from './ui/button';
import { signOut } from 'next-auth/react';
const NavBar = () => {


  const [darkMode, setDarkMode] = useState(false);

   useEffect(() => {
      document.documentElement.classList.toggle("dark", darkMode);
    }, [darkMode]);
  return (
    <div className="flex justify-between items-center mb-8 w-full p-4">
    <h1 className="text-2xl font-bold dark:text-white flex items-center gap-2">
      <Bot className="w-8 h-8" /> AI E-commerce Assistant
    </h1>

    <div className="flex items-center gap-16">
      
      <Popover>
<PopoverTrigger><FaOpencart size={25} /></PopoverTrigger>
<PopoverContent>Place content for the popover here.</PopoverContent>
</Popover>
      <Button onClick={() => signOut()}>Log Out</Button>
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors"
      >
        {darkMode ? <Sun className="w-6 h-6 text-yellow-400" /> : <Moon className="w-6 h-6 text-gray-600" />}
      </button>
    </div>
  </div>
  )
}

export default NavBar