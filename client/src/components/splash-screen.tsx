export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 flex items-center justify-center z-[9999]">
      <div className="flex flex-col items-center space-y-4">
        {/* Simple logo text */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400">
            StocksShorts
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Indian Stock Market News
          </p>
        </div>
        
        {/* Simple loading animation */}
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Loading...
        </p>
      </div>
    </div>
  );
}