import { useRoute } from "wouter";
import QRCodeViewer from "@/components/ui/QRCodeViewer";
import Loading from "@/components/ui/Loading";
import { useBatchById } from "@/hooks/useBatches";

export default function GroupQRCode() {
  const [, params] = useRoute("/batches/:id/qrcode");
  const groupId = params?.id || "";

  const { batch: group, isLoading } = useBatchById(groupId);

  if (isLoading || !group) {
    return <Loading fullScreen message="Carregando QR Code..." />;
  }

  const qrValue = JSON.stringify({
    groupId: group.id,
    name: group.name,
    species: group.species,
    quantity: group.quantity,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">QR Code do Grupo</h1>
        <p className="text-muted-foreground mt-1">{group.name}</p>
      </div>

      <div className="flex justify-center">
        <QRCodeViewer
          value={qrValue}
          title={`QR Code - ${group.name}`}
          size={300}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Informações do Grupo</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>
            <strong>Nome:</strong> {group.name}
          </li>
          <li>
            <strong>Espécie:</strong> {group.species}
          </li>
          <li>
            <strong>Quantidade:</strong> {group.quantity}
          </li>
          <li>
            <strong>ID:</strong> {group.id}
          </li>
        </ul>
      </div>
    </div>
  );
}
