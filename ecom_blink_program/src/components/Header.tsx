import React from 'react';

const Header: React.FC = () => {
  return (
    <div className="text-center text-white mt-[20rem]">
      <h1 className="text-md md:text-md">Ecommerce Using LLM</h1>
      <h2 className="text-2xl md:text-3xl mt-4">Get Started with Us</h2>
      <p className="mt-4 text-sm md:text-sm w-[15rem] text-zinc-400">
        Complete these easy steps to register your account.
      </p>
    </div>
  );
};

export default Header;
