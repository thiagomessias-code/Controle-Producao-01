import React from "react";

interface AnimatedLoadingProps {
  message?: string;
  type?: "egg" | "quail" | "spinner";
  fullScreen?: boolean;
}

export default function AnimatedLoading({
  message = "Carregando...",
  type = "egg",
  fullScreen = false,
}: AnimatedLoadingProps) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 text-center">
          <LoadingAnimation type={type} />
          <p className="mt-4 text-foreground font-medium">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <LoadingAnimation type={type} />
      <p className="mt-4 text-foreground font-medium">{message}</p>
    </div>
  );
}

function LoadingAnimation({ type }: { type: "egg" | "quail" | "spinner" }) {
  if (type === "egg") {
    return (
      <div className="w-16 h-20 relative">
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-20px); }
          }
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .egg-1 { animation: bounce 0.6s ease-in-out infinite; }
          .egg-2 { animation: bounce 0.6s ease-in-out infinite 0.2s; }
          .egg-3 { animation: bounce 0.6s ease-in-out infinite 0.4s; }
        `}</style>
        
        <div className="flex justify-center gap-2">
          {/* Egg 1 */}
          <div className="egg-1">
            <svg
              width="40"
              height="50"
              viewBox="0 0 40 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="20" cy="25" rx="15" ry="20" fill="#FDB913" stroke="#F59E0B" strokeWidth="2" />
              <ellipse cx="20" cy="15" rx="8" ry="6" fill="#FEE8C3" opacity="0.6" />
            </svg>
          </div>

          {/* Egg 2 */}
          <div className="egg-2">
            <svg
              width="40"
              height="50"
              viewBox="0 0 40 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="20" cy="25" rx="15" ry="20" fill="#F59E0B" stroke="#D97706" strokeWidth="2" />
              <ellipse cx="20" cy="15" rx="8" ry="6" fill="#FEE8C3" opacity="0.6" />
            </svg>
          </div>

          {/* Egg 3 */}
          <div className="egg-3">
            <svg
              width="40"
              height="50"
              viewBox="0 0 40 50"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="20" cy="25" rx="15" ry="20" fill="#FBBF24" stroke="#F59E0B" strokeWidth="2" />
              <ellipse cx="20" cy="15" rx="8" ry="6" fill="#FEE8C3" opacity="0.6" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  if (type === "quail") {
    return (
      <div className="w-20 h-20 relative">
        <style>{`
          @keyframes quailBounce {
            0%, 100% { transform: translateY(0) scaleX(1); }
            50% { transform: translateY(-15px) scaleX(1.1); }
          }
          .quail { animation: quailBounce 0.8s ease-in-out infinite; }
        `}</style>
        
        <div className="quail flex justify-center">
          <svg
            width="60"
            height="50"
            viewBox="0 0 60 50"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body */}
            <ellipse cx="30" cy="28" rx="18" ry="15" fill="#8B5A3C" stroke="#6B4423" strokeWidth="1.5" />
            
            {/* Head */}
            <circle cx="42" cy="18" r="8" fill="#8B5A3C" stroke="#6B4423" strokeWidth="1.5" />
            
            {/* Eye */}
            <circle cx="45" cy="16" r="2" fill="#000" />
            
            {/* Beak */}
            <path d="M 50 18 L 55 17 L 50 19 Z" fill="#D4A574" stroke="#8B5A3C" strokeWidth="1" />
            
            {/* Spots */}
            <circle cx="25" cy="25" r="2" fill="#6B4423" opacity="0.5" />
            <circle cx="35" cy="30" r="2" fill="#6B4423" opacity="0.5" />
            <circle cx="28" cy="35" r="1.5" fill="#6B4423" opacity="0.5" />
            
            {/* Feet */}
            <line x1="24" y1="42" x2="24" y2="48" stroke="#8B5A3C" strokeWidth="1.5" />
            <line x1="36" y1="42" x2="36" y2="48" stroke="#8B5A3C" strokeWidth="1.5" />
            <path d="M 22 48 L 26 48" stroke="#8B5A3C" strokeWidth="1.5" />
            <path d="M 34 48 L 38 48" stroke="#8B5A3C" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    );
  }

  // Default spinner
  return (
    <div className="w-12 h-12">
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner { animation: spin 1s linear infinite; }
      `}</style>
      
      <svg
        className="spinner"
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="#E5E7EB"
          strokeWidth="4"
        />
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="#3B82F6"
          strokeWidth="4"
          strokeDasharray="31.4 125.6"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
