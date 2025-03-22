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
      router.push('/chat'); // Redirect to home if session exists
    } else {
      router.push('/home'); // Redirect to login if no session
    }
  }, [session, router]);

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(18,9,121,1) 11%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 100%)",
    }}>
     
    
    </div>
  );
}

export default App;
