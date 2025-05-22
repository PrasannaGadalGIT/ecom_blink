"use client";
import Header from "./Header";
import SignUpForm from "./SignUpForm";
import React, { useState } from "react";
import { Button } from "./ui/button";

type AuthMode = "signup" | "login";

const LoginComp: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>("signup");
  
  const toggleMode = (): void => {
    setMode(mode === "signup" ? "login" : "signup");
  };
  
  return (
    <div className="bg-black">
      <div className="flex flex-col md:flex-row h-screen items-center pl-4">
        {/* Left Section */}
        <div
          className="flex flex-col h-[95%] justify-center items-center text-white w-full md:w-[70%] p-6 md:p-10 rounded-2xl"
          style={{
            background: "linear-gradient(180deg, rgba(18,9,121,1) 11%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 100%)",
          }}
        >
          <Header />
          <Button
            type="submit"
            className="w-[20rem] bg-zinc-900 text-white py-2 rounded-lg font-medium hover:bg-white hover:text-black mt-2"
            onClick={toggleMode}
          >
            {mode === 'signup' ? 'Log In' : 'Sign Up'}
          </Button>
        </div>
        
        {/* Right Section */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-6 md:p-10 bg-black">
          <SignUpForm mode={mode} />
        </div>
      </div>
    </div>
  );
};

export default LoginComp;