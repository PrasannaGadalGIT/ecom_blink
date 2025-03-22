"use client"
import ChatBot from '@/components/ChatBot'
import React from 'react'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
const Chat = () => {
      const { data: session, status } = useSession();
          const router = useRouter();
      if(status !== "authenticated"){
        router.push('/home'); 
      }
  return (
    <div>
        
        <ChatBot/>
    </div>
  )
}

export default Chat