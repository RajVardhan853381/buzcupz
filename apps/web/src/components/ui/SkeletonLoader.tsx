import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton rounded-lg', className)} />
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <Skeleton className="w-full h-32 rounded-xl mb-3" />
      <Skeleton className="w-3/4 h-5 mb-2" />
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-1/4 h-5" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <Skeleton className="w-16 h-16 rounded-xl mx-auto mb-3" />
      <Skeleton className="w-20 h-5 mx-auto mb-2" />
      <Skeleton className="w-16 h-4 mx-auto" />
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <Skeleton className="w-full h-4 mb-2" />
      <Skeleton className="w-3/4 h-4 mb-3" />
      <div className="flex justify-between">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-16 h-5" />
      </div>
    </div>
  );
}
