import { Cage } from "@/api/cages";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { formatQuantity } from "@/utils/format";
import { useLocation } from "wouter";

interface CageListProps {
    cages: Cage[];
}

export default function CageList({ cages }: CageListProps) {
    const [, setLocation] = useLocation();

    if (cages.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-muted-foreground">Nenhuma gaiola cadastrada.</p>
                <p className="text-sm text-gray-400 mt-1">Clique em "Nova Gaiola" para começar.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cages.map((cage) => {
                const occupancy = (cage.currentQuantity / cage.capacity) * 100;
                const isFull = occupancy >= 100;
                const isNearFull = occupancy >= 90 && !isFull;

                return (
                    <Card
                        key={cage.id}
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setLocation(`/production/cages/${cage.id}`)}
                    >
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{cage.name}</CardTitle>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-bold uppercase ${cage.status === "active"
                                            ? "bg-green-100 text-green-800"
                                            : cage.status === "maintenance"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-gray-100 text-gray-800"
                                        }`}
                                >
                                    {cage.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Ocupação</span>
                                        <span className="font-medium">
                                            {formatQuantity(cage.currentQuantity)} / {formatQuantity(cage.capacity)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                        <div
                                            className={`h-2.5 rounded-full ${isFull
                                                    ? "bg-red-500"
                                                    : isNearFull
                                                        ? "bg-amber-500"
                                                        : "bg-green-500"
                                                }`}
                                            style={{ width: `${Math.min(occupancy, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground flex justify-between">
                                    <span>ID: {cage.id.slice(0, 8)}</span>
                                    {isFull && <span className="text-red-600 font-bold">LOTADA</span>}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
