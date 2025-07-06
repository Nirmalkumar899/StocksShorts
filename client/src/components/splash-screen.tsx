import logoImage from "@assets/stocksshorts-logo-new.jpeg";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-black dark:to-gray-900 flex items-center justify-center z-[9999] animate-fade-in">
      <div className="relative flex flex-col items-center space-y-8">
        {/* Animated background circles */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-200 dark:bg-blue-800 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-green-200 dark:bg-green-800 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
        
        {/* Logo with enhanced animation */}
        <div className="relative animate-scale-in">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-full blur-xl opacity-30 animate-shimmer-glow"></div>
          <img 
            src={logoImage} 
            alt="StocksShorts" 
            className="relative h-40 w-auto object-contain shadow-2xl rounded-2xl animate-shimmer-glow"
          />
        </div>
        
        {/* Enhanced brand text */}
        <div className="text-center space-y-2 animate-float-up" style={{ animationDelay: '0.4s' }}>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            StocksShorts
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
            Indian Stock Market News
          </p>
        </div>
        
        {/* Creative loading animation */}
        <div className="flex space-x-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-bounce"></div>
          <div className="w-3 h-3 bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        
        {/* Loading text */}
        <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse-soft" style={{ animationDelay: '0.7s' }}>
          Loading market insights...
        </p>
      </div>
    </div>
  );
}