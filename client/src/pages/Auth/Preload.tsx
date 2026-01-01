import { useEffect, useState } from "react";

export default function Preload() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#f97316] z-50 overflow-hidden">
      {/* Background Micro-details */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl animate-pulse">🥚</div>
        <div className="absolute bottom-20 right-10 text-6xl animate-bounce delay-150">📦</div>
        <div className="absolute top-1/4 right-20 text-5xl animate-bounce">🐣</div>
        <div className="absolute bottom-1/4 left-20 text-5xl animate-pulse delay-300">🌾</div>
      </div>

      {/* Main Content Container */}
      <div className="relative flex flex-col items-center z-10 text-center">
        {/* Official Logo with ripple effect */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-white/20 rounded-full animate-ping scale-110" />
          <img
            src="/logo.jpg"
            alt="Logo"
            className="w-32 h-32 rounded-full border-4 border-white/50 shadow-2xl relative z-10 object-cover"
          />
        </div>

        {/* Brand Name */}
        <h1 className="text-4xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
          Codornas do Sertão
        </h1>
        <p className="text-orange-100 font-medium mb-8 text-lg opacity-90">
          Excelência em Produção de Codornas
        </p>

        {/* Modern Progress Indicator */}
        <div className="w-64 h-2 bg-white/20 rounded-full overflow-hidden border border-white/10">
          <div
            className="h-full bg-white rounded-full"
            style={{
              width: '0%',
              animation: 'progress 5s linear forwards'
            }}
          />
        </div>
        <span className="mt-4 text-white/70 text-sm font-semibold uppercase tracking-widest animate-pulse">
          Iniciando Sistema...
        </span>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}} />
    </div>
  );
}
