import { useEffect, useRef } from "react";

interface SplashScreenProps {
  onFinished?: () => void;
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.play().catch(() => {
      // If autoplay blocked, skip after 3 seconds
      setTimeout(() => onFinished?.(), 3000);
    });

    const handleEnded = () => {
      onFinished?.();
    };

    // Safety fallback — max 8 seconds
    const fallback = setTimeout(() => onFinished?.(), 8000);

    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("ended", handleEnded);
      clearTimeout(fallback);
    };
  }, [onFinished]);

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
      <video
        ref={videoRef}
        src="/splash.mp4"
        className="w-full h-full object-cover"
        muted
        playsInline
        autoPlay
        preload="auto"
      />
    </div>
  );
}
