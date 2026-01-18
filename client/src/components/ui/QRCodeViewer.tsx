import { QRCodeCanvas } from "qrcode.react";
import { useRef } from "react";
import Button from "./Button";

interface QRCodeViewerProps {
  value: string;
  title?: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

// Componente QRCodeViewer
const QRCodeViewer = ({
  value,
  title = "QR Code",
  size = 256,
  level = "H",
  includeMargin = true,
}: QRCodeViewerProps) => {
  const qrRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `qrcode-${Date.now()}.png`;
      link.click();
    }
  };

  const handlePrint = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const printWindow = window.open();
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${title}</title>
              <style>
                body { 
                  display: flex; 
                  flex-direction: column;
                  align-items: center; 
                  justify-content: center; 
                  min-height: 100vh; 
                  font-family: sans-serif;
                }
                h1 { margin-bottom: 20px; font-size: 24px; font-weight: bold; }
                img { max-width: 100%; border: 1px solid #eee; padding: 10px; }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              <img src="${url}" />
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-6 bg-card rounded-lg border border-border">
      <div className="text-center">
        <h3 className="text-2xl font-black text-foreground uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] mt-1">Identificador de Alojamento</p>
      </div>
      <div
        ref={qrRef}
        className="p-4 bg-white rounded-lg shadow-md"
      >
        <QRCodeCanvas
          value={value}
          size={size}
          level={level}
          includeMargin={includeMargin}
        />
      </div>
      <div className="flex gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={handleDownload}
        >
          Baixar
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={handlePrint}
        >
          Imprimir
        </Button>
      </div>
    </div>
  );
};

export default QRCodeViewer;
