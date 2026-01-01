import { useState, useRef, useEffect } from "react";
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
  mockResult
}: QRCodeScannerProps & { mockResult?: string }) {
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
    };
  }, [isScanning]);

  const handleCapture = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    context.drawImage(videoRef.current, 0, 0);

    // Mock QR Code detection or Use provided Mock Result
    // In production, you would use a library like jsQR or zxing-js
    const result = mockResult || JSON.stringify({
      groupId: `group_${Date.now()}`,
      name: "Grupo Mock",
      species: "Codorna",
      quantity: 100, // Default mock
    });

    onScan(result);
  };

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
                <div className="text-center text-sm text-muted-foreground py-4">
                  Posicione o QR Code dentro do quadrado
                </div>
              </div>
            </>
          )}

          <div className="space-y-3">
            {isScanning && !error && (
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCapture}
              >
                Capturar
              </Button>
            )}

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
