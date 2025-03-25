"use client"
import React, { useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { FaGoogle } from "react-icons/fa";
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const AuthButtons: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const { data: session } = useSession();
    
    // Memoize createUser function to prevent unnecessary re-renders
    const createUser = useCallback(async () => {
        if (!session?.user?.email) return;

        setLoading(true);
        try {
            const res = await axios.post('/api/prisma/users', {
                email: session.user.email,
                username: session.user.name
            });

            console.log("User created successfully:", res.data);
            router.push('/');
        } catch (err) {
            console.error("Error creating user:", err);
            setError('Failed to create user');
        } finally {
            setLoading(false);
        }
    }, [session?.user?.email, session?.user?.name, router]);

    useEffect(() => {
        console.log("Session : ", session?.user?.email);
        if (session?.user?.email) {
            createUser();
        }
    }, [session?.user?.email, createUser]); // Dependencies are now stable

    return (
        <div className="flex flex-col sm:flex-row gap-4 my-4">
            <Button 
                disabled={loading}
                className="flex-1 border border-zinc-800 text-white w-[18rem] py-6 rounded-lg font-medium flex items-center justify-center gap-2" 
                onClick={() => signIn("google")}
            >
                <FaGoogle /> <span>Continue with Google</span>
            </Button>

            {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
    );
};

export default AuthButtons;
