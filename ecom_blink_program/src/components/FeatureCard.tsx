"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';



export const FeatureCard = ({ icon: Icon, title, description }: { icon: string, title: string, description: string }) => {
    const [ref, inView] = useInView({
      triggerOnce: true,
      threshold: 0.1,
    });
  
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
        transition={{ duration: 0.6 }}
        className="bg-navy-800/50 backdrop-blur-sm p-6 rounded-xl border border-blue-500/20 shadow-lg hover:shadow-blue-500/5 transition-all"
      >
        <div className="flex items-center justify-center w-12 h-12 bg-blue-500/20 rounded-full mb-4">
          <Icon className="w-6 h-6 text-blue-400" />
        </div>
        <h3 className="text-xl font-bold mb-2 text-blue-100">{title}</h3>
        <p className="text-blue-200/70">{description}</p>
      </motion.div>
    );
  };