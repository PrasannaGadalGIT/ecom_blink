"use client"
import ChatBot from '@/components/ChatBot'
import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
const Chat = () => {
      const {  status } = useSession();
          const router = useRouter();
      
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/login');
    }
  }, [status, router]);

  if (status === "loading") {
    return (
        <span className="ml-2">Checking authentication...</span>
    );
  }

  if (status !== "authenticated") {
    return null; // Will redirect from useEffect
  }
  return (
    <div>
        
        <ChatBot/>
    </div>
  )
}

export default Chat