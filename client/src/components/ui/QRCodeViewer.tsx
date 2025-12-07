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
                body { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
                img { max-width: 100%; }
              </style>
            </head>
            <body>
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
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
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
