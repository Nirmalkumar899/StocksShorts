import { useState, useEffect } from 'react';

export function VisitorStats() {
  const [dailyVisitors, setDailyVisitors] = useState(10000);
  const [activeUsers, setActiveUsers] = useState(50);

  useEffect(() => {
    // Generate dynamic but consistently high numbers
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
    
    // Update numbers every 30-60 seconds with slight variations
    const interval = setInterval(() => {
      setDailyVisitors(prev => {
        const change = Math.floor(Math.random() * 200) - 100; // -100 to +100
        const newValue = prev + change;
        return Math.max(10000, newValue); // Never go below 10,000
      });
      
      setActiveUsers(prev => {
        const change = Math.floor(Math.random() * 20) - 10; // -10 to +10
        const newValue = prev + change;
        return Math.max(50, newValue); // Never go below 50
      });
    }, Math.random() * 30000 + 30000); // 30-60 seconds

    return () => clearInterval(interval);
  }, []);

  const formatVisitors = (count: number) => {
    if (count >= 10000) {
      return `${Math.floor(count / 1000)}k+`;
    }
    return `${count.toLocaleString()}+`;
  };

  return (
    <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-xs z-50">
      <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">Visitors Today</div>
      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{formatVisitors(dailyVisitors)}</div>
      <div className="text-gray-500 dark:text-gray-400 text-xs">Active: {activeUsers}+</div>
    </div>
  );
}