import { useEffect, useState } from "react";

export default function Preload() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 z-50">
      {/* Animated Egg */}
      <div className="relative w-32 h-40 mb-8">
        {/* Egg Shell */}
        <svg
          className="w-full h-full animate-bounce"
          viewBox="0 0 100 120"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Egg shape */}
          <defs>
            <linearGradient id="eggGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: "#fff9e6", stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: "#ffe6cc", stopOpacity: 1 }} />
            </linearGradient>
          </defs>

          {/* Main egg body */}
          <ellipse
            cx="50"
            cy="60"
            rx="35"
            ry="45"
            fill="url(#eggGradient)"
            stroke="#d4a574"
            strokeWidth="2"
          />

          {/* Egg shine */}
          <ellipse
            cx="40"
            cy="40"
            rx="12"
            ry="18"
            fill="white"
            opacity="0.6"
          />

          {/* Cracks animation */}
          <g className="animate-pulse" opacity="0.5">
            <path
              d="M 50 20 Q 45 35 50 50"
              stroke="#d4a574"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M 50 20 Q 55 35 50 50"
              stroke="#d4a574"
              strokeWidth="1.5"
              fill="none"
            />
          </g>
        </svg>

        {/* Rotating circle around egg */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute w-40 h-40 border-4 border-transparent border-t-blue-500 border-r-blue-300 rounded-full animate-spin" />
        </div>
      </div>

      {/* Loading text */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Codornas do Sertão
      </h1>
      <p className="text-gray-600 text-lg mb-8">Carregando...</p>

      {/* Progress bar */}
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" />
      </div>

      {/* Decorative birds */}
      <div className="absolute bottom-8 left-8 text-4xl animate-bounce" style={{ animationDelay: "0s" }}>
        🐔
      </div>
      <div className="absolute bottom-8 right-8 text-4xl animate-bounce" style={{ animationDelay: "0.2s" }}>
        🐓
      </div>
    </div>
  );
}
