"use client";

import AuthButtons from "./AuthButtons";
import Border from "./Border";
import Header from "./Header";
import SignUp from "./SignUp";
import SignUpForm from "./SignUpForm";
import React, { useState, useCallback } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {  useWallet } from '@solana/wallet-adapter-react'
function LoginComp() {
  const { publicKey, signMessage } = useWallet();
  const [mode, setMode] = useState("signup");
  const [signature, setSignature] = useState<string | null>(null);

  // const handleSignMessage = useCallback(async () => {
  //   if (!publicKey || !signMessage) {
  //     alert("Please connect your wallet first!");
  //     return;
  //   }

  //   try {
  //     const message = new TextEncoder().encode("Authenticate with Solana via Phantom Wallet");
  //     const signedMessage = await signMessage(message);
  //     const signatureBase64 = Buffer.from(signedMessage).toString("base64");

  //     setSignature(signatureBase64);
  //     alert("Signed message successfully!");
  //   } catch (error) {
  //     console.error("Signing error:", error);
  //     alert("Failed to sign the message.");
  //   }
  // }, [publicKey, signMessage]);

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
          {/* <WalletMultiButton />
          {publicKey && (
            <p className="text-sm mt-2">
              Connected: <span className="font-bold">{publicKey.toBase58()}</span>
            </p>
          )} */}
          {/* <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
            onClick={handleSignMessage}
          >
            Sign Message
          </button> */}
          {/* {signature && (
            <p className="text-sm text-gray-400 mt-2 break-all">
              Signature: {signature}
            </p>
          )} */}
          <Header />
          {mode === "signup" && <SignUp />}
        </div>

        {/* Right Section */}
        <div className="flex flex-col justify-center items-center w-full md:w-1/2 p-6 md:p-10 bg-black">
          <h3 className="text-2xl md:text-3xl font-bold mb-6 text-white">
            {mode === "signup" ? "Sign Up Account" : "Log In Account"}
          </h3>
          <AuthButtons />
          <Border />
          <SignUpForm mode={mode} />
          <p className="mt-4 text-center text-zinc-700">
            {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
            <a
              href="#"
              className="text-white hover:underline"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginComp;
