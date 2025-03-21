"use client";
import React, { useEffect, useState } from 'react';
import ChatBot from '../components/ChatBot';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

function App() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  useEffect(() => {
  


    if (status=="authenticated") {
      router.push('/'); // Redirect to home if session exists
    } else {
      router.push('/login'); // Redirect to login if no session
    }
  }, [session, router]);

  return (
    <div>
      
      <ChatBot />
    </div>
  );
}

export default App;
