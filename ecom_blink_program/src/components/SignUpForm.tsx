import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import AuthButtons from "./AuthButtons";

interface SignUpFormProps {
  mode: 'signup' | 'login';
}

const SignUpForm: React.FC<SignUpFormProps> = ({ mode: initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Validation
      if (mode === 'signup') {
        if (formData.password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        if (!formData.username.trim()) {
          throw new Error('Username is required');
        }
      }

      const endpoint = mode === 'signup' 
        ? '/api/auth/register' 
        : '/api/auth/login';
      
      // Make the request and capture response, but don't assign to unused variable
      const response = await axios.post(endpoint, formData);
      
      // Use response data if needed for specific actions
      if (response.data?.userId) {
        // Example of using the data if needed
        console.log(`User authenticated with ID: ${response.data.userId}`);
      }
      
      if (mode === 'signup') {
        setMessage('Registration successful! Please log in with your credentials.');
        // Clear password but keep email for convenience
        setFormData(prev => ({
          ...prev,
          password: '',
          username: ''
        }));
        // Change to login mode
        setMode('login');
      } else {
        setMessage('Login successful! Redirecting...');
        setTimeout(() => router.push('/'), 1500);
      }
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) 
        ? error.response?.data?.error || error.message
        : error instanceof Error 
          ? error.message 
          : 'An unknown error occurred';
      setMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const inputStyle = "w-full mt-2 px-4 py-2 border text-sm rounded-lg bg-zinc-800 border-none";

  // Reset message when mode changes
  useEffect(() => {
    setMessage('');
  }, [mode]);

  return (
    <div className="text-white space-y-6">
      <h2 className="text-xl font-semibold flex items-center justify-center">
        {mode === 'signup' ? 'Create an Account' : 'Log In'}
      </h2>
      <AuthButtons />
      <form className="space-y-4 w-full max-w-sm" onSubmit={handleSubmit}>
        {mode === 'signup' && (
          <div>
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter a username"
              value={formData.username}
              onChange={handleChange}
              required
              className={inputStyle}
              aria-label="Enter your username"
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            className={inputStyle}
            aria-label="Enter your email"
          />
        </div>
        
        <div>
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder={mode === 'signup' ? 'Create a password (min 8 chars)' : 'Enter your password'}
            value={formData.password}
            onChange={handleChange}
            required
            minLength={mode === 'signup' ? 8 : undefined}
            className={inputStyle}
            aria-label={mode === 'signup' ? 'Create password' : 'Enter password'}
          />
        </div>
        
        <Button
          type="submit"
          className="w-full bg-zinc-900 text-white py-2 rounded-lg font-medium hover:bg-white hover:text-black mt-2"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Processing...' : mode === 'signup' ? 'Sign Up' : 'Log In'}
        </Button>

        {mode === 'signup' ? (
          <p className="text-sm text-center mt-4">
            Already have an account?{' '}
            <button 
              type="button"
              onClick={() => setMode('login')} 
              className="text-blue-400 hover:underline"
            >
              Log in
            </button>
          </p>
        ) : initialMode === 'signup' && (
          <p className="text-sm text-center mt-4">
            Need an account?{' '}
            <button 
              type="button"
              onClick={() => setMode('signup')} 
              className="text-blue-400 hover:underline"
            >
              Sign up
            </button>
          </p>
        )}
      </form>

      {message && (
        <p className={`text-sm ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SignUpForm;