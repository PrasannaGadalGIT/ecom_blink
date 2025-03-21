import React from 'react';
import { Button } from './ui/button';

const SignUp: React.FC = () => {
  return (
    <div className="mt-8 space-y-2 w-[20rem] flex flex-col justify-center bg-black">
      <Button className='w-full py-4  px-4 rounded-lg font-medium shadow-md'> Sign up your account</Button>
    </div>
  );
};

export default SignUp;
