import { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
import Button from "./Button";

interface QRCodeScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
  onManualInput?: () => void;
  title?: string;
}

export default function QRCodeScanner({
  onScan,
  onClose,
  onManualInput,
  title = "Escanear QR Code",
}: QRCodeScannerProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!isScanning) return;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Não foi possível acessar a câmera");
        setIsScanning(false);
      }
    };

    startCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isScanning]);

  const tick = () => {
    if (!videoRef.current || !canvasRef.current || !isScanning) return;

    if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code) {
        setIsScanning(false);
        onScan(code.data);
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (isScanning) {
      requestRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isScanning]);

  const handleManualInput = () => {
    if (onManualInput) onManualInput();
    else onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
        </div>

        <div className="p-6 space-y-4">
          {error ? (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
              {error}
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg bg-black"
                style={{ aspectRatio: "1" }}
              />
              <canvas ref={canvasRef} className="hidden" />

              <div className="relative">
                <div className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none" />
                <div className="text-center text-sm text-muted-foreground py-4 font-medium animate-pulse">
                  Posicione o QR Code dentro do quadrado
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full"
              onClick={handleManualInput}
            >
              Inserir Manualmente
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
