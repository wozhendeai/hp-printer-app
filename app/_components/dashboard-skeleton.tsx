import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-5 gap-3">
        <Skeleton className="col-span-3 h-36 rounded-2xl" />
        <Skeleton className="col-span-2 h-36 rounded-2xl" />
      </div>
      <Skeleton className="h-20 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12 rounded-full" />
        <Skeleton className="h-12 rounded-full" />
      </div>
    </div>
  );
}
