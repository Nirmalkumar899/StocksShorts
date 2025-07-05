import logoImage from "@assets/IMG_4184_1751710507049.jpeg";

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-black flex items-center justify-center z-[9999] animate-fade-in">
      <div className="flex flex-col items-center space-y-4">
        <img 
          src={logoImage} 
          alt="StocksShorts" 
          className="h-32 w-auto object-contain animate-pulse"
        />
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}