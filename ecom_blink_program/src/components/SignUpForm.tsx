import React, { useState } from 'react';
import { Button } from './ui/button';
import axios from 'axios';

interface SignUpForm {
  mode: string,
}
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@project-serum/anchor";


const SignUpForm: React.FC<SignUpForm> = ({ mode }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  
  
   
   const { publicKey, wallet } = useWallet();
  


  const handleChange = async(e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };



 const handleSubmit = async(e: React.FormEvent) => {
  e.preventDefault();

  if(!publicKey || !wallet){
    alert("Please connect your wallet");
    return;
  }

 
 }


  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   console.log(formData);
  //   const res =  axios.post('http://localhost:3001/users', {
  //     firstName: formData.firstName,
  //     lastName: formData.lastName,
  //     email : formData.email,
  //     password : formData.password,
  //     walletAddress : walletAddress
  //   })
  //   .then(function (response) {
  //     console.log(response);
  //   })
  //   .catch(function (error) {
  //     console.log(error);
  //   });


  //   console.log(res)
  // };

  const inputStyle = "w-full mt-2 px-4 py-2 border text-sm rounded-lg bg-zinc-800 border-none"
  return (

    <form className="space-y-4 text-white" onSubmit={handleSubmit}>



      {mode === "signup" && (<div className="flex flex-col sm:flex-row gap-4">


        <div className=' flex flex-col'>
          <label htmlFor="" className=' text-white'>First Name</label>
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            className={inputStyle}
            value={formData.firstName}
            onChange={handleChange}
          />
        </div>
        <div className=' flex flex-col'>
          <label htmlFor="" className=' text-white'>Last Name</label>
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            className={inputStyle}
            value={formData.lastName}
            onChange={handleChange}
          />
        </div>
      </div>)}
      <div>
        <label htmlFor="" className=' text-white'>Email</label>
        <input
          type="email"
          name="email"
          placeholder="Email"
          className={inputStyle}
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div>
        <label htmlFor="" className=' text-white'>Password</label>
        <input
          type="password"
          name="password"
          placeholder="Password"
          className={inputStyle}
          value={formData.password}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        className="w-full bg-zinc-900 text-white py-2 rounded-lg font-medium hover:bg-white hover:text-black mt-2"
      >
        Sign Up
      </Button>
    </form>
  );
};

export default SignUpForm;
function clusterApiUrl(arg0: string): any {
  throw new Error('Function not implemented.');
}

