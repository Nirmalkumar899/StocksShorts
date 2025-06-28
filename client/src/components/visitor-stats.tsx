import { useState, useEffect } from 'react';
import { incrementVisitorCount, getVisitorCounts } from './google-analytics';

export function VisitorStats() {
  const [counts, setCounts] = useState({ session: 0, daily: 0 });

  useEffect(() => {
    // Increment visitor count on first load
    incrementVisitorCount();
    
    // Update displayed counts
    setCounts(getVisitorCounts());
    
    // Update counts every 30 seconds
    const interval = setInterval(() => {
      setCounts(getVisitorCounts());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-20 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border text-xs z-50">
      <div className="text-gray-600 dark:text-gray-300 font-medium mb-1">Visitors Today</div>
      <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{counts.daily}</div>
      <div className="text-gray-500 dark:text-gray-400 text-xs">Session: {counts.session}</div>
    </div>
  );
}