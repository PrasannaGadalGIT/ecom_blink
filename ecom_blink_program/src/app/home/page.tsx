"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Bot, Brain, ShoppingBag, Coins, Shield,  } from 'lucide-react';
import { FeatureCard } from '@/components/FeatureCard';



function App() {
  const [heroRef, heroInView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div className="min-h-screen  text-white"  style={{
        background: "linear-gradient(180deg, rgba(18,9,121,1) 11%, rgba(0,0,0,1) 50%, rgba(0,0,0,1) 100%)",
      }}>
    
      <motion.div
        ref={heroRef}
        initial={{ opacity: 0 }}
        animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 1 }}
        className="min-h-screen flex flex-col items-center justify-center text-center px-4 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent pointer-events-none" />
        <Bot className="w-20 h-20 text-blue-400 mb-8" />
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          AI-Powered E-Commerce Assistant
        </h1>
        <p className="text-xl text-blue-200/80 max-w-2xl mb-8">
          Experience the future of online shopping with our Solana-integrated AI assistant. Smart recommendations, secure transactions, and lightning-fast blockchain payments.
        </p>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-black text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-blue-950 transition-colors"
          onClick={() => window.location.href = '/login'}
        >
          Start Shopping
        </motion.button>
      </motion.div>

      {/* Features Section */}
      <div className="py-20 px-4 max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-center mb-16 text-blue-100">Revolutionizing E-Commerce</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          <FeatureCard
            icon={Brain}
            title="AI-Powered Shopping"
            description="Smart product recommendations and personalized shopping experiences tailored to your preferences."
          />
          <FeatureCard
            icon={Coins}
            title="Solana Integration"
            description="Lightning-fast transactions and minimal fees using Solana blockchain technology."
          />
          <FeatureCard
            icon={ShoppingBag}
            title="Smart Cart"
            description="Intelligent shopping cart that optimizes your purchases and finds the best deals."
          />
          <FeatureCard
            icon={Shield}
            title="Secure Transactions"
            description="Advanced blockchain security ensuring your payments and data are protected."
          />
          
        </div>
      </div>

      {/* Demo Section */}
      <div className="bg-navy-900/50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="bg-navy-800/50 backdrop-blur-sm p-8 rounded-2xl border border-blue-500/20 shadow-xl"
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Bot className="w-10 h-10 text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-blue-100">
                  Hello! I'm your AI shopping assistant. I can help you find products, compare prices, and process Solana payments instantly. What would you like to shop for today?
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      
    </div>
  );
}

export default App;