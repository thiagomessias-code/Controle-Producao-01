import { Card, CardContent } from "./ui/Card";
import { Skeleton } from "./ui/skeleton";

export function SkeletonCard() {
  return (
    <Card>
      <CardContent className="pt-6">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-10 w-1/2 mb-4" />
        <Skeleton className="h-3 w-full" />
      </CardContent>
    </Card>
  );
}

export function SkeletonGroupCard() {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
