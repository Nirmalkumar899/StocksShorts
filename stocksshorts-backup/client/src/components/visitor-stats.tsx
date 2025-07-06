import { useState, useEffect } from 'react';

export function VisitorStats() {
  const [dailyVisitors, setDailyVisitors] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(50);
  const [isVisible, setIsVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Generate dynamic but consistently high numbers that only increase
    const generateDailyVisitors = () => {
      const base = 10000;
      const variation = Math.floor(Math.random() * 5000) + 1000; // 1000-6000 variation
      return base + variation;
    };

    const generateActiveUsers = () => {
      const base = 50;
      const variation = Math.floor(Math.random() * 150) + 25; // 25-175 variation
      return base + variation;
    };

    // Set initial values
    setDailyVisitors(generateDailyVisitors());
    setActiveUsers(generateActiveUsers());
    
    // Show for 3 seconds, then fade out over 1 second
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
      // Hide completely after fade animation
      setTimeout(() => {
        setIsVisible(false);
      }, 1000);
    }, 3000);
    
    // Update numbers every 30-60 seconds with only increases (no decreases)
    const interval = setInterval(() => {
      setDailyVisitors(prev => {
        const increase = Math.floor(Math.random() * 100) + 10; // Always increase by 10-110
        return prev + increase;
      });
      
      setActiveUsers(prev => {
        const increase = Math.floor(Math.random() * 10) + 1; // Always increase by 1-11
        return prev + increase;
      });
    }, Math.random() * 30000 + 30000); // 30-60 seconds

    return () => {
      clearTimeout(fadeOutTimer);
      clearInterval(interval);
    };
  }, []);

  const formatVisitors = (count: number) => {
    if (count >= 10000) {
      return `${Math.floor(count / 1000)}k+`;
    }
    return `${count.toLocaleString()}+`;
  };

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-xs z-50 transition-opacity duration-1000"
      style={{ opacity }}
    >
      <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">Visitors Today</div>
      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatVisitors(dailyVisitors)}</div>
      <div className="text-gray-500 dark:text-gray-400 text-xs">Active: {activeUsers}+</div>
    </div>
  );
}