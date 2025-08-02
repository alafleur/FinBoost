import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BookOpen, Award, Zap } from 'lucide-react';

interface FlywheelStep {
  icon: React.ReactNode;
  title: string;
  color: string;
  bgColor: string;
}

export default function FlywheelGraphic() {
  const [isSpinning, setIsSpinning] = useState(false);
  
  // Define the steps in the flywheel
  const steps: FlywheelStep[] = [
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Learn",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: "Earn",
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Reward",
      color: "text-amber-600",
      bgColor: "bg-amber-100"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Improve",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    }
  ];
  
  // Start spinning when the component loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpinning(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="relative h-64 md:h-80 w-full flex items-center justify-center">
      {/* Center hub */}
      <div className="absolute z-10 rounded-full w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-xs">GROWTH</span>
      </div>
      
      {/* Flywheel ring */}
      <motion.div 
        className="absolute w-64 h-64 md:w-72 md:h-72 rounded-full border-4 border-gray-200"
        animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
        transition={{ 
          repeat: Infinity, 
          duration: 20, 
          ease: "linear" 
        }}
      >
        {/* Steps positioned around the wheel */}
        {steps.map((step, index) => {
          // Calculate the position around the circle
          const angle = (index * 90) * (Math.PI / 180);
          const radius = 120; // pixels from center
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <motion.div
              key={index}
              className={`absolute w-16 h-16 rounded-full ${step.bgColor} flex flex-col items-center justify-center shadow-md border-2 border-white`}
              style={{
                x: x,
                y: y,
                left: '50%',
                top: '50%',
                marginLeft: -32,
                marginTop: -32
              }}
              // Counter-rotate to keep the icons upright
              animate={isSpinning ? { rotate: -360 } : { rotate: 0 }}
              transition={{ 
                repeat: Infinity, 
                duration: 20, 
                ease: "linear" 
              }}
            >
              <div className={step.color}>{step.icon}</div>
              <span className="text-xs font-medium mt-1">{step.title}</span>
            </motion.div>
          );
        })}
      </motion.div>
      
      {/* Connecting lines */}
      <svg className="absolute w-full h-full" viewBox="0 0 300 300">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#9ca3af" />
          </marker>
        </defs>
        <motion.g
          animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
          transition={{ 
            repeat: Infinity, 
            duration: 20, 
            ease: "linear" 
          }}
          style={{
            transformOrigin: 'center',
          }}
        >
          <path 
            d="M150,90 C190,90 210,100 210,150" 
            stroke="#9ca3af" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
          <path 
            d="M210,150 C210,190 190,210 150,210" 
            stroke="#9ca3af" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
          <path 
            d="M150,210 C110,210 90,190 90,150" 
            stroke="#9ca3af" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
          <path 
            d="M90,150 C90,110 110,90 150,90" 
            stroke="#9ca3af" 
            strokeWidth="2" 
            fill="none" 
            strokeDasharray="4 2"
            markerEnd="url(#arrowhead)"
          />
        </motion.g>
      </svg>
    </div>
  );
}