"use client";
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { useSession } from 'next-auth/react';

function App() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  useEffect(() => {
  


    if (status=="authenticated") {
      router.push('/chat'); 
    } else {
      router.push('/home'); 
    }
  }, [session, router, status]);

  return (
    <div style={{
      background: "linear-gradient(180deg, rgba(18,9,121,1) 11%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 100%)",
    }}>
     
    
    </div>
  );
}

export default App;
